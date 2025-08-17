# Cloud Shop - Ứng dụng đặt món trực tuyến qua mã QR

Ứng dụng web cho phép khách hàng quét mã QR để truy cập website và đặt món trực tuyến. Hỗ trợ thanh toán qua VNPay hoặc thanh toán khi nhận hàng.

## Tính năng chính

- Đặt món thông qua quét mã QR
- Giỏ hàng và thanh toán trực tuyến
- Free ship trong bán kính 3km
- Tính năng định vị và tính khoảng cách
- Hệ thống admin quản lý đơn hàng
- Mã giảm giá cho đơn hàng đầu tiên
- Giao diện responsive cho cả máy tính và điện thoại

## Cài đặt

1. Clone repository
```bash
git clone https://github.com/yourusername/cloud-shop.git
cd cloud-shop
```

2. Cài đặt dependencies
```bash
npm install
# hoặc
yarn install
```

3. Tạo file môi trường
Tạo file `.env.local` với các biến môi trường sau:
```
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=cloudshop
MYSQL_USER=root
MYSQL_PASSWORD=your_mysql_password
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
VNPAY_MERCHANT_CODE=your_vnpay_merchant_code
VNPAY_SECRET_KEY=your_vnpay_secret_key
```

4. Chạy ứng dụng trong môi trường phát triển
```bash
npm run dev
# hoặc
yarn dev
```

5. Build và chạy ứng dụng trong môi trường production
```bash
npm run build
npm run start
# hoặc
yarn build
yarn start
```

## Công nghệ sử dụng

- Next.js 14
- React.js 18
- TypeScript
- Tailwind CSS
- MySQL
- Node.js
- Google Maps API
- VNPay API

## Yêu cầu hệ thống

- Node.js 18.x trở lên
- NPM 8.x trở lên hoặc Yarn 1.22.x trở lên
- MySQL 8.0 trở lên

## Tài liệu tham khảo

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://reactjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [Google Maps Platform Documentation](https://developers.google.com/maps/documentation)
- [VNPay API Documentation](https://sandbox.vnpayment.vn/apis) 