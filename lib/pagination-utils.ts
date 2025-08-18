// Utility function để đảm bảo parameters luôn là integer hợp lệ
export function safePaginationParams(query: any) {
  const page = Math.max(1, parseInt(String(query.page || '1'), 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(String(query.limit || '10'), 10) || 10));
  const offset = (page - 1) * limit;
  
  // Kiểm tra thêm để đảm bảo không có NaN
  if (isNaN(page) || isNaN(limit) || isNaN(offset)) {
    throw new Error('Invalid pagination parameters');
  }
  
  console.log('Pagination Debug:', {
    input: { page: query.page, limit: query.limit },
    output: { page, limit, offset },
    types: { page: typeof page, limit: typeof limit, offset: typeof offset }
  });
  
  return { page, limit, offset };
}
