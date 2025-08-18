import { NextApiRequest, NextApiResponse } from 'next';
import { executeQuery } from '../../../../lib/db';
import { verifyToken } from '../../../../lib/auth';
import { getTokenFromRequest } from '../../../lib/auth-utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const token = getTokenFromRequest(req);
  
  // Nếu không có token
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
  }
  
  // Verify token
  const decodedToken = verifyToken(token);
  
  if (!decodedToken || !decodedToken.id) {
    return res.status(401).json({
      success: false,
      message: 'Invalid session'
    });
  }

  // Kiểm tra quyền admin
  const userResult = await executeQuery({
    query: 'SELECT role FROM users WHERE id = ?',
    values: [decodedToken.id],
  });

  if ((userResult as any[]).length === 0 || (userResult as any[])[0].role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  // Xử lý các phương thức khác nhau
  switch (req.method) {
    case 'PUT':
      return updateCategory(req, res, String(id));
    case 'DELETE':
      return deleteCategory(req, res, String(id));
    default:
      return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}

// Cập nhật thông tin danh mục
async function updateCategory(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    const { name, description } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Tên danh mục không được để trống'
      });
    }

    // Kiểm tra danh mục có tồn tại không
    const checkCategory = await executeQuery({
      query: 'SELECT * FROM categories WHERE id = ?',
      values: [id],
    });

    if ((checkCategory as any[]).length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Danh mục không tồn tại'
      });
    }

    // Kiểm tra tên danh mục đã tồn tại chưa (loại trừ chính nó)
    const existingCategory = await executeQuery({
      query: 'SELECT * FROM categories WHERE name = ? AND id != ?',
      values: [name, id],
    });

    if ((existingCategory as any[]).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Danh mục với tên này đã tồn tại'
      });
    }

    // Cập nhật danh mục
    await executeQuery({
      query: 'UPDATE categories SET name = ?, description = ?, updated_at = NOW() WHERE id = ?',
      values: [name, description || null, id],
    });

    return res.status(200).json({
      success: true,
      message: 'Cập nhật danh mục thành công'
    });
  } catch (error: any) {
    console.error('Update category error:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật danh mục',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Xóa danh mục
async function deleteCategory(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    // Kiểm tra danh mục có tồn tại không
    const checkCategory = await executeQuery({
      query: 'SELECT * FROM categories WHERE id = ?',
      values: [id],
    });

    if ((checkCategory as any[]).length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Danh mục không tồn tại'
      });
    }

    // Kiểm tra xem danh mục có sản phẩm nào không
    const checkProducts = await executeQuery({
      query: 'SELECT COUNT(*) as product_count FROM products WHERE category_id = ?',
      values: [id],
    });

    const productCount = (checkProducts as any[])[0].product_count;

    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa danh mục này vì có ${productCount} sản phẩm thuộc danh mục này`
      });
    }

    // Xóa danh mục
    await executeQuery({
      query: 'DELETE FROM categories WHERE id = ?',
      values: [id],
    });

    return res.status(200).json({
      success: true,
      message: 'Xóa danh mục thành công'
    });
  } catch (error: any) {
    console.error('Delete category error:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xóa danh mục',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}