# Hướng dẫn sửa lỗi MySQL Pagination trên Server

## Vấn đề
Lỗi vẫn xuất hiện trên server vì code đã được build và cached trong thư mục `.next`. Server đang chạy code cũ chưa có fix.

## Giải pháp

### Cách 1: Copy trực tiếp các file đã sửa lên server

1. **Copy các file sau lên server:**
   ```
   - lib/db.ts (hoặc lib/db.js nếu đã build)
   - pages/api/admin/products.ts
   - pages/api/admin/orders.ts  
   - pages/api/admin/customers/index.ts
   ```

2. **SSH vào server và chạy:**
   ```bash
   cd /var/www/html/nomo-shop
   
   # Xóa cache build cũ
   rm -rf .next
   
   # Build lại ứng dụng
   npm run build
   
   # Khởi động lại
   pm2 restart all
   # hoặc
   npm start
   ```

### Cách 2: Sửa trực tiếp trên server

1. **SSH vào server:**
   ```bash
   ssh user@your-server
   cd /var/www/html/nomo-shop
   ```

2. **Sửa file lib/db.ts (hoặc lib/db.js):**
   
   Thêm function mới:
   ```javascript
   export async function executeQueryWithPagination({
     query,
     values = [],
     limit,
     offset,
   }) {
     try {
       const currentPool = createPool();
       
       const safeLimit = parseInt(String(limit));
       const safeOffset = parseInt(String(offset));
       
       if (isNaN(safeLimit) || isNaN(safeOffset) || safeLimit < 0 || safeOffset < 0) {
         throw new Error('Invalid limit or offset values');
       }
       
       const paginatedQuery = `${query} LIMIT ${safeLimit} OFFSET ${safeOffset}`;
       const [results] = await currentPool.execute(paginatedQuery, values);
       return results;
     } catch (error) {
       console.error('Database error:', error);
       throw error;
     }
   }
   ```

3. **Sửa các API endpoints:**
   
   Trong mỗi file API (`products.ts`, `orders.ts`, `customers/index.ts`):
   
   - Import thêm `executeQueryWithPagination`
   - Thay đổi phần query với pagination:
   
   Từ:
   ```javascript
   query += ' ORDER BY ... LIMIT ? OFFSET ?';
   queryParams.push(limit, offset);
   
   const products = await executeQuery({
     query,
     values: queryParams,
   });
   ```
   
   Thành:
   ```javascript
   query += ' ORDER BY ...';
   
   const products = await executeQueryWithPagination({
     query,
     values: queryParams,
     limit,
     offset
   });
   ```

4. **Build và restart:**
   ```bash
   rm -rf .next
   npm run build
   pm2 restart all
   ```

### Cách 3: Sử dụng Git (nếu project dùng Git)

1. **Commit và push code từ local:**
   ```bash
   git add .
   git commit -m "Fix MySQL pagination error"
   git push origin main
   ```

2. **Trên server:**
   ```bash
   cd /var/www/html/nomo-shop
   git pull origin main
   rm -rf .next
   npm run build
   pm2 restart all
   ```

## Kiểm tra

Sau khi deploy, kiểm tra:

1. Xem logs để đảm bảo không còn lỗi:
   ```bash
   pm2 logs
   # hoặc
   tail -f logs/error.log
   ```

2. Test các endpoint:
   - `/api/admin/products`
   - `/api/admin/orders`
   - `/api/admin/customers`

## Lưu ý quan trọng

- **PHẢI xóa thư mục `.next`** trước khi build lại
- **PHẢI build lại** với `npm run build`
- **PHẢI restart** ứng dụng sau khi build

Nếu không làm 3 bước trên, server vẫn sẽ chạy code cũ!
