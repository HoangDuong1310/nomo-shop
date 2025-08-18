import { NextApiRequest, NextApiResponse } from 'next';
import { executeQuery } from '../../../lib/db';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Chỉ chấp nhận phương thức GET
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Lấy token từ cookie
    const token = req.cookies.auth_token;
    
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
    const status = req.query.status ? String(req.query.status) : '';

    // Xây dựng phần WHERE động và tham số (chưa gồm LIMIT/OFFSET)
    let whereClause = 'WHERE 1=1';
    const baseParams: any[] = [];

    if (search) {
      whereClause += ` AND (o.id LIKE ? OR o.full_name LIKE ? OR o.phone LIKE ? OR o.address LIKE ?)`;
      const sv = `%${search}%`;
      baseParams.push(sv, sv, sv, sv);
    }

    if (status) {
      whereClause += ' AND o.order_status = ?';
      baseParams.push(status);
    }

    // Câu truy vấn đếm
    const countQuery = `SELECT COUNT(*) as total FROM orders o ${whereClause}`;
    const totalResult = await executeQuery({
      query: countQuery,
      values: baseParams,
    });

    // Bảo đảm limit/offset hợp lệ và tránh giá trị bất thường
    const safeLimit = Math.min(Math.max(limit, 1), 100); // giới hạn tối đa 100 / trang
    const safeOffset = Math.max(offset, 0);

    // Câu truy vấn lấy dữ liệu
    const dataQuery = `
      SELECT o.id, o.full_name, o.phone, o.total, o.order_status,
             o.payment_status, o.payment_method, o.created_at
      FROM orders o
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT ${safeLimit} OFFSET ${safeOffset}
    `;

    // Lưu ý: Inject trực tiếp LIMIT/OFFSET (đã sanitize) để tránh lỗi một số version MySQL với placeholder LIMIT ? OFFSET ?
    const orders = await executeQuery({
      query: dataQuery,
      values: baseParams,
    });

    const totalRow = (totalResult as any[])[0];
    const total = totalRow ? (totalRow as any).total : 0;

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