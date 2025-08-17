import { NextApiRequest, NextApiResponse } from 'next';
import { executeQuery } from '../../../../lib/db';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    const { email } = req.body;

    // Validate input
    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Validate email format
    if (!/\S+@\S+\.\S+/.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Email không hợp lệ'
      });
    }

    // Check if email already exists
    const existingResult = await executeQuery({
      query: 'SELECT id, is_active FROM shop_email_notifications WHERE email = ?',
      values: [trimmedEmail]
    });

    if ((existingResult as any[]).length > 0) {
      const existing = (existingResult as any[])[0];
      
      if (existing.is_active) {
        return res.status(200).json({
          success: true,
          message: 'Email này đã được đăng ký trước đó'
        });
      } else {
        // Reactivate existing subscription
        await executeQuery({
          query: 'UPDATE shop_email_notifications SET is_active = true, updated_at = NOW() WHERE email = ?',
          values: [trimmedEmail]
        });

        return res.status(200).json({
          success: true,
          message: 'Đăng ký thành công! Chúng tôi sẽ thông báo khi cửa hàng mở lại.'
        });
      }
    }

    // Create new subscription
    const subscriptionId = uuidv4();
    
    await executeQuery({
      query: 'INSERT INTO shop_email_notifications (id, email, is_active) VALUES (?, ?, ?)',
      values: [subscriptionId, trimmedEmail, true]
    });

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công! Chúng tôi sẽ thông báo khi cửa hàng mở lại.'
    });

  } catch (error: any) {
    console.error('Subscribe notification error:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(200).json({
        success: true,
        message: 'Email này đã được đăng ký trước đó'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi đăng ký. Vui lòng thử lại sau.'
    });
  }
}
