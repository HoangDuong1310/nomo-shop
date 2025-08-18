import { NextApiRequest, NextApiResponse } from 'next';
import { executeQuery } from '../../../../lib/db';
import { verifyToken } from '../../../../lib/auth';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Auth check
    const token = req.cookies.auth_token;
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

    switch (req.method) {
      case 'GET':
        return handleGetAttributeValues(req, res);
      case 'POST':
        return handleCreateAttributeValue(req, res);
      case 'PUT':
        return handleUpdateAttributeValue(req, res);
      case 'DELETE':
        return handleDeleteAttributeValue(req, res);
      default:
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Attribute values API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

async function handleGetAttributeValues(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { attributeId } = req.query;

    if (!attributeId) {
      return res.status(400).json({
        success: false,
        message: 'Attribute ID is required'
      });
    }

    const values = await executeQuery({
      query: `
        SELECT * FROM attribute_values 
        WHERE attribute_id = ? 
        ORDER BY display_order, display_name
      `,
      values: [attributeId],
    });

    return res.status(200).json({
      success: true,
      data: values
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch attribute values',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

async function handleCreateAttributeValue(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { attributeId, value, displayName, colorCode, priceAdjustment, displayOrder } = req.body;

    if (!attributeId || !value || !displayName) {
      return res.status(400).json({
        success: false,
        message: 'Attribute ID, value, and display name are required'
      });
    }

    // Check if value already exists for this attribute
    const existingValue = await executeQuery({
      query: 'SELECT id FROM attribute_values WHERE attribute_id = ? AND value = ?',
      values: [attributeId, value],
    });

    if (Array.isArray(existingValue) && existingValue.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Value already exists for this attribute'
      });
    }

    const valueId = uuidv4();

    await executeQuery({
      query: `
        INSERT INTO attribute_values 
        (id, attribute_id, value, display_name, color_code, price_adjustment, display_order, is_active) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      values: [
        valueId,
        attributeId,
        value,
        displayName,
        colorCode || null,
        priceAdjustment || 0,
        displayOrder || 0,
        true
      ],
    });

    return res.status(201).json({
      success: true,
      message: 'Attribute value created successfully',
      data: { valueId }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create attribute value',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

async function handleUpdateAttributeValue(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { valueId, value, displayName, colorCode, priceAdjustment, displayOrder, isActive } = req.body;

    if (!valueId) {
      return res.status(400).json({
        success: false,
        message: 'Value ID is required'
      });
    }

    await executeQuery({
      query: `
        UPDATE attribute_values 
        SET value = ?, display_name = ?, color_code = ?, price_adjustment = ?, 
            display_order = ?, is_active = ?, updated_at = NOW()
        WHERE id = ?
      `,
      values: [
        value,
        displayName,
        colorCode || null,
        priceAdjustment || 0,
        displayOrder || 0,
        isActive !== false,
        valueId
      ],
    });

    return res.status(200).json({
      success: true,
      message: 'Attribute value updated successfully'
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update attribute value',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

async function handleDeleteAttributeValue(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { valueId } = req.body;

    if (!valueId) {
      return res.status(400).json({
        success: false,
        message: 'Value ID is required'
      });
    }

    await executeQuery({
      query: 'DELETE FROM attribute_values WHERE id = ?',
      values: [valueId],
    });

    return res.status(200).json({
      success: true,
      message: 'Attribute value deleted successfully'
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete attribute value',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}