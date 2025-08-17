// Variant Templates System for Easy Setup
export interface VariantTemplate {
  id: string;
  name: string;
  description: string;
  category: 'size' | 'color' | 'topping' | 'temperature' | 'custom';
  icon: string;
  defaultValues: VariantTemplateValue[];
}

export interface VariantTemplateValue {
  label: string;
  value: string;
  priceAdjustment: number;
  stockQuantity: number;
  order: number;
}

export const PREDEFINED_TEMPLATES: VariantTemplate[] = [
  // Size Templates
  {
    id: 'size-standard',
    name: 'Kích cỡ tiêu chuẩn',
    description: 'S, M, L, XL với mức giá tăng dần',
    category: 'size',
    icon: '📏',
    defaultValues: [
      { label: 'Size S', value: 's', priceAdjustment: 0, stockQuantity: 50, order: 1 },
      { label: 'Size M', value: 'm', priceAdjustment: 5000, stockQuantity: 100, order: 2 },
      { label: 'Size L', value: 'l', priceAdjustment: 10000, stockQuantity: 75, order: 3 },
      { label: 'Size XL', value: 'xl', priceAdjustment: 15000, stockQuantity: 25, order: 4 },
    ]
  },
  {
    id: 'size-drink',
    name: 'Size đồ uống',
    description: 'Nhỏ, Vừa, Lớn cho đồ uống',
    category: 'size',
    icon: '🥤',
    defaultValues: [
      { label: 'Nhỏ (300ml)', value: 'small', priceAdjustment: 0, stockQuantity: 100, order: 1 },
      { label: 'Vừa (500ml)', value: 'medium', priceAdjustment: 8000, stockQuantity: 100, order: 2 },
      { label: 'Lớn (700ml)', value: 'large', priceAdjustment: 15000, stockQuantity: 50, order: 3 },
    ]
  },
  
  // Color Templates
  {
    id: 'color-basic',
    name: 'Màu cơ bản',
    description: 'Đỏ, Xanh, Vàng, Trắng, Đen',
    category: 'color',
    icon: '🎨',
    defaultValues: [
      { label: 'Đỏ', value: 'red', priceAdjustment: 0, stockQuantity: 30, order: 1 },
      { label: 'Xanh dương', value: 'blue', priceAdjustment: 0, stockQuantity: 30, order: 2 },
      { label: 'Vàng', value: 'yellow', priceAdjustment: 0, stockQuantity: 20, order: 3 },
      { label: 'Trắng', value: 'white', priceAdjustment: 0, stockQuantity: 50, order: 4 },
      { label: 'Đen', value: 'black', priceAdjustment: 0, stockQuantity: 40, order: 5 },
    ]
  },
  {
    id: 'color-premium',
    name: 'Màu cao cấp',
    description: 'Vàng gold, bạc silver với giá tăng',
    category: 'color',
    icon: '✨',
    defaultValues: [
      { label: 'Bạc Silver', value: 'silver', priceAdjustment: 20000, stockQuantity: 15, order: 1 },
      { label: 'Vàng Gold', value: 'gold', priceAdjustment: 50000, stockQuantity: 10, order: 2 },
      { label: 'Hồng Rose Gold', value: 'rose_gold', priceAdjustment: 35000, stockQuantity: 12, order: 3 },
    ]
  },
  
  // Topping Templates
  {
    id: 'topping-food',
    name: 'Topping món ăn',
    description: 'Thêm trứng, phô mai, thịt, rau',
    category: 'topping',
    icon: '🍳',
    defaultValues: [
      { label: 'Thêm trứng', value: 'egg', priceAdjustment: 8000, stockQuantity: 100, order: 1 },
      { label: 'Thêm phô mai', value: 'cheese', priceAdjustment: 12000, stockQuantity: 50, order: 2 },
      { label: 'Thêm thịt', value: 'meat', priceAdjustment: 20000, stockQuantity: 30, order: 3 },
      { label: 'Thêm rau', value: 'vegetables', priceAdjustment: 5000, stockQuantity: 80, order: 4 },
    ]
  },
  {
    id: 'topping-drink',
    name: 'Topping đồ uống',
    description: 'Trân châu, thạch, kem, đường',
    category: 'topping',
    icon: '🧋',
    defaultValues: [
      { label: 'Trân châu đen', value: 'black_pearl', priceAdjustment: 8000, stockQuantity: 100, order: 1 },
      { label: 'Trân châu trắng', value: 'white_pearl', priceAdjustment: 8000, stockQuantity: 100, order: 2 },
      { label: 'Thạch dừa', value: 'coconut_jelly', priceAdjustment: 6000, stockQuantity: 80, order: 3 },
      { label: 'Kem cheese', value: 'cream_cheese', priceAdjustment: 15000, stockQuantity: 40, order: 4 },
      { label: 'Đường ít', value: 'less_sugar', priceAdjustment: 0, stockQuantity: 999, order: 5 },
      { label: 'Không đường', value: 'no_sugar', priceAdjustment: 0, stockQuantity: 999, order: 6 },
    ]
  },
  
  // Temperature Templates
  {
    id: 'temperature-drinks',
    name: 'Nhiệt độ đồ uống',
    description: 'Nóng, Lạnh, Thường',
    category: 'temperature',
    icon: '🌡️',
    defaultValues: [
      { label: 'Nóng', value: 'hot', priceAdjustment: 0, stockQuantity: 999, order: 1 },
      { label: 'Lạnh', value: 'cold', priceAdjustment: 3000, stockQuantity: 999, order: 2 },
      { label: 'Thường', value: 'normal', priceAdjustment: 0, stockQuantity: 999, order: 3 },
    ]
  }
];

/**
 * Lấy template theo ID
 */
export function getTemplateById(id: string): VariantTemplate | undefined {
  return PREDEFINED_TEMPLATES.find(template => template.id === id);
}

/**
 * Lấy tất cả templates theo category
 */
export function getTemplatesByCategory(category: VariantTemplate['category']): VariantTemplate[] {
  return PREDEFINED_TEMPLATES.filter(template => template.category === category);
}

/**
 * Tạo variant template tùy chỉnh
 */
export function createCustomTemplate(
  name: string,
  description: string,
  values: Omit<VariantTemplateValue, 'order'>[]
): VariantTemplate {
  return {
    id: `custom-${Date.now()}`,
    name,
    description,
    category: 'custom',
    icon: '🎯',
    defaultValues: values.map((value, index) => ({
      ...value,
      order: index + 1
    }))
  };
}

/**
 * Validate template data
 */
export function validateTemplate(template: Partial<VariantTemplate>): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!template.name || template.name.trim() === '') {
    errors.push('Tên template là bắt buộc');
  }
  
  if (!template.defaultValues || template.defaultValues.length === 0) {
    errors.push('Template phải có ít nhất 1 giá trị');
  }
  
  if (template.defaultValues) {
    template.defaultValues.forEach((value, index) => {
      if (!value.label || value.label.trim() === '') {
        errors.push(`Giá trị thứ ${index + 1} cần có label`);
      }
      if (!value.value || value.value.trim() === '') {
        errors.push(`Giá trị thứ ${index + 1} cần có value`);
      }
      if (value.priceAdjustment !== undefined && isNaN(Number(value.priceAdjustment))) {
        errors.push(`Giá trị thứ ${index + 1} có giá điều chỉnh không hợp lệ`);
      }
      if (value.stockQuantity !== undefined && (isNaN(Number(value.stockQuantity)) || Number(value.stockQuantity) < 0)) {
        errors.push(`Giá trị thứ ${index + 1} có số lượng tồn kho không hợp lệ`);
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Convert template thành variants data để save
 */
export function templateToVariants(
  template: VariantTemplate,
  productId: string,
  variantName: string
): Array<{
  productId: string;
  variantName: string;
  variantValue: string;
  priceAdjustment: number;
  stockQuantity: number;
  isActive: boolean;
}> {
  return template.defaultValues.map(value => ({
    productId,
    variantName,
    variantValue: value.label,
    priceAdjustment: value.priceAdjustment,
    stockQuantity: value.stockQuantity,
    isActive: true
  }));
}
