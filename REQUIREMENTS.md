# YÊU CẦU VÀ KẾ HOẠCH TRIỂN KHAI WEBSITE BÁN HÀNG ONLINE

## Tổng quan
Website bán hàng online cho phép khách hàng quét mã QR từ card giới thiệu để truy cập và đặt món. Trang web sẽ hoạt động như một hệ thống đặt món trực tuyến, tương tự như mô hình quét mã QR tại bàn trong nhà hàng.

## Yêu cầu chức năng

### Đối với khách hàng
1. **Truy cập website qua mã QR**
   - Khách hàng quét mã QR từ card giới thiệu để truy cập vào website

2. **Xem và đặt món**
   - Hiển thị danh sách sản phẩm theo danh mục
   - Tìm kiếm sản phẩm
   - Xem chi tiết sản phẩm (hình ảnh, mô tả, giá)

3. **Giỏ hàng**
   - Thêm sản phẩm vào giỏ hàng
   - Điều chỉnh số lượng
   - Xóa sản phẩm khỏi giỏ hàng

4. **Đặt hàng**
   - Nhập thông tin giao hàng (tên, số điện thoại, địa chỉ)
   - Tính khoảng cách từ shop đến địa điểm giao hàng
     - Free ship trong bán kính 3km
     - Phí ship tùy thuộc dịch vụ shipper bên ngoài nếu >3km

5. **Thanh toán**
   - Thanh toán qua VNPay
   - Thanh toán khi nhận hàng (COD)

6. **Tài khoản người dùng (không bắt buộc)**
   - Đăng ký/Đăng nhập
   - Lưu lịch sử đơn hàng
   - Lưu thông tin giao hàng

7. **Mã giảm giá**
   - Áp dụng mã giảm giá cho đơn hàng đầu tiên dựa trên số điện thoại

8. **Kiểm tra vị trí**
   - Hiển thị khoảng cách từ vị trí hiện tại của người dùng đến shop

### Đối với admin
1. **Quản lý sản phẩm**
   - Thêm/sửa/xóa sản phẩm
   - Quản lý danh mục
   - Upload hình ảnh sản phẩm

2. **Quản lý đơn hàng**
   - Xem danh sách đơn hàng
   - Cập nhật trạng thái đơn hàng
   - Tìm kiếm đơn hàng

3. **Quản lý khuyến mãi**
   - Tạo mã giảm giá
   - Thiết lập điều kiện áp dụng

4. **Báo cáo và thống kê**
   - Doanh thu theo thời gian
   - Sản phẩm bán chạy

## Giải pháp cho vấn đề đơn hàng ảo khi thanh toán COD
1. **Xác thực số điện thoại**
   - Gửi mã OTP để xác nhận đơn hàng
   - Giới hạn số lượng đơn hàng trên một số điện thoại trong một khoảng thời gian

2. **Đặt cọc một phần**
   - Yêu cầu thanh toán một phần nhỏ (10-20%) qua VNPay để xác nhận đơn hàng

3. **Blacklist**
   - Lưu danh sách các số điện thoại/địa chỉ đã hủy đơn nhiều lần

4. **Giới hạn giá trị đơn hàng COD**
   - Đặt mức giới hạn tối đa cho đơn hàng COD

## Kế hoạch triển khai

### Giai đoạn 1: Thiết kế và xây dựng cơ sở hạ tầng
1. Thiết kế database
2. Thiết kế UI/UX
3. Xây dựng cấu trúc dự án
4. Thiết lập môi trường phát triển

### Giai đoạn 2: Phát triển tính năng cơ bản
1. Xây dựng trang chủ và danh sách sản phẩm
2. Phát triển tính năng giỏ hàng
3. Phát triển form đặt hàng
4. Tích hợp API định vị và tính khoảng cách

### Giai đoạn 3: Phát triển tính năng thanh toán
1. Tích hợp thanh toán VNPay
2. Phát triển tính năng thanh toán COD
3. Phát triển tính năng mã giảm giá

### Giai đoạn 4: Phát triển trang quản trị
1. Xây dựng dashboard admin
2. Phát triển tính năng quản lý sản phẩm
3. Phát triển tính năng quản lý đơn hàng
4. Phát triển tính năng báo cáo thống kê

### Giai đoạn 5: Testing và triển khai
1. Kiểm thử toàn bộ hệ thống
2. Tối ưu hiệu suất
3. Triển khai lên server
4. Tạo mã QR cho marketing

## Công nghệ đề xuất

### Frontend
- React.js với Next.js (SSR/SSG)
- Tailwind CSS cho UI responsive
- Redux/Context API cho quản lý state

### Backend
- Node.js với Express hoặc NestJS
- MongoDB cho database
- Firebase Authentication (tùy chọn)
- Cloudinary/Firebase Storage cho lưu trữ hình ảnh

### API và Dịch vụ
- Google Maps API cho tính năng định vị và tính khoảng cách
- VNPay API cho thanh toán
- Twilio/Firebase Cloud Messaging cho gửi SMS OTP

### Deployment
- Vercel/Netlify cho frontend
- Heroku/AWS/Digital Ocean cho backend
- MongoDB Atlas cho database 