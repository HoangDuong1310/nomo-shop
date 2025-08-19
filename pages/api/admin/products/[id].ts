import { NextApiRequest, NextApiResponse } from 'next';
import { executeQuery } from '../../../../lib/db';
import { verifyToken } from '../../../../lib/auth';
import { getTokenFromRequest } from '../../../../lib/auth-utils';

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
    case 'GET':
      return getProduct(req, res, String(id));
    case 'PUT':
      return updateProduct(req, res, String(id));
    case 'DELETE':
      return deleteProduct(req, res, String(id));
    default:
      return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}

// Lấy thông tin chi tiết 1 sản phẩm
async function getProduct(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    const product = await executeQuery({
      query: `
        SELECT p.*, c.name AS category_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id = ?
      `,
      values: [id],
    });

    if ((product as any[]).length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Sản phẩm không tồn tại'
      });
    }

    // Xử lý dữ liệu để tránh lỗi serialize Date
    const serializedProduct = JSON.parse(JSON.stringify((product as any)[0]));

    return res.status(200).json({
      success: true,
      product: serializedProduct
    });
  } catch (error: any) {
    console.error('Get product error:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy thông tin sản phẩm',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Cập nhật thông tin sản phẩm
async function updateProduct(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    const {
      name,
      description,
      price,
      sale_price,
      image,
      category_id,
      stock_quantity,
      is_featured,
      is_active
    } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!name || !price || !category_id) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc (tên, giá, danh mục)'
      });
    }

    // Kiểm tra sản phẩm có tồn tại không
    const checkProduct = await executeQuery({
      query: 'SELECT * FROM products WHERE id = ?',
      values: [id],
    });

    if ((checkProduct as any[]).length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Sản phẩm không tồn tại'
      });
    }

    // Kiểm tra danh mục có tồn tại không
    const checkCategory = await executeQuery({
      query: 'SELECT * FROM categories WHERE id = ?',
      values: [category_id],
    });

    if ((checkCategory as any[]).length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Danh mục không tồn tại'
      });
    }

    // Cập nhật sản phẩm
    await executeQuery({
      query: `
        UPDATE products
        SET name = ?, description = ?, price = ?, sale_price = ?, image = ?,
            category_id = ?, stock_quantity = ?, is_featured = ?, is_active = ?,
            updated_at = NOW()
        WHERE id = ?
      `,
      values: [
        name,
        description,
        price,
        sale_price || null,
        image,
        category_id,
        Number.isFinite(Number(stock_quantity)) ? Number(stock_quantity) : 0,
        typeof is_featured === 'boolean' ? is_featured : !!is_featured,
        typeof is_active === 'boolean' ? is_active : !!is_active,
        id
      ],
    });

    return res.status(200).json({
      success: true,
      message: 'Cập nhật sản phẩm thành công'
    });
  } catch (error: any) {
    console.error('Update product error:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật sản phẩm',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Xóa sản phẩm
async function deleteProduct(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    // Kiểm tra sản phẩm có tồn tại không
    const checkProduct = await executeQuery({
      query: 'SELECT * FROM products WHERE id = ?',
      values: [id],
    });

    if ((checkProduct as any[]).length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Sản phẩm không tồn tại'
      });
    }

    // Kiểm tra xem sản phẩm đã được đặt hàng chưa
    const checkOrderItems = await executeQuery({
      query: 'SELECT * FROM order_items WHERE product_id = ? LIMIT 1',
      values: [id],
    });

    // Nếu sản phẩm đã được đặt hàng, thì chỉ đánh dấu là không còn active
    if ((checkOrderItems as any[]).length > 0) {
      await executeQuery({
        query: 'UPDATE products SET is_active = FALSE, updated_at = NOW() WHERE id = ?',
        values: [id],
      });

      return res.status(200).json({
        success: true,
        message: 'Sản phẩm đã được đánh dấu là không còn hoạt động',
        soft_delete: true
      });
    }

    // Nếu sản phẩm chưa được đặt hàng, thì có thể xóa hoàn toàn
    await executeQuery({
      query: 'DELETE FROM products WHERE id = ?',
      values: [id],
    });

    return res.status(200).json({
      success: true,
      message: 'Xóa sản phẩm thành công'
    });
  } catch (error: any) {
    console.error('Delete product error:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xóa sản phẩm',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}