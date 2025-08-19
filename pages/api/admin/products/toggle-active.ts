import { NextApiRequest, NextApiResponse } from 'next';
import { executeQuery } from '../../../../lib/db';
import { verifyToken } from '../../../../lib/auth';
import { getTokenFromRequest } from '../../../../lib/auth-utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
  try {
    const token = getTokenFromRequest(req);
    if (!token) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) return res.status(401).json({ success: false, message: 'Invalid session' });

    const userResult: any = await executeQuery({
      query: 'SELECT role FROM users WHERE id = ?',
      values: [decoded.id]
    });
    if (!userResult.length || userResult[0].role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { id } = req.body || {};
    if (!id) return res.status(400).json({ success: false, message: 'Missing product id' });

    const rows: any = await executeQuery({
      query: 'SELECT is_active FROM products WHERE id = ?',
      values: [id]
    });
    if (!rows.length) return res.status(404).json({ success: false, message: 'Product not found' });

    const current = !!rows[0].is_active;
    const next = !current;
    await executeQuery({
      query: 'UPDATE products SET is_active = ?, updated_at = NOW() WHERE id = ?',
      values: [next, id]
    });

    return res.status(200).json({ success: true, id, is_active: next });
  } catch (e: any) {
    console.error('toggle-active error:', e);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
}
