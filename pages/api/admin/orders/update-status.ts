import { NextApiRequest, NextApiResponse } from 'next';
import { executeQuery } from '../../../../lib/db';
import { verifyToken } from '../../../../lib/auth';
import { EmailService } from '../../../../lib/email-service';

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

    // Lấy thông tin từ body request
    const { orderId, orderStatus, paymentStatus } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!orderId || !orderStatus || !paymentStatus) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu thông tin cần thiết'
      });
    }

    // Kiểm tra đơn hàng có tồn tại không
    const orderResult = await executeQuery({
      query: `
        SELECT o.*, u.name as user_name, u.email as user_email, u.phone as user_phone
        FROM orders o 
        LEFT JOIN users u ON o.user_id = u.id 
        WHERE o.id = ?
      `,
      values: [orderId],
    });

    if ((orderResult as any[]).length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng'
      });
    }

    const currentOrder = (orderResult as any[])[0];
    const oldOrderStatus = currentOrder.order_status;
    const oldPaymentStatus = currentOrder.payment_status;

    const validOrderStatuses = ['pending', 'confirmed', 'processing', 'shipping', 'completed', 'cancelled'];
    const validPaymentStatuses = ['pending', 'paid', 'failed'];

    // Kiểm tra giá trị hợp lệ cho trạng thái đơn hàng
    if (!validOrderStatuses.includes(orderStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái đơn hàng không hợp lệ'
      });
    }

    // Kiểm tra giá trị hợp lệ cho trạng thái thanh toán
    if (!validPaymentStatuses.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái thanh toán không hợp lệ'
      });
    }

    // Cập nhật trạng thái đơn hàng
    await executeQuery({
      query: `
        UPDATE orders 
        SET order_status = ?, payment_status = ?, updated_at = NOW()
        WHERE id = ?
      `,
      values: [orderStatus, paymentStatus, orderId],
    });

    // 🔥 GỬI EMAIL CẬP NHẬT TRẠNG THÁI (nếu có thay đổi)
    try {
      // Chỉ gửi email nếu trạng thái đơn hàng thay đổi
      if (orderStatus !== oldOrderStatus && currentOrder.user_email) {
        // Lấy thông tin chi tiết đơn hàng để gửi email
        const orderItemsResult = await executeQuery({
          query: 'SELECT * FROM order_items WHERE order_id = ?',
          values: [orderId],
        });

        const orderForEmail = {
          id: currentOrder.id,
          user_id: currentOrder.user_id || 'guest',
          user_name: currentOrder.user_name || currentOrder.customer_name,
          user_email: currentOrder.user_email || currentOrder.customer_email,
          user_phone: currentOrder.user_phone || currentOrder.customer_phone,
          total: currentOrder.total,
          order_status: orderStatus,
          payment_status: paymentStatus,
          address: currentOrder.address,
          note: currentOrder.note || '',
          created_at: currentOrder.created_at,
          items: (orderItemsResult as any[]).map((item: any) => ({
            name: item.product_name,
            quantity: item.quantity,
            price: item.price,
            image: ''
          }))
        };

        // Gửi email cập nhật trạng thái
        await EmailService.sendOrderStatusUpdate(orderForEmail, oldOrderStatus, orderStatus);
        console.log(`✅ Order status update email sent to ${orderForEmail.user_email}`);
      }

      // Gửi email payment confirmation nếu payment status thay đổi từ pending -> paid
      if (paymentStatus === 'paid' && oldPaymentStatus !== 'paid' && currentOrder.user_email) {
        const orderForEmail = {
          id: currentOrder.id,
          user_id: currentOrder.user_id || 'guest',
          user_name: currentOrder.user_name || currentOrder.customer_name,
          user_email: currentOrder.user_email || currentOrder.customer_email,
          user_phone: currentOrder.user_phone || currentOrder.customer_phone,
          total: currentOrder.total,
          order_status: orderStatus,
          payment_status: paymentStatus,
          address: currentOrder.address,
          note: currentOrder.note || '',
          created_at: currentOrder.created_at,
          items: []
        };

        // Gửi email xác nhận thanh toán
        await EmailService.sendPaymentConfirmation(orderForEmail);
        console.log(`✅ Payment confirmation email sent to ${orderForEmail.user_email}`);

        // Gửi alert email cho admin về thanh toán thành công
        await EmailService.sendPaymentReceivedAlert(orderForEmail);
        console.log(`✅ Payment received alert sent to admin`);
      }

    } catch (emailError) {
      console.error('⚠️ Failed to send status update emails:', emailError);
      // Không throw error để không ảnh hưởng đến status update
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