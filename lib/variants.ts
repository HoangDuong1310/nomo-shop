// Unified Variants Logic - Single Source of Truth
import { executeQuery } from './db';

export interface ProductVariant {
  id: string;
  product_id: string;
  variant_name: string;
  variant_value: string;
  price_adjustment: number | string; // Support both types from database
  stock_quantity: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface VariantGroup {
  name: string;
  variants: ProductVariant[];
}

export interface ProductOptionValue {
  label: string;
  value: string;
  price: number;
  stock?: number;
  active?: boolean;
}

export interface ProductOption {
  name: string;
  values: ProductOptionValue[];
}

/**
 * Lấy tất cả variants của một sản phẩm (chỉ active - dành cho customer)
 */
export async function getProductVariants(productId: string): Promise<ProductVariant[]> {
  try {
    const variants = await executeQuery({
      query: `
        SELECT * FROM product_variants 
        WHERE product_id = ? AND is_active = true
        ORDER BY variant_name, variant_value
      `,
      values: [productId],
    });

    return JSON.parse(JSON.stringify(variants)) as ProductVariant[];
  } catch (error) {
    console.error('Error fetching product variants:', error);
    return [];
  }
}

/**
 * Lấy tất cả variants của một sản phẩm (bao gồm cả inactive - dành cho admin)
 */
export async function getAllProductVariants(productId: string): Promise<ProductVariant[]> {
  try {
    const variants = await executeQuery({
      query: `
        SELECT * FROM product_variants 
        WHERE product_id = ? 
        ORDER BY variant_name, variant_value
      `,
      values: [productId],
    });

    return JSON.parse(JSON.stringify(variants)) as ProductVariant[];
  } catch (error) {
    console.error('Error fetching all product variants:', error);
    return [];
  }
}

/**
 * Nhóm variants theo tên (Size, Topping, etc.)
 */
export function groupVariantsByName(variants: ProductVariant[]): VariantGroup[] {
  const groups: { [key: string]: ProductVariant[] } = {};
  
  variants.forEach(variant => {
    if (!groups[variant.variant_name]) {
      groups[variant.variant_name] = [];
    }
    groups[variant.variant_name].push(variant);
  });

  return Object.keys(groups).map(name => ({
    name,
    variants: groups[name]
  }));
}

/**
 * Chuyển đổi variants thành format options cho frontend
 */
export function variantsToOptions(variants: ProductVariant[]): ProductOption[] {
  const groups = groupVariantsByName(variants);
  
  return groups.map(group => ({
    name: group.name,
    values: group.variants.map(variant => ({
      label: variant.variant_value,
      value: variant.variant_value.toLowerCase().replace(/\s+/g, '_'),
      price: typeof variant.price_adjustment === 'string' 
        ? parseFloat(variant.price_adjustment) 
        : variant.price_adjustment,
      stock: variant.stock_quantity,
      active: variant.is_active
    }))
  }));
}

/**
 * Chuyển đổi options thành variants để lưu vào database
 */
export function optionsToVariants(productId: string, options: ProductOption[]): Omit<ProductVariant, 'id' | 'created_at' | 'updated_at'>[] {
  const variants: Omit<ProductVariant, 'id' | 'created_at' | 'updated_at'>[] = [];
  
  options.forEach(option => {
    option.values.forEach(value => {
      variants.push({
        product_id: productId,
        variant_name: option.name,
        variant_value: value.label,
        price_adjustment: value.price || 0,
        stock_quantity: value.stock || 0,
        is_active: value.active !== false
      });
    });
  });
  
  return variants;
}

/**
 * Tính giá cuối cùng của sản phẩm với variants
 */
export function calculateFinalPrice(basePrice: number, selectedVariants: { [variantName: string]: string }, variants: ProductVariant[]): number {
  let totalAdjustment = 0;

  Object.entries(selectedVariants).forEach(([variantName, variantValue]) => {
    const variant = variants.find(v => 
      v.variant_name === variantName && 
      v.variant_value === variantValue &&
      v.is_active
    );

    if (variant) {
      const adjustment = typeof variant.price_adjustment === 'string' 
        ? parseFloat(variant.price_adjustment) 
        : variant.price_adjustment;
      totalAdjustment += adjustment;
    }
  });

  return basePrice + totalAdjustment;
}

/**
 * Validate variant data
 */
export function validateVariantData(data: Partial<ProductVariant>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.product_id) {
    errors.push('Product ID is required');
  }
  
  if (!data.variant_name || data.variant_name.trim() === '') {
    errors.push('Variant name is required');
  }
  
  if (!data.variant_value || data.variant_value.trim() === '') {
    errors.push('Variant value is required');
  }
  
  if (data.price_adjustment !== undefined && isNaN(Number(data.price_adjustment))) {
    errors.push('Price adjustment must be a valid number');
  }
  
  if (data.stock_quantity !== undefined && (isNaN(Number(data.stock_quantity)) || Number(data.stock_quantity) < 0)) {
    errors.push('Stock quantity must be a non-negative number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Sync variants từ products.options sang product_variants table
 */
export async function syncProductOptionsToVariants(productId: string): Promise<{ success: boolean; message: string }> {
  try {
    // Lấy product options
    const productResult = await executeQuery({
      query: 'SELECT options FROM products WHERE id = ?',
      values: [productId],
    });
    
    if (!Array.isArray(productResult) || productResult.length === 0) {
      return { success: false, message: 'Product not found' };
    }
    
    const product = productResult[0] as any;
    if (!product.options) {
      return { success: true, message: 'No options to sync' };
    }
    
    let options: ProductOption[];
    try {
      options = JSON.parse(product.options);
    } catch (error) {
      return { success: false, message: 'Invalid options format' };
    }
    
    // Xóa variants cũ
    await executeQuery({
      query: 'DELETE FROM product_variants WHERE product_id = ?',
      values: [productId],
    });
    
    // Thêm variants mới
    const variants = optionsToVariants(productId, options);
    
    for (const variant of variants) {
      const { v4: uuidv4 } = require('uuid');
      await executeQuery({
        query: `
          INSERT INTO product_variants 
          (id, product_id, variant_name, variant_value, price_adjustment, stock_quantity, is_active) 
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        values: [
          uuidv4(),
          variant.product_id,
          variant.variant_name,
          variant.variant_value,
          variant.price_adjustment,
          variant.stock_quantity,
          variant.is_active
        ],
      });
    }
    
    return { success: true, message: `Synced ${variants.length} variants` };
  } catch (error) {
    console.error('Error syncing variants:', error);
    return { success: false, message: 'Failed to sync variants' };
  }
}

/**
 * Sync variants từ product_variants table sang products.options
 */
export async function syncVariantsToProductOptions(productId: string): Promise<{ success: boolean; message: string }> {
  try {
    // For admin sync, use all variants (including inactive) to preserve complete data
    const variants = await getAllProductVariants(productId);
    const options = variantsToOptions(variants);
    
    await executeQuery({
      query: 'UPDATE products SET options = ? WHERE id = ?',
      values: [JSON.stringify(options), productId],
    });
    
    return { success: true, message: `Synced ${options.length} option groups` };
  } catch (error) {
    console.error('Error syncing to options:', error);
    return { success: false, message: 'Failed to sync to options' };
  }
}