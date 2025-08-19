# Hệ thống QR Redirects

Cho phép dùng 1 (hoặc nhiều) slug cố định để in mã QR, trong khi URL đích có thể thay đổi động trong admin.

## Cấu trúc bảng
```sql
CREATE TABLE qr_redirects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(100) NOT NULL UNIQUE,
  target_url TEXT NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  hit_count BIGINT NOT NULL DEFAULT 0,
  last_hit_at DATETIME NULL,
  updated_by VARCHAR(64) NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```
Seed ví dụ:
```sql
INSERT INTO qr_redirects (slug, target_url) VALUES ('card', 'https://example.com/landing');
```

## Các file chính
- `lib/qr-redirects.ts`: helper thao tác DB + cache nhẹ.
- `pages/r/[slug].tsx`: SSR redirect theo slug.
- `pages/api/admin/qr/update.ts`: API admin update / tạo bản ghi.
- `pages/api/qr/[slug].ts`: API public đọc thông tin slug.
- `pages/admin/qr/index.tsx`: UI quản trị đơn giản.

## Cách dùng
1. Tạo slug và URL đích trong trang admin.
2. In mã QR trỏ tới `https://<domain>/r/<slug>`.
3. Khi cần đổi landing page: chỉ sửa `target_url` và lưu.
4. Lượt truy cập được đếm trong `hit_count`.

## Mở rộng tương lai
- Thêm trang danh sách tất cả slug + lọc.
- Ghi log IP / user-agent riêng.
- UTM auto append.
- Edge runtime + KV cache.
- Chế độ redirect 301 cấu hình riêng.
