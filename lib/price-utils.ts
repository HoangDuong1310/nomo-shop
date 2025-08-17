/**
 * Format giá tiền theo định dạng VND
 */
export function formatPrice(price: number | string): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(numPrice)) return '0đ';
  return numPrice.toLocaleString('vi-VN') + 'đ';
}

/**
 * Tính giá hiển thị (ưu tiên giá khuyến mãi)
 */
export function getDisplayPrice(originalPrice: number, salePrice?: number | null): number {
  return salePrice && salePrice < originalPrice ? salePrice : originalPrice;
}

/**
 * Kiểm tra có khuyến mãi không
 */
export function hasDiscount(originalPrice: number, salePrice?: number | null): boolean {
  return !!(salePrice && salePrice < originalPrice);
}

/**
 * Tính phần trăm khuyến mãi
 */
export function getDiscountPercent(originalPrice: number, salePrice: number): number {
  if (!salePrice || salePrice >= originalPrice) return 0;
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
}
