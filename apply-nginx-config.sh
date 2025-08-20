#!/bin/bash

# Script để apply cấu hình nginx cải thiện
echo "Applying improved nginx configuration..."

# Copy cấu hình mới
sudo cp /var/www/html/nomo-shop/nginx-improved.conf /etc/nginx/sites-available/nomoshop.app.conf

# Test cấu hình nginx
echo "Testing nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "Nginx configuration is valid. Reloading..."
    sudo systemctl reload nginx
    echo "Nginx reloaded successfully!"
else
    echo "Nginx configuration is invalid. Restoring backup..."
    sudo cp /etc/nginx/sites-available/nomoshop.app.conf.backup /etc/nginx/sites-available/nomoshop.app.conf
    echo "Backup restored."
fi
