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
    // Lấy token từ cookie
  const token = getTokenFromRequest(req) || req.cookies.auth_token;
    
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

    // Lấy tham số phân trang, tìm kiếm, lọc
    const page = parseInt(String(req.query.page)) || 1;
    const limit = parseInt(String(req.query.limit)) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search ? String(req.query.search) : '';
    const category = req.query.category ? String(req.query.category) : '';

    // WHERE động & params cơ bản
    let whereClause = 'WHERE 1=1';
    const baseParams: any[] = [];

    if (search) {
      whereClause += ' AND (p.name LIKE ? OR p.description LIKE ?)';
      const sv = `%${search}%`;
      baseParams.push(sv, sv);
    }
    if (category) {
      whereClause += ' AND p.category_id = ?';
      baseParams.push(category);
    }

    const countQuery = `SELECT COUNT(*) as total FROM products p LEFT JOIN categories c ON p.category_id = c.id ${whereClause}`;
    const totalResult = await executeQuery({
      query: countQuery,
      values: baseParams,
    });

    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const safeOffset = Math.max(offset, 0);

    const dataQuery = `
      SELECT p.*, c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
      ORDER BY p.is_featured DESC, p.created_at DESC
      LIMIT ${safeLimit} OFFSET ${safeOffset}
    `;

    const products = await executeQuery({
      query: dataQuery,
      values: baseParams,
    });

    const totalRow = (totalResult as any[])[0];
    const total = totalRow ? (totalRow as any).total : 0;

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