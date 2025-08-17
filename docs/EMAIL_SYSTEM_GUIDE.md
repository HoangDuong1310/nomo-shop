# 📧 Hướng Dẫn Hệ Thống Email - Cloud Shop

## 🎯 Tổng Quan
Hệ thống email tự động đã được tích hợp hoàn chỉnh với các luồng sau:

### 📨 Email Flows Đã Triển Khai
1. **Welcome Email** - Chào mừng user mới đăng ký
2. **Order Confirmation** - Xác nhận đơn hàng cho khách
3. **Payment Success** - Thông báo thanh toán thành công
4. **Order Status Update** - Cập nhật trạng thái đơn hàng
5. **Admin New Order** - Thông báo admin có đơn mới
6. **Admin Payment Received** - Thông báo admin nhận được thanh toán

## 🔧 Cấu Hình Production

### 1. Cập Nhật SMTP Credentials
Trong file `.env.local`, thay đổi:
```env
# Email Configuration (Production)
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-business-email@yourdomain.com
SMTP_PASS=your-app-password
EMAIL_FROM=your-business-email@yourdomain.com
EMAIL_FROM_NAME=Cloud Shop
```

### 2. Cấu Hình Gmail Business (Khuyến nghị)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-business@gmail.com
SMTP_PASS=your-16-digit-app-password
EMAIL_FROM=your-business@gmail.com
EMAIL_FROM_NAME=Cloud Shop
```

### 3. Admin Email Configuration
```env
ADMIN_EMAIL=admin@yourstore.com
ADMIN_NAME=Store Admin
```

## 📋 Test Scenarios Đã Validate

### ✅ User Registration Flow
```
User đăng ký → Welcome Email tự động gửi
Test: ✅ Thành công
```

### ✅ Order Creation Flow  
```
User tạo đơn → Order Confirmation (User) + Admin Alert (Admin)
Test: ✅ Thành công
```

### ✅ Order Status Update Flow
```
Admin cập nhật → Status Update Email (User)
Test: ✅ Thành công
```

### ✅ Payment Flow
```
Payment thành công → Payment Success (User) + Payment Alert (Admin)  
Test: ✅ Thành công
```

## 🛠️ Troubleshooting

### 1. Email không được gửi
- Kiểm tra SMTP credentials trong `.env.local`
- Kiểm tra logs trong database table `email_logs`
- Kiểm tra server console cho error messages

### 2. Gmail SMTP Issues
- Đảm bảo đã enable 2FA
- Sử dụng App Password thay vì password thường
- Kiểm tra "Less secure apps" setting

### 3. Template Issues
- Kiểm tra file templates trong `/email-templates/`
- Validate Handlebars syntax
- Kiểm tra custom helpers (multiply, eq, formatCurrency)

## 📊 Monitoring

### Database Logging
Tất cả emails được log trong `email_logs` table:
```sql
SELECT * FROM email_logs 
WHERE created_at > DATE_SUB(NOW(), INTERVAL 1 DAY)
ORDER BY created_at DESC;
```

### Email Preferences
Users có thể quản lý preferences trong `user_email_preferences`:
```sql
SELECT * FROM user_email_preferences WHERE user_id = ?;
```

## 🎨 Customization

### 1. Sửa Email Templates
- Files trong `/email-templates/`
- Sử dụng Handlebars syntax
- Responsive design đã có sẵn

### 2. Thêm Email Types Mới
1. Tạo template HTML mới
2. Thêm method vào `EmailService` class
3. Tích hợp vào API endpoints

### 3. Custom Styling
- Sửa CSS inline trong templates
- Maintain responsive design
- Test trên multiple email clients

## 🚀 Performance Tips

1. **Async Email Sending**: Emails được gửi không block main API response
2. **Error Handling**: Email errors không làm crash API endpoints  
3. **Template Caching**: Templates được cache sau lần đọc đầu tiên
4. **Connection Pooling**: SMTP connection được reuse

## 📞 Support
- Check `/scripts/test-email-integration.js` để test
- Monitor email_logs table để debugging
- Kiểm tra server console logs
