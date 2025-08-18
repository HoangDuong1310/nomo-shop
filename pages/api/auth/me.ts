import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken, getUserByEmail } from '../../../lib/auth';
import { getTokenFromRequest } from '../../../lib/auth-utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Chỉ chấp nhận phương thức GET
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Lấy token từ cookie hoặc Authorization header
    let token = req.cookies.auth_token;
    
    // Nếu không có cookie, thử lấy từ Authorization header
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    // Nếu không có token
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy token xác thực'
      });
    }
    
    // Verify token
    const decodedToken = verifyToken(token);
    
    if (!decodedToken || !decodedToken.id) {
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ hoặc đã hết hạn'
      });
    }
    
    // Lấy thông tin người dùng từ email trong token
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
      user: userWithoutPassword
    });
    
  } catch (error: any) {
    console.error('Auth me error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xác thực người dùng',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 