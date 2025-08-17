import { NextApiRequest, NextApiResponse } from 'next';
import { executeQuery } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const categories = await executeQuery({
      query: 'SELECT * FROM categories ORDER BY name',
    });

    // Hàm serialize để xử lý các trường Date
    const serializedCategories = JSON.parse(JSON.stringify(categories));

    res.status(200).json(serializedCategories);
  } catch (error) {
    console.error('Categories error:', error);
    res.status(500).json({ message: 'Failed to fetch categories', error });
  }
} 