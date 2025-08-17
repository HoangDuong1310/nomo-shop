import { NextApiRequest, NextApiResponse } from 'next';
import { EmailService } from '../../../lib/email-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  try {
    const { email, template_type } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }

    // Initialize email service
    await EmailService.init();

    let success = false;
    let message = '';

    switch (template_type) {
      case 'welcome':
        success = await EmailService.sendWelcomeEmail({
          name: 'Test User',
          email: email
        });
        message = 'Welcome email sent';
        break;

      case 'order_confirmation':
        success = await EmailService.sendOrderConfirmation({
          id: 'test-order-12345',
          user_id: 'test-user-id',
          user_name: 'Nguyễn Văn Test',
          user_email: email,
          user_phone: '0123456789',
          total: 299000,
          order_status: 'pending',
          payment_status: 'pending',
          address: '123 Đường Test, Phường Test, Quận Test, TP.HCM',
          note: 'Giao hàng ngoài giờ hành chính',
          created_at: new Date().toISOString(),
          items: [
            {
              name: 'Sản phẩm Test 1',
              quantity: 2,
              price: 99000,
              image: 'test-image.jpg'
            },
            {
              name: 'Sản phẩm Test 2',
              quantity: 1,
              price: 101000,
              image: 'test-image-2.jpg'
            }
          ]
        });
        message = 'Order confirmation email sent';
        break;

      case 'payment_success':
        success = await EmailService.sendPaymentConfirmation({
          id: 'test-order-12345',
          user_id: 'test-user-id',
          user_name: 'Nguyễn Văn Test',
          user_email: email,
          user_phone: '0123456789',
          total: 299000,
          order_status: 'confirmed',
          payment_status: 'paid',
          address: '123 Đường Test, Phường Test, Quận Test, TP.HCM',
          created_at: new Date().toISOString(),
          items: []
        });
        message = 'Payment success email sent';
        break;

      case 'order_status_update':
        success = await EmailService.sendOrderStatusUpdate({
          id: 'test-order-12345',
          user_id: 'test-user-id',
          user_name: 'Nguyễn Văn Test',
          user_email: email,
          user_phone: '0123456789',
          total: 299000,
          order_status: 'shipping',
          payment_status: 'paid',
          address: '123 Đường Test, Phường Test, Quận Test, TP.HCM',
          created_at: new Date().toISOString(),
          items: []
        }, 'processing', 'shipping');
        message = 'Order status update email sent';
        break;

      case 'admin_new_order':
        success = await EmailService.sendNewOrderAlert({
          id: 'test-order-12345',
          user_id: 'test-user-id',
          user_name: 'Nguyễn Văn Test',
          user_email: 'customer@example.com',
          user_phone: '0123456789',
          total: 299000,
          order_status: 'pending',
          payment_status: 'pending',
          address: '123 Đường Test, Phường Test, Quận Test, TP.HCM',
          note: 'Giao hàng ngoài giờ hành chính',
          created_at: new Date().toISOString(),
          items: [
            {
              name: 'Sản phẩm Test 1',
              quantity: 2,
              price: 99000
            },
            {
              name: 'Sản phẩm Test 2',
              quantity: 1,
              price: 101000
            }
          ]
        });
        message = 'Admin new order alert sent';
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid template type. Supported: welcome, order_confirmation, payment_success, order_status_update, admin_new_order'
        });
    }

    res.status(200).json({
      success,
      message,
      template_type,
      recipient: email,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Email test failed:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}
