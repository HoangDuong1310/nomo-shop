import { NextApiRequest, NextApiResponse } from 'next';
import { executeQuery } from '../../../lib/db';
import { verifyToken } from '../../../lib/auth';
import { getTokenFromRequest } from '../../../lib/auth-utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Chỉ chấp nhận phương thức GET
  if (req.method !== 'GET') {
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

    // Lấy tham số phân trang với validation mạnh mẽ
    const page = Math.max(1, parseInt(String(req.query.page)) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(String(req.query.limit)) || 10));
    const offset = (page - 1) * limit;
    const search = req.query.search ? String(req.query.search) : '';
    const category = req.query.category ? String(req.query.category) : '';

    // Tạo câu truy vấn SQL cơ bản
    let query = `
      SELECT p.*, c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    
    // Array để lưu các giá trị tham số cho câu truy vấn
    const queryParams: any[] = [];

    // Thêm điều kiện tìm kiếm
    if (search) {
      query += ` AND (
        p.name LIKE ? 
        OR p.description LIKE ?
      )`;
      const searchValue = `%${search}%`;
      queryParams.push(searchValue, searchValue);
    }

    // Thêm điều kiện lọc theo danh mục
    if (category) {
      query += ' AND p.category_id = ?';
      queryParams.push(category);
    }

    // Câu truy vấn đếm tổng số sản phẩm theo điều kiện tìm kiếm
    let countQuery = query.replace(
      'SELECT p.*, c.name AS category_name',
      'SELECT COUNT(*) as total'
    );

    // Thêm phân trang và sắp xếp vào câu truy vấn chính
    query += ' ORDER BY p.is_featured DESC, p.created_at DESC LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);

    // Thực hiện cả hai truy vấn
    const totalResult = await executeQuery({
      query: countQuery,
      values: [...queryParams.slice(0, queryParams.length - 2)], // Không cần LIMIT và OFFSET cho câu đếm
    });

    const products = await executeQuery({
      query,
      values: queryParams,
    });

    // Lấy tổng số sản phẩm từ kết quả đếm
    const total = (totalResult as any[])[0].total || 0;

    // Xử lý dữ liệu để tránh lỗi serialize Date
    const serializedProducts = JSON.parse(JSON.stringify(products));

    // Trả về kết quả
    res.status(200).json({
      success: true,
      products: serializedProducts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
    
  } catch (error: any) {
    console.error('Products API error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách sản phẩm',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}