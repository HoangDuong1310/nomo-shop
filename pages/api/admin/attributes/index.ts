import { NextApiRequest, NextApiResponse } from 'next';
import { executeQuery } from '../../../../lib/db';
import { verifyToken } from '../../../../lib/auth';
import { getTokenFromRequest } from '../../../../lib/auth-utils';
import { getAllAttributes } from '../../../../lib/attributes';
import { v4 as uuidv4 } from 'uuid';

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

    switch (req.method) {
      case 'GET':
        return handleGetAttributes(req, res);
      case 'POST':
        return handleCreateAttribute(req, res);
      case 'PUT':
        return handleUpdateAttribute(req, res);
      case 'DELETE':
        return handleDeleteAttribute(req, res);
      default:
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Attributes API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

async function handleGetAttributes(req: NextApiRequest, res: NextApiResponse) {
  try {
    const attributes = await getAllAttributes();
    
    return res.status(200).json({
      success: true,
      data: attributes
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch attributes',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

async function handleCreateAttribute(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { name, type, description, isRequired, displayOrder } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: 'Name and type are required'
      });
    }

    // Check if attribute name already exists
    const existingAttribute = await executeQuery({
      query: 'SELECT id FROM product_attributes WHERE name = ?',
      values: [name],
    });

    if (Array.isArray(existingAttribute) && existingAttribute.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Attribute name already exists'
      });
    }

    const attributeId = uuidv4();

    await executeQuery({
      query: `
        INSERT INTO product_attributes 
        (id, name, type, description, is_required, display_order, is_active) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      values: [
        attributeId,
        name,
        type,
        description || null,
        isRequired || false,
        displayOrder || 0,
        true
      ],
    });

    return res.status(201).json({
      success: true,
      message: 'Attribute created successfully',
      data: { attributeId }
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create attribute',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

async function handleUpdateAttribute(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { attributeId, name, type, description, isRequired, displayOrder, isActive } = req.body;

    if (!attributeId) {
      return res.status(400).json({
        success: false,
        message: 'Attribute ID is required'
      });
    }

    await executeQuery({
      query: `
        UPDATE product_attributes 
        SET name = ?, type = ?, description = ?, is_required = ?, 
            display_order = ?, is_active = ?, updated_at = NOW()
        WHERE id = ?
      `,
      values: [
        name,
        type,
        description || null,
        isRequired || false,
        displayOrder || 0,
        isActive !== false,
        attributeId
      ],
    });

    return res.status(200).json({
      success: true,
      message: 'Attribute updated successfully'
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update attribute',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

async function handleDeleteAttribute(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { attributeId } = req.body;

    if (!attributeId) {
      return res.status(400).json({
        success: false,
        message: 'Attribute ID is required'
      });
    }

    // Check if attribute is being used by any products
    const usageCheck = await executeQuery({
      query: 'SELECT COUNT(*) as count FROM product_attribute_mapping WHERE attribute_id = ?',
      values: [attributeId],
    });

    if (Array.isArray(usageCheck) && (usageCheck[0] as any).count > 0) {
      return res.status(409).json({
        success: false,
        message: 'Cannot delete attribute that is being used by products'
      });
    }

    // Delete attribute and its values (CASCADE will handle values)
    await executeQuery({
      query: 'DELETE FROM product_attributes WHERE id = ?',
      values: [attributeId],
    });

    return res.status(200).json({
      success: true,
      message: 'Attribute deleted successfully'
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete attribute',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}