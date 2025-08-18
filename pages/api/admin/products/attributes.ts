import { NextApiRequest, NextApiResponse } from 'next';
import { executeQuery } from '../../../../lib/db';
import { verifyToken } from '../../../../lib/auth';
import { assignAttributesToProduct, getAllAttributes, getProductAttributes } from '../../../../lib/attributes';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const token = req.cookies.auth_token;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) {
      return res.status(401).json({ success: false, message: 'Invalid session' });
    }
    const userResult = await executeQuery({
      query: 'SELECT role FROM users WHERE id = ?',
      values: [decoded.id],
    });
    if (!Array.isArray(userResult) || userResult.length === 0 || (userResult[0] as any).role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (req.method === 'GET') {
      const { productId } = req.query;
      if (productId) {
        const data = await getProductAttributes(String(productId));
        return res.status(200).json({ success: true, data });
      }
      const data = await getAllAttributes();
      return res.status(200).json({ success: true, data });
    }

    if (req.method === 'POST') {
      const { action } = req.body || {};
      if (action === 'assign') {
        const { productId, attributeIds, requiredAttributeIds } = req.body;
        if (!productId || !Array.isArray(attributeIds)) {
          return res.status(400).json({ success: false, message: 'productId and attributeIds are required' });
        }
        const result = await assignAttributesToProduct(productId, attributeIds, requiredAttributeIds || []);
        if (!result.success) {
          return res.status(400).json(result);
        }
        return res.status(200).json(result);
      }
      return res.status(400).json({ success: false, message: 'Unsupported action' });
    }

    return res.status(405).json({ success: false, message: 'Method not allowed' });
  } catch (error: any) {
    console.error('Product attributes API error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
}


