import { NextApiRequest, NextApiResponse } from 'next';
import { serialize } from 'cookie';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Chỉ chấp nhận phương thức POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Xóa cookie auth_token
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: -1, // Giá trị âm để xóa cookie
      path: '/',
      sameSite: 'strict' as const,
    };
    
    res.setHeader('Set-Cookie', serialize('auth_token', '', cookieOptions));
    
    // Trả về thành công
    res.status(200).json({
      success: true,
      message: 'Đăng xuất thành công'
    });
    
  } catch (error: any) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi đăng xuất. Vui lòng thử lại sau.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 