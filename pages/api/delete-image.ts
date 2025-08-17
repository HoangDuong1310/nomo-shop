import { NextApiRequest, NextApiResponse } from 'next';
import { promises as fs } from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageUrl } = req.body;
    
    if (!imageUrl || !imageUrl.startsWith('/uploads/')) {
      return res.status(400).json({ error: 'Invalid image URL' });
    }

    const filename = path.basename(imageUrl);
    const filePath = path.join(process.cwd(), 'public/uploads', filename);

    try {
      await fs.access(filePath);
      await fs.unlink(filePath);
      res.status(200).json({ success: true, message: 'Image deleted successfully' });
    } catch (error) {
      // File doesn't exist or can't be deleted
      res.status(200).json({ success: true, message: 'Image not found or already deleted' });
    }

  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({ error: 'Server error' });
  }
}
