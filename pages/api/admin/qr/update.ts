import type { NextApiRequest, NextApiResponse } from 'next';
import { createOrUpdateRedirect } from '../../../../lib/qr-redirects';
import { verifyToken } from '../../../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });

  try {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ message: 'Unauthorized' });
    const token = auth.replace('Bearer ', '');
    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

    const { slug, target_url, is_active = true } = req.body || {};
    if (!slug || !target_url) return res.status(400).json({ message: 'slug & target_url required' });

    const updated = await createOrUpdateRedirect(slug, target_url, !!is_active, decoded.id);
    return res.status(200).json({ message: 'Updated', redirect: updated });
  } catch (e: any) {
    return res.status(400).json({ message: e.message || 'Error' });
  }
}
