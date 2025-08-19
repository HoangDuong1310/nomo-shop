import type { NextApiRequest, NextApiResponse } from 'next';
import { getRedirectBySlug } from '../../../lib/qr-redirects';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { slug } = req.query;
  if (!slug || typeof slug !== 'string') return res.status(400).json({ message: 'Invalid slug' });
  const record = await getRedirectBySlug(slug.toLowerCase());
  if (!record) return res.status(404).json({ message: 'Not found' });
  return res.status(200).json({ redirect: record });
}
