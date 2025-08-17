// Unified Attributes Management System
import { executeQuery } from './db';

export interface ProductAttribute {
  id: string;
  name: string;
  type: 'select' | 'color' | 'size' | 'text';
  description?: string;
  is_required: boolean;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AttributeValue {
  id: string;
  attribute_id: string;
  value: string;
  display_name: string;
  color_code?: string;
  price_adjustment: number;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProductAttributeMapping {
  id: string;
  product_id: string;
  attribute_id: string;
  is_required: boolean;
  custom_price_adjustment?: number;
  created_at?: string;
}

export interface AttributeWithValues extends ProductAttribute {
  values: AttributeValue[];
}

export interface ProductVariantNew {
  id: string;
  product_id: string;
  sku?: string;
  attribute_combination: { [key: string]: string }; // {"size": "m", "color": "red"}
  price_adjustment: number;
  stock_quantity: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Lấy tất cả attributes
 */
export async function getAllAttributes(): Promise<AttributeWithValues[]> {
  try {
    const attributes = await executeQuery({
      query: `
        SELECT * FROM product_attributes 
        WHERE is_active = true 
        ORDER BY display_order, name
      `,
    }) as ProductAttribute[];

    const attributesWithValues: AttributeWithValues[] = [];

    for (const attr of attributes) {
      const values = await executeQuery({
        query: `
          SELECT * FROM attribute_values 
          WHERE attribute_id = ? AND is_active = true 
          ORDER BY display_order, display_name
        `,
        values: [attr.id],
      }) as AttributeValue[];

      attributesWithValues.push({
        ...attr,
        values
      });
    }

    return attributesWithValues;
  } catch (error) {
    console.error('Error fetching attributes:', error);
    return [];
  }
}

/**
 * Lấy attributes của một sản phẩm
 */
export async function getProductAttributes(productId: string): Promise<AttributeWithValues[]> {
  try {
    const mappings = await executeQuery({
      query: `
        SELECT pa.*, pam.is_required, pam.custom_price_adjustment
        FROM product_attributes pa
        JOIN product_attribute_mapping pam ON pa.id = pam.attribute_id
        WHERE pam.product_id = ? AND pa.is_active = true
        ORDER BY pa.display_order, pa.name
      `,
      values: [productId],
    }) as (ProductAttribute & { custom_price_adjustment?: number })[];

    const attributesWithValues: AttributeWithValues[] = [];

    for (const attr of mappings) {
      const values = await executeQuery({
        query: `
          SELECT * FROM attribute_values 
          WHERE attribute_id = ? AND is_active = true 
          ORDER BY display_order, display_name
        `,
        values: [attr.id],
      }) as AttributeValue[];

      // Apply custom price adjustment if set
      const adjustedValues = values.map(value => ({
        ...value,
        price_adjustment: (attr.custom_price_adjustment != null)
          ? attr.custom_price_adjustment
          : value.price_adjustment
      }));

      attributesWithValues.push({
        ...attr,
        values: adjustedValues
      });
    }

    return attributesWithValues;
  } catch (error) {
    console.error('Error fetching product attributes:', error);
    return [];
  }
}

/**
 * Assign attributes cho sản phẩm
 */
export async function assignAttributesToProduct(
  productId: string, 
  attributeIds: string[], 
  requiredAttributes: string[] = []
): Promise<{ success: boolean; message: string }> {
  try {
    // Remove existing mappings
    await executeQuery({
      query: 'DELETE FROM product_attribute_mapping WHERE product_id = ?',
      values: [productId],
    });

    // Add new mappings
    const { v4: uuidv4 } = require('uuid');
    for (const attributeId of attributeIds) {
      await executeQuery({
        query: `
          INSERT INTO product_attribute_mapping 
          (id, product_id, attribute_id, is_required) 
          VALUES (?, ?, ?, ?)
        `,
        values: [
          uuidv4(),
          productId,
          attributeId,
          requiredAttributes.includes(attributeId)
        ],
      });
    }

    return { success: true, message: `Assigned ${attributeIds.length} attributes to product` };
  } catch (error) {
    console.error('Error assigning attributes:', error);
    return { success: false, message: 'Failed to assign attributes' };
  }
}

/**
 * Generate tất cả combinations có thể cho sản phẩm
 */
export function generateAttributeCombinations(attributes: AttributeWithValues[]): { [key: string]: string }[] {
  if (attributes.length === 0) return [{}];

  const combinations: { [key: string]: string }[] = [];
  
  function generateRecursive(index: number, currentCombination: { [key: string]: string }) {
    if (index === attributes.length) {
      combinations.push({ ...currentCombination });
      return;
    }

    const attribute = attributes[index];
    for (const value of attribute.values) {
      currentCombination[attribute.name.toLowerCase()] = value.value;
      generateRecursive(index + 1, currentCombination);
    }
  }

  generateRecursive(0, {});
  return combinations;
}

/**
 * Tính giá cho một combination
 */
export function calculateCombinationPrice(
  basePrice: number,
  combination: { [key: string]: string },
  attributes: AttributeWithValues[]
): number {
  let totalAdjustment = 0;

  for (const attribute of attributes) {
    const selectedValue = combination[attribute.name.toLowerCase()];
    if (selectedValue) {
      const value = attribute.values.find(v => v.value === selectedValue);
      if (value) {
        totalAdjustment += value.price_adjustment;
      }
    }
  }

  return basePrice + totalAdjustment;
}

/**
 * Generate SKU cho variant
 */
export function generateVariantSKU(
  productId: string,
  combination: { [key: string]: string }
): string {
  const productCode = productId.substring(0, 8).toUpperCase();
  const variantCode = Object.values(combination)
    .map(v => v.substring(0, 2).toUpperCase())
    .join('');
  
  return `${productCode}-${variantCode}`;
}

/**
 * Tạo variants cho sản phẩm dựa trên attributes
 */
export async function generateProductVariants(productId: string): Promise<{ success: boolean; message: string; count?: number }> {
  try {
    const attributes = await getProductAttributes(productId);
    if (attributes.length === 0) {
      return { success: false, message: 'No attributes assigned to product' };
    }

    const combinations = generateAttributeCombinations(attributes);
    
    // Get product base price
    const productResult = await executeQuery({
      query: 'SELECT price FROM products WHERE id = ?',
      values: [productId],
    }) as any[];

    if (productResult.length === 0) {
      return { success: false, message: 'Product not found' };
    }

    const basePrice = productResult[0].price;

    // Clear existing variants
    await executeQuery({
      query: 'DELETE FROM product_variants_new WHERE product_id = ?',
      values: [productId],
    });

    // Create new variants
    const { v4: uuidv4 } = require('uuid');
    for (const combination of combinations) {
      const priceAdjustment = calculateCombinationPrice(basePrice, combination, attributes) - basePrice;
      const sku = generateVariantSKU(productId, combination);

      await executeQuery({
        query: `
          INSERT INTO product_variants_new 
          (id, product_id, sku, attribute_combination, price_adjustment, stock_quantity, is_active) 
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        values: [
          uuidv4(),
          productId,
          sku,
          JSON.stringify(combination),
          priceAdjustment,
          100, // Default stock
          true
        ],
      });
    }

    return { 
      success: true, 
      message: `Generated ${combinations.length} variants successfully`,
      count: combinations.length
    };
  } catch (error) {
    console.error('Error generating variants:', error);
    return { success: false, message: 'Failed to generate variants' };
  }
}