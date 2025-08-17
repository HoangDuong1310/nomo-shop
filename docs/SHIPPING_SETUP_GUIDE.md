# Hướng dẫn cấu hình tính phí ship

## 1. Cấu hình tọa độ cửa hàng

Đầu tiên, bạn cần cấu hình tọa độ cửa hàng trong Admin Panel:

1. Đăng nhập vào Admin Panel
2. Vào **Cài đặt** > **Thông tin cửa hàng**
3. Nhập **Vĩ độ (Latitude)** và **Kinh độ (Longitude)** của cửa hàng
   - Ví dụ cho TP.HCM: Latitude: 10.8231, Longitude: 106.6297
   - Có thể lấy tọa độ từ Google Maps: Click chuột phải tại vị trí cửa hàng > Copy tọa độ

## 2. Cấu hình phí ship

Trong phần **Cài đặt** > **Giao hàng**:

- **Bán kính giao hàng miễn phí**: Khoảng cách (km) được miễn phí ship (mặc định: 3km)
- **Phí giao hàng theo km**: Phí tính cho mỗi km vượt quá bán kính miễn phí (mặc định: 5,000đ/km)

## 3. Cấu hình Google Maps API (Tùy chọn - để tính chính xác hơn)

### Bước 1: Lấy Google Maps API Key
1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project có sẵn
3. Enable các API sau:
   - Distance Matrix API
   - Geocoding API (tùy chọn)
4. Tạo API Key trong phần Credentials

### Bước 2: Cấu hình API Key
1. Tạo file `.env.local` trong thư mục root của project
2. Thêm dòng sau:
```
GOOGLE_MAPS_API_KEY=your_api_key_here
```

## 4. Cách hệ thống tính phí ship

Hệ thống sẽ tính phí ship theo thứ tự ưu tiên sau:

### 1. Google Maps API (chính xác nhất)
- Tính khoảng cách thực tế qua đường đi
- Yêu cầu: Có API key và tọa độ cửa hàng

### 2. Công thức Haversine (chính xác vừa)
- Tính khoảng cách đường chim bay x 1.3 (ước tính đường đi thực tế)
- Yêu cầu: Có tọa độ cửa hàng
- Hỗ trợ các thành phố lớn và quận huyện tại Việt Nam

### 3. Ước tính theo từ khóa (fallback)
- Dựa trên từ khóa trong địa chỉ như "cùng quận", "gần", tên quận/thành phố
- Sử dụng khi không có tọa độ hoặc không nhận diện được địa chỉ

## 5. Test tính năng

Để test tính phí ship:

1. Vào trang Checkout
2. Nhập các địa chỉ test:
   - "123 Nguyễn Huệ, Quận 1, TP.HCM" 
   - "456 Lê Văn Sỹ, Quận 3, TP.HCM"
   - "789 Võ Văn Ngân, Thủ Đức, TP.HCM"
   - "Đà Nẵng"

3. Trong môi trường development, check Console để xem debug info

## 6. Khắc phục sự cố

### Phí ship không chính xác
1. Kiểm tra tọa độ cửa hàng đã cấu hình chưa
2. Kiểm tra Google Maps API key (nếu có)
3. Xem debug info trong Console (development mode)

### Lỗi "Không thể tính phí giao hàng"
1. Kiểm tra kết nối mạng
2. Kiểm tra server đang chạy
3. Thử refresh trang và tính lại

## 7. Tùy chỉnh thêm

Bạn có thể tùy chỉnh thêm trong file `/pages/api/shipping/calc-distance.ts`:

- Thêm nhiều địa điểm vào `vietnamLocations`
- Điều chỉnh hệ số nhân cho Haversine (mặc định 1.3)
- Thay đổi logic ước tính theo từ khóa
- Thêm caching để giảm chi phí Google Maps API



