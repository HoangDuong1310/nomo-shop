import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../../lib/auth';
import { executeQuery } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Lấy token từ cookie
    const token = req.cookies.auth_token;
    
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
        message: 'Invalid token'
      });
    }

    const { name, phone, address } = req.body;

    // Validate input
    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Tên phải có ít nhất 2 ký tự'
      });
    }

    // Validate phone number if provided
    if (phone && !/^(0|\+84)[0-9]{9}$/.test(phone.replace(/\s/g, ''))) {
      return res.status(400).json({
        success: false,
        message: 'Số điện thoại không hợp lệ'
      });
    }

    // Update user profile
    await executeQuery({
      query: `
        UPDATE users 
        SET name = ?, phone = ?, address = ?, updated_at = NOW()
        WHERE id = ?
      `,
      values: [name.trim(), phone?.trim() || null, address?.trim() || null, decodedToken.id]
    });

    // Get updated user info
    const userResult = await executeQuery({
      query: 'SELECT id, name, email, phone, address, role, created_at, updated_at FROM users WHERE id = ?',
      values: [decodedToken.id]
    });

    if ((userResult as any[]).length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    const updatedUser = (userResult as any[])[0];

    res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin thành công',
      user: updatedUser
    });

  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật thông tin',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
