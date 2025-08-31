import { NextApiRequest, NextApiResponse } from 'next';
import { executeQuery } from '../../../lib/db';
import { verifyToken } from '../../../lib/auth';
import PushNotificationService from '../../../lib/push-notification-service';

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

    // Kiểm tra xem người dùng có quyền admin không
    const userResult = await executeQuery({
      query: 'SELECT role FROM users WHERE id = ?',
      values: [decodedToken.id],
    });

    const userRole = (userResult as any[])[0]?.role;
    
    if (!userRole || userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền thực hiện hành động này'
      });
    }

    const { orderId, orderStatus, paymentStatus } = req.body;

    if (!orderId || (!orderStatus && !paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin cập nhật'
      });
    }

    // Xây dựng câu truy vấn cập nhật
    let query = 'UPDATE orders SET ';
    const values: any[] = [];
    const updates: string[] = [];

    if (orderStatus) {
      const validOrderStatuses = ['pending', 'confirmed', 'processing', 'shipping', 'completed', 'cancelled'];
      
      if (!validOrderStatuses.includes(orderStatus)) {
        return res.status(400).json({
          success: false,
          message: 'Trạng thái đơn hàng không hợp lệ'
        });
      }
      
      updates.push('order_status = ?');
      values.push(orderStatus);
    }

    if (paymentStatus) {
      const validPaymentStatuses = ['pending', 'paid', 'failed'];
      
      if (!validPaymentStatuses.includes(paymentStatus)) {
        return res.status(400).json({
          success: false,
          message: 'Trạng thái thanh toán không hợp lệ'
        });
      }
      
      updates.push('payment_status = ?');
      values.push(paymentStatus);
    }

    updates.push('updated_at = NOW()');
    query += updates.join(', ') + ' WHERE id = ?';
    values.push(orderId);

    // Cập nhật đơn hàng
    await executeQuery({
      query,
      values,
    });

    // Send push notification for order status updates
    if (orderStatus) {
      try {
        // Get order and user information
        const orderResult = await executeQuery({
          query: 'SELECT user_id, id FROM orders WHERE id = ?',
          values: [orderId]
        });

        if ((orderResult as any[]).length > 0) {
          const order = (orderResult as any[])[0];
          const statusMessages: { [key: string]: string } = {
            confirmed: 'Đơn hàng của bạn đã được xác nhận',
            processing: 'Đơn hàng của bạn đang được chuẩn bị', 
            shipping: 'Đơn hàng của bạn đã được giao cho đơn vị vận chuyển',
            completed: 'Đơn hàng của bạn đã hoàn thành',
            cancelled: 'Đơn hàng của bạn đã bị hủy'
          };

          const message = statusMessages[orderStatus] || 'Trạng thái đơn hàng đã được cập nhật';
          
          await PushNotificationService.sendOrderStatusNotification(
            order.user_id,
            orderId,
            orderStatus,
            message
          );

          console.log(`Sent push notification for order ${orderId} status change: ${orderStatus}`);
        }
      } catch (pushError) {
        console.error('Error sending push notification for order update:', pushError);
        // Don't fail the whole operation if push notifications fail
      }
    }

    res.status(200).json({
      success: true,
      message: 'Cập nhật trạng thái đơn hàng thành công'
    });
    
  } catch (error: any) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật trạng thái đơn hàng',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 