import { NextApiRequest, NextApiResponse } from 'next';
import { executeQuery } from '../../../../lib/db';
import { verifyToken } from '../../../../lib/auth';
import { getTokenFromRequest } from '../../../lib/auth-utils';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Lấy token từ cookie hoặc Authorization header
    const token = getTokenFromRequest(req);
    
    // Nếu không có token
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    // Verify token
    const decodedToken = verifyToken(token);
    
    if (!decodedToken || !decodedToken.id) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session'
      });
    }

    // Kiểm tra quyền admin
    const userResult = await executeQuery({
      query: 'SELECT role FROM users WHERE id = ?',
      values: [decodedToken.id],
    });

    if ((userResult as any[]).length === 0 || (userResult as any[])[0].role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Xử lý các phương thức khác nhau
    switch (req.method) {
      case 'GET':
        return getProductVariants(req, res);
      case 'POST':
        return createProductVariant(req, res);
      case 'PUT':
        return updateProductVariant(req, res);
      case 'DELETE':
        return deleteProductVariant(req, res);
      default:
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error('Product variants API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Lấy danh sách variants của sản phẩm
async function getProductVariants(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { productId } = req.query;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    // Kiểm tra bảng product_variants có tồn tại không
    try {
      await executeQuery({
        query: 'DESCRIBE product_variants',
      });
    } catch (tableError) {
      console.error('Table product_variants does not exist:', tableError);
      return res.status(200).json({
        success: true,
        variants: [],
        message: 'Bảng product_variants chưa được tạo. Vui lòng chạy setup-db.'
      });
    }

    const variants = await executeQuery({
      query: `
        SELECT * FROM product_variants 
        WHERE product_id = ? 
        ORDER BY variant_name, variant_value
      `,
      values: [productId],
    });

    return res.status(200).json({
      success: true,
      variants: JSON.parse(JSON.stringify(variants))
    });
  } catch (error: any) {
    console.error('Get product variants error:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách variants',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Tạo variant mới
async function createProductVariant(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { productId, variantName, variantValue, priceAdjustment, stockQuantity } = req.body;

    // Validation
    if (!productId || !variantName || !variantValue) {
      return res.status(400).json({
        success: false,
        message: 'Product ID, variant name và variant value là bắt buộc'
      });
    }

    // Kiểm tra sản phẩm có tồn tại không
    const productCheck = await executeQuery({
      query: 'SELECT id FROM products WHERE id = ?',
      values: [productId],
    });

    if (!Array.isArray(productCheck) || productCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Sản phẩm không tồn tại'
      });
    }

    const variantId = uuidv4();

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
        true
      ],
    });

    return res.status(201).json({
      success: true,
      message: 'Tạo variant thành công',
      variantId
    });
  } catch (error: any) {
    console.error('Create product variant error:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tạo variant',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Cập nhật variant
async function updateProductVariant(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { variantId, priceAdjustment, stockQuantity, isActive } = req.body;

    if (!variantId) {
      return res.status(400).json({
        success: false,
        message: 'Variant ID là bắt buộc'
      });
    }

    await executeQuery({
      query: `
        UPDATE product_variants 
        SET price_adjustment = ?, stock_quantity = ?, is_active = ?, updated_at = NOW()
        WHERE id = ?
      `,
      values: [priceAdjustment || 0, stockQuantity || 0, isActive !== undefined ? isActive : true, variantId],
    });

    return res.status(200).json({
      success: true,
      message: 'Cập nhật variant thành công'
    });
  } catch (error: any) {
    console.error('Update product variant error:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi cập nhật variant',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Xóa variant
async function deleteProductVariant(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { variantId } = req.body;

    if (!variantId) {
      return res.status(400).json({
        success: false,
        message: 'Variant ID là bắt buộc'
      });
    }

    await executeQuery({
      query: 'DELETE FROM product_variants WHERE id = ?',
      values: [variantId],
    });

    return res.status(200).json({
      success: true,
      message: 'Xóa variant thành công'
    });
  } catch (error: any) {
    console.error('Delete product variant error:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xóa variant',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}