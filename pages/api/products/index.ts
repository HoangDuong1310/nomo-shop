import { NextApiRequest, NextApiResponse } from 'next';
import { executeQuery } from '../../../lib/db';
import { getProductVariants, variantsToOptions } from '../../../lib/variants';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { category } = req.query;
    
    let query = 'SELECT * FROM products';
    let values: any[] = [];
    
    if (category && category !== 'all') {
      query += ' WHERE category_id = ?';
      values.push(category);
    }
    
    query += ' ORDER BY name';
    
    const products = await executeQuery({
      query,
      values,
    });

    const serialize = (data: any) => JSON.parse(JSON.stringify(data));

    // Chuẩn hóa: lấy options từ variants cho từng sản phẩm
    const formattedProducts = await Promise.all((products as any[]).map(async (product) => {
      try {
        const variants = await getProductVariants(product.id);
        const options = variantsToOptions(variants);
        return { ...product, options };
      } catch (error) {
        return { ...product, options: [] };
      }
    }));

    res.status(200).json(serialize(formattedProducts));
  } catch (error) {
    console.error('Products error:', error);
    res.status(500).json({ message: 'Failed to fetch products', error });
  }
} 