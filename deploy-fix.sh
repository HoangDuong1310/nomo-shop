#!/bin/bash

# 🚀 EMERGENCY DEPLOYMENT FIX - CSS/JS 404 Issues
# Run this when you get 404 errors for CSS/JS after deployment

echo "🔧 Emergency deployment fix for CSS/JS 404 errors..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[FIX]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Step 1: Stop all running instances
print_status "Step 1: Stopping all running instances..."
pm2 stop cloud-shop 2>/dev/null || echo "PM2 cloud-shop not running"
pm2 delete cloud-shop 2>/dev/null || echo "PM2 cloud-shop not found"
pkill -f "npm.*start" 2>/dev/null || echo "No npm processes found"
pkill -f "node.*next" 2>/dev/null || echo "No Next.js processes found"

# Step 2: Clear Next.js cache
print_status "Step 2: Clearing Next.js cache..."
rm -rf .next
npm run build

if [ $? -ne 0 ]; then
    print_error "Build failed! Check for TypeScript errors."
    exit 1
fi

# Step 3: Update Nginx config
print_status "Step 3: Updating Nginx configuration..."
sudo cp nginx-fixed.conf /etc/nginx/sites-available/nomoshop.app
sudo nginx -t
if [ $? -eq 0 ]; then
    sudo systemctl reload nginx
    print_status "Nginx configuration updated and reloaded"
else
    print_error "Nginx configuration error! Please check manually."
fi

# Step 4: Start fresh application
print_status "Step 4: Starting fresh application..."
pm2 start ecosystem.config.js
pm2 save

# Step 5: Verify
print_status "Step 5: Verifying deployment..."
sleep 5

# Check PM2 status
pm2 status

# Check if app responds
if curl -f http://localhost:3000 >/dev/null 2>&1; then
    echo "✅ Application is responding on localhost:3000"
else
    print_error "⚠️ Application is not responding"
fi

echo ""
echo "🎉 Emergency fix completed!"
echo ""
echo "If you still see 404 errors:"
echo "1. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)"
echo "2. Check: curl -I https://nomoshop.app/_next/static/"
echo "3. Check PM2 logs: pm2 logs cloud-shop"
echo "4. Verify Nginx config: sudo nginx -t"
