import { NextApiRequest } from 'next';

// Utility function để lấy token từ cookie hoặc Authorization header
export function getTokenFromRequest(req: NextApiRequest): string | null {
  // Thử lấy từ cookie trước
  let token = req.cookies.auth_token;
  
  // Nếu không có cookie, thử lấy từ Authorization header
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }
  
  return token || null;
}
