import { NextApiRequest, NextApiResponse } from 'next';
import { executeQuery, executeQueryWithPagination } from '../../../../lib/db';
import { verifyToken } from '../../../../lib/auth';
import { getTokenFromRequest } from '../../../../lib/auth-utils';

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

    // Lấy thống kê khách hàng
    const statsQuery = await executeQuery({
      query: `
        SELECT 
          (SELECT COUNT(*) FROM users WHERE role = 'user') as total_customers,
          (SELECT COUNT(*) FROM users WHERE role = 'user' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)) as new_customers_this_month,
          (SELECT COUNT(DISTINCT user_id) FROM orders WHERE user_id IS NOT NULL) as active_customers,
          (SELECT COUNT(*) FROM orders) as total_orders,
          (SELECT COALESCE(SUM(total), 0) FROM orders) as total_revenue
      `,
      values: [],
    });

    // Tạo câu truy vấn SQL cơ bản cho danh sách khách hàng
    let query = `
      SELECT 
        u.*,
        (SELECT COUNT(*) FROM orders WHERE user_id = u.id) as orders_count,
        (SELECT COALESCE(SUM(total), 0) FROM orders WHERE user_id = u.id) as total_spent
      FROM users u
      WHERE u.role = 'user'
    `;
    
    // Array để lưu các giá trị tham số cho câu truy vấn
    const queryParams: any[] = [];

    // Thêm điều kiện tìm kiếm
    if (search) {
      query += ` AND (
        u.name LIKE ? 
        OR u.email LIKE ? 
        OR u.phone LIKE ?
      )`;
      const searchValue = `%${search}%`;
      queryParams.push(searchValue, searchValue, searchValue);
    }

    // Câu truy vấn đếm tổng số khách hàng theo điều kiện tìm kiếm
    let countQuery = `
      SELECT COUNT(*) as total
      FROM users u
      WHERE u.role = 'user'
    `;
    
    if (search) {
      countQuery += ` AND (
        u.name LIKE ? 
        OR u.email LIKE ? 
        OR u.phone LIKE ?
      )`;
    }

    // Thêm phân trang và sắp xếp vào câu truy vấn chính
    query += ' ORDER BY u.created_at DESC';

    // Thực hiện các truy vấn
    const totalResult = await executeQuery({
      query: countQuery,
      values: search ? [
        `%${search}%`, 
        `%${search}%`, 
        `%${search}%`
      ] : [],
    });

    const users = await executeQueryWithPagination({
      query,
      values: queryParams,
      limit,
      offset
    });

    // Lấy tổng số khách hàng từ kết quả đếm
    const total = (totalResult as any[])[0].total || 0;

    // Xử lý dữ liệu để tránh lỗi serialize Date
    const serializedUsers = JSON.parse(JSON.stringify(users));
    const serializedStats = JSON.parse(JSON.stringify((statsQuery as any)[0]));

    // Trả về kết quả
    res.status(200).json({
      success: true,
      users: serializedUsers,
      stats: serializedStats,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
    
  } catch (error: any) {
    console.error('Customers API error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách khách hàng',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}