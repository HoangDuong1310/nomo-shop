import { NextApiRequest, NextApiResponse } from 'next';
import { executeQuery } from '../../../lib/db';
import { getProductVariants, variantsToOptions } from '../../../lib/variants';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    
    const product = await executeQuery({
      query: 'SELECT * FROM products WHERE id = ?',
      values: [id],
    });

    if (!(product as any[]).length) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Lấy variants và chuyển thành options chuẩn hóa cho FE
    const variants = await getProductVariants(String(id));
    const options = variantsToOptions(variants);

    const serialize = (data: any) => JSON.parse(JSON.stringify(data));
    const formattedProduct = serialize({
      ...(product as any[])[0],
      options
    });

    res.status(200).json(formattedProduct);
  } catch (error) {
    console.error('Product error:', error);
    res.status(500).json({ message: 'Failed to fetch product', error });
  }
} 