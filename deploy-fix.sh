#!/bin/bash

echo "==================================="
echo "Deploy fix cho lỗi MySQL pagination"
echo "==================================="

# Đường dẫn đến thư mục project trên server
PROJECT_DIR="/var/www/html/nomo-shop"

echo "1. Di chuyển đến thư mục project..."
cd $PROJECT_DIR

echo "2. Pull code mới nhất (nếu dùng git)..."
# git pull origin main

echo "3. Xóa thư mục .next cũ..."
rm -rf .next

echo "4. Cài đặt dependencies (nếu cần)..."
# npm install

echo "5. Build lại ứng dụng..."
npm run build

echo "6. Khởi động lại ứng dụng..."
# Nếu dùng PM2
pm2 restart all

# Hoặc nếu chạy trực tiếp
# npm start

echo "==================================="
echo "Hoàn thành! Ứng dụng đã được rebuild."
echo "==================================="
