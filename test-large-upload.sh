#!/bin/bash

# Script test upload file lớn
# Tạo file test 1.5MB
echo "Tạo file test 1.5MB..."
dd if=/dev/zero of=test-1.5mb.png bs=1024 count=1536

# Test upload qua API
echo "Test upload file 1.5MB..."
curl -v -X POST \
  -F "image=@test-1.5mb.png" \
  http://127.0.0.1:3000/api/upload-image

echo ""
echo "Kiểm tra nginx error logs..."
tail -5 /var/log/nginx/error.log

echo ""
echo "Kiểm tra PM2 logs..."
pm2 logs cloud-shop --lines 10

# Cleanup
rm -f test-1.5mb.png
