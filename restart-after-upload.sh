#!/bin/bash

# Script để restart Next.js app sau khi upload files
# File: restart-after-upload.sh

echo "Restarting Next.js application..."
pm2 restart cloud-shop
echo "Application restarted successfully!"

# Có thể thêm vào API upload để tự động restart
