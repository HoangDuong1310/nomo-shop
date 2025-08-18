import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../../../lib/auth';
import { getTokenFromRequest } from '../../../../lib/auth-utils';
import { executeQuery } from '../../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Chỉ cho phép trong development mode
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ message: 'Not found' });
  }

  const token = getTokenFromRequest(req);
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized'
    });
  }
  
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

  return res.status(200).json({
    message: 'Debug endpoints are disabled in production',
    environment: process.env.NODE_ENV
  });
}