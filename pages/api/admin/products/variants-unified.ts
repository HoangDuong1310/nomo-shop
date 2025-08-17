import { NextApiRequest, NextApiResponse } from 'next';
import { executeQuery } from '../../../../lib/db';
import { verifyToken } from '../../../../lib/auth';
import { 
  getAllProductVariants, 
  validateVariantData, 
  syncVariantsToProductOptions,
  ProductVariant,
  variantsToOptions 
} from '../../../../lib/variants';
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

    if (!Array.isArray(userResult) || userResult.length === 0 || userResult[0].role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Route handlers
    switch (req.method) {
      case 'GET':
        return handleGetVariants(req, res);
      case 'POST':
        return handleCreateVariant(req, res);
      case 'PUT':
        return handleUpdateVariant(req, res);
      case 'DELETE':
        return handleDeleteVariant(req, res);
      default:
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Variants API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

async function handleGetVariants(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { productId } = req.query;

    if (!productId || typeof productId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    // Check if product exists
    const productCheck = await executeQuery({
      query: 'SELECT id, name FROM products WHERE id = ?',
      values: [productId],
    });

    if (!Array.isArray(productCheck) || productCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const variants = await getAllProductVariants(productId);

    return res.status(200).json({
      success: true,
      data: {
        product: productCheck[0],
        variants,
        total: variants.length
      }
    });
  } catch (error: any) {
    console.error('Get variants error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch variants',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

async function handleCreateVariant(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { productId, variantName, variantValue, priceAdjustment, stockQuantity, isActive } = req.body;

    // Validate input
    const validation = validateVariantData({
      product_id: productId,
      variant_name: variantName,
      variant_value: variantValue,
      price_adjustment: priceAdjustment,
      stock_quantity: stockQuantity
    });

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }

    // Check if product exists
    const productCheck = await executeQuery({
      query: 'SELECT id FROM products WHERE id = ?',
      values: [productId],
    });

    if (!Array.isArray(productCheck) || productCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check for duplicate variant
    const duplicateCheck = await executeQuery({
      query: 'SELECT id FROM product_variants WHERE product_id = ? AND variant_name = ? AND variant_value = ?',
      values: [productId, variantName, variantValue],
    });

    if (Array.isArray(duplicateCheck) && duplicateCheck.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Variant already exists'
      });
    }

    const variantId = uuidv4();

    // Create variant
    await executeQuery({
      query: `
        INSERT INTO product_variants 
        (id, product_id, variant_name, variant_value, price_adjustment, stock_quantity, is_active) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      values: [
        variantId,
        productId,
        variantName,
        variantValue,
        priceAdjustment || 0,
        stockQuantity || 0,
        isActive !== false
      ],
    });

    // Sync to products.options
    await syncVariantsToProductOptions(productId);

    return res.status(201).json({
      success: true,
      message: 'Variant created successfully',
      data: { variantId }
    });
  } catch (error: any) {
    console.error('Create variant error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create variant',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

async function handleUpdateVariant(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { variantId, priceAdjustment, stockQuantity, isActive } = req.body;

    if (!variantId) {
      return res.status(400).json({
        success: false,
        message: 'Variant ID is required'
      });
    }

    // Check if variant exists
    const variantCheck = await executeQuery({
      query: 'SELECT product_id FROM product_variants WHERE id = ?',
      values: [variantId],
    });

    if (!Array.isArray(variantCheck) || variantCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Variant not found'
      });
    }

    const productId = variantCheck[0].product_id;

    // Update variant
    await executeQuery({
      query: `
        UPDATE product_variants 
        SET price_adjustment = ?, stock_quantity = ?, is_active = ?, updated_at = NOW()
        WHERE id = ?
      `,
      values: [
        priceAdjustment !== undefined ? priceAdjustment : 0,
        stockQuantity !== undefined ? stockQuantity : 0,
        isActive !== undefined ? isActive : true,
        variantId
      ],
    });

    // Sync to products.options
    await syncVariantsToProductOptions(productId);

    return res.status(200).json({
      success: true,
      message: 'Variant updated successfully'
    });
  } catch (error: any) {
    console.error('Update variant error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update variant',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

async function handleDeleteVariant(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { variantId } = req.body;

    if (!variantId) {
      return res.status(400).json({
        success: false,
        message: 'Variant ID is required'
      });
    }

    // Check if variant exists and get product_id
    const variantCheck = await executeQuery({
      query: 'SELECT product_id FROM product_variants WHERE id = ?',
      values: [variantId],
    });

    if (!Array.isArray(variantCheck) || variantCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Variant not found'
      });
    }

    const productId = variantCheck[0].product_id;

    // Delete variant
    await executeQuery({
      query: 'DELETE FROM product_variants WHERE id = ?',
      values: [variantId],
    });

    // Sync to products.options
    await syncVariantsToProductOptions(productId);

    return res.status(200).json({
      success: true,
      message: 'Variant deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete variant error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete variant',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}