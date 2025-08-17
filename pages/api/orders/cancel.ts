import { NextApiRequest, NextApiResponse } from 'next';
import { executeQuery } from '../../../lib/db';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Chỉ chấp nhận phương thức PUT
  if (req.method !== 'PUT') {
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

    const { orderId, cancelReason } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu mã đơn hàng'
      });
    }

    // Kiểm tra đơn hàng có tồn tại và thuộc về người dùng không
    const orderResult = await executeQuery({
      query: `
        SELECT id, order_status, user_id, phone
        FROM orders
        WHERE id = ?
      `,
      values: [orderId],
    });

    if ((orderResult as any[]).length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    const order = (orderResult as any[])[0];
    
    // Kiểm tra xem đơn hàng có thuộc về người dùng hiện tại không
    // Nếu user_id == null (đơn hàng của khách không đăng nhập), kiểm tra theo số điện thoại
    if (order.user_id && order.user_id !== decodedToken.id) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền hủy đơn hàng này'
      });
    }

    // Kiểm tra xem đơn hàng có thể hủy không (chỉ hủy được đơn hàng pending)
    if (order.order_status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể hủy đơn hàng đang ở trạng thái chờ xác nhận'
      });
    }

    try {
      // Cố gắng cập nhật với cancel_reason
      await executeQuery({
        query: `
          UPDATE orders
          SET order_status = 'cancelled', cancel_reason = ?, payment_status = 'failed', updated_at = NOW()
          WHERE id = ? AND payment_status = 'pending'
        `,
        values: [cancelReason || 'Hủy bởi khách hàng', orderId],
      });
    } catch (error: any) {
      // Nếu lỗi liên quan đến cancel_reason, thực hiện cập nhật không có cancel_reason
      if (error.code === 'ER_BAD_FIELD_ERROR' && error.message.includes('cancel_reason')) {
        await executeQuery({
          query: `
            UPDATE orders
            SET order_status = 'cancelled', payment_status = 'failed', updated_at = NOW()
            WHERE id = ? AND payment_status = 'pending'
          `,
          values: [orderId],
        });
      } else {
        // Nếu là lỗi khác, ném lại
        throw error;
      }
    }

    res.status(200).json({
      success: true,
      message: 'Hủy đơn hàng thành công'
    });
    
  } catch (error: any) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi hủy đơn hàng',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 