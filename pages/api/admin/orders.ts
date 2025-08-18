import { NextApiRequest, NextApiResponse } from 'next';
import { executeQuery, executeQueryWithPagination } from '../../../lib/db';
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
    const status = req.query.status ? String(req.query.status) : '';

    // Tạo câu truy vấn SQL cơ bản
    let query = `
      SELECT o.id, o.full_name, o.phone, o.total, o.order_status,
             o.payment_status, o.payment_method, o.created_at
      FROM orders o
      WHERE 1=1
    `;
    
    // Array để lưu các giá trị tham số cho câu truy vấn
    const queryParams: any[] = [];

    // Thêm điều kiện tìm kiếm
    if (search) {
      query += ` AND (
        o.id LIKE ? 
        OR o.full_name LIKE ? 
        OR o.phone LIKE ? 
        OR o.address LIKE ?
      )`;
      const searchValue = `%${search}%`;
      queryParams.push(searchValue, searchValue, searchValue, searchValue);
    }

    // Thêm điều kiện lọc theo trạng thái
    if (status) {
      query += ' AND o.order_status = ?';
      queryParams.push(status);
    }

    // Câu truy vấn đếm tổng số đơn hàng theo điều kiện tìm kiếm
    let countQuery = query.replace(
      'SELECT o.id, o.full_name, o.phone, o.total, o.order_status, o.payment_status, o.payment_method, o.created_at',
      'SELECT COUNT(*) as total'
    );

    // Thêm phân trang vào câu truy vấn chính
    query += ' ORDER BY o.created_at DESC';

    // Thực hiện cả hai truy vấn
    const totalResult = await executeQuery({
      query: countQuery,
      values: queryParams, // Sử dụng các tham số hiện tại (không có LIMIT/OFFSET)
    });

    const orders = await executeQueryWithPagination({
      query,
      values: queryParams,
      limit,
      offset
    });

    // Lấy tổng số đơn hàng từ kết quả đếm
    const total = (totalResult as any[])[0].total || 0;

    // Xử lý dữ liệu để tránh lỗi serialize Date
    const serializedOrders = JSON.parse(JSON.stringify(orders));

    // Trả về kết quả
    res.status(200).json({
      success: true,
      orders: serializedOrders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
    
  } catch (error: any) {
    console.error('Orders API error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách đơn hàng',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 