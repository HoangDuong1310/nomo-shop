import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken, getUserByEmail } from '../../../lib/auth';
import { executeQuery } from '../../../lib/db';

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

    const { name, phone, address } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!name || !phone || !address) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin'
      });
    }

    // Cập nhật thông tin người dùng
    await executeQuery({
      query: `
        UPDATE users
        SET name = ?, phone = ?, address = ?, updated_at = NOW()
        WHERE id = ?
      `,
      values: [name, phone, address, decodedToken.id],
    });

    // Lấy thông tin người dùng sau khi cập nhật
    const user = await getUserByEmail(decodedToken.email);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin người dùng'
      });
    }

    // Trả về thông tin người dùng (không bao gồm password)
    const { password, ...userWithoutPassword } = user;
    
    res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin thành công',
      user: userWithoutPassword
    });
    
  } catch (error: any) {
    console.error('Update account error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật thông tin',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 