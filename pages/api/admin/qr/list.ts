import type { NextApiRequest, NextApiResponse } from 'next';
import { listRedirects } from '../../../../lib/qr-redirects';
import { verifyToken } from '../../../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });
  try {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ message: 'Unauthorized' });
    const decoded = verifyToken(auth.replace('Bearer ', ''));
    if (!decoded || decoded.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    const items = await listRedirects();
    res.status(200).json({ items });
  } catch (e: any) {
    res.status(500).json({ message: e.message || 'Error' });
  }
}
