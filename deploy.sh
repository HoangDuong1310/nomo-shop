#!/bin/bash

# 🚀 CLOUD SHOP - QUICK DEPLOYMENT SCRIPT
# Chạy script này sau khi upload project lên server

echo "🚀 Starting Cloud Shop Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if MySQL is running
if ! pgrep -x "mysqld" > /dev/null; then
    print_warning "MySQL is not running. Please start MySQL service first."
fi

print_status "Step 1/5: Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    print_error "Failed to install dependencies"
    exit 1
fi

print_status "Step 2/5: Setting up environment..."
if [ ! -f ".env.local" ]; then
    print_warning ".env.local not found. Creating from example..."
    cp .env.example .env.local
    print_warning "Please edit .env.local with your actual configuration!"
fi

print_status "Step 3/5: Setting up database..."
node scripts/setup-shop-status.js
if [ $? -ne 0 ]; then
    print_error "Database setup failed"
    exit 1
fi

print_status "Step 4/5: Building application..."
npm run build
if [ $? -ne 0 ]; then
    print_error "Build failed"
    exit 1
fi

print_status "Step 5/5: Setting up PM2..."
if command -v pm2 &> /dev/null; then
    pm2 start ecosystem.config.js
    pm2 save
    print_status "Application started with PM2"
else
    print_warning "PM2 not found. Starting with npm..."
    npm start &
fi

echo ""
echo "🎉 DEPLOYMENT COMPLETED!"
echo ""
echo "Next steps:"
echo "1. Edit .env.local with your actual configuration"
echo "2. Restart the application: pm2 restart cloud-shop"
echo "3. Check status: pm2 status"
echo "4. View logs: pm2 logs cloud-shop"
echo ""
echo "Your Cloud Shop should be running on http://localhost:3000"
