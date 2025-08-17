import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../../lib/auth';
import { executeQuery } from '../../../lib/db';

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
        message: 'Bạn chưa đăng nhập'
      });
    }
    
    // Verify token
    const decodedToken = verifyToken(token);
    
    if (!decodedToken || !decodedToken.id) {
      return res.status(401).json({
        success: false,
        message: 'Phiên đăng nhập không hợp lệ'
      });
    }

    // Lấy tham số search từ query
    const search = req.query.search ? String(req.query.search).trim() : '';
    
    // Xây dựng câu lệnh SQL dựa trên tham số tìm kiếm
    let query = `
      SELECT o.id, o.order_status, o.payment_status, o.payment_method, 
             o.total, o.created_at, COUNT(oi.id) as items_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = ?
    `;
    
    const queryParams: any[] = [decodedToken.id];
    
    if (search) {
      query += ` AND (o.id LIKE ? OR oi.product_name LIKE ?)`;
      queryParams.push(`%${search}%`);
      queryParams.push(`%${search}%`);
    }
    
    query += ` GROUP BY o.id ORDER BY o.created_at DESC`;
    
    // Lấy danh sách đơn hàng của người dùng
    const orders = await executeQuery({
      query,
      values: queryParams,
    });
    
    // Xử lý dữ liệu trả về để tránh lỗi serialize Date
    const serializedOrders = JSON.parse(JSON.stringify(orders));

    res.status(200).json({
      success: true,
      orders: serializedOrders
    });
    
  } catch (error: any) {
    console.error('Orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách đơn hàng',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 