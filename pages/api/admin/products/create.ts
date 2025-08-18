import { NextApiRequest, NextApiResponse } from 'next';
import { executeQuery } from '../../../../lib/db';
import { verifyToken } from '../../../../lib/auth';
import { getTokenFromRequest } from '../../../lib/auth-utils';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Chỉ chấp nhận phương thức POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Lấy token từ cookie hoặc Authorization header
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

    // Lấy dữ liệu từ body request
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
    if (!name || price === undefined || !category_id) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin bắt buộc (tên, giá, danh mục)'
      });
    }

    // Kiểm tra giá
    if (typeof price !== 'number' || price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Giá sản phẩm phải là số và lớn hơn 0'
      });
    }

    // Kiểm tra giá khuyến mãi
    if (sale_price !== null && (typeof sale_price !== 'number' || sale_price <= 0 || sale_price >= price)) {
      return res.status(400).json({
        success: false,
        message: 'Giá khuyến mãi phải là số, lớn hơn 0 và nhỏ hơn giá gốc'
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

    // Tạo ID cho sản phẩm mới
    const productId = uuidv4();

    // Thêm sản phẩm mới
    await executeQuery({
      query: `
        INSERT INTO products (
          id, name, description, price, sale_price, image, 
          category_id, stock_quantity, is_featured, is_active,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `,
      values: [
        productId,
        name,
        description || '',
        price,
        sale_price || null,
        image || null,
        category_id,
        stock_quantity || 0,
        Boolean(is_featured),
        is_active !== undefined ? Boolean(is_active) : true
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Thêm sản phẩm thành công',
      product_id: productId
    });
    
  } catch (error: any) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi thêm sản phẩm mới',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}