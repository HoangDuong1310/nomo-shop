import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../../lib/auth';
import { getTokenFromRequest } from '../../../lib/auth-utils';
import { executeQuery } from '../../../lib/db';
import { syncProductOptionsToVariants, syncVariantsToProductOptions } from '../../../lib/variants';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Auth check
    const token = getTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const decodedToken = verifyToken(token);
    if (!decodedToken || !decodedToken.id) {
      return res.status(401).json({ success: false, message: 'Invalid session' });
    }

    // Admin check
    const userResult = await executeQuery({
      query: 'SELECT role FROM users WHERE id = ?',
      values: [decodedToken.id],
    });

    if (!Array.isArray(userResult) || userResult.length === 0 || (userResult[0] as any).role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const { productId, direction } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    if (!direction || !['options-to-variants', 'variants-to-options'].includes(direction)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Direction must be either "options-to-variants" or "variants-to-options"' 
      });
    }

    let result;
    if (direction === 'options-to-variants') {
      result = await syncProductOptionsToVariants(productId);
    } else {
      result = await syncVariantsToProductOptions(productId);
    }

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: result.message,
        direction
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

  } catch (error: any) {
    console.error('Sync variants error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}