#!/bin/bash

# Web Push Notifications Setup Script
# This script sets up the complete push notification system

echo "🔔 Setting up Web Push Notifications for Cloud Shop..."
echo ""

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "📦 Installing required dependencies..."
npm install web-push @types/web-push

echo ""
echo "🔑 Generating VAPID keys..."
node scripts/generate-vapid-keys.js

echo ""
echo "🗄️  Setting up database tables..."
node scripts/setup-push-notifications.js

echo ""
echo "✅ Push notifications setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Add the generated VAPID keys to your .env file"
echo "2. Restart your development server"
echo "3. Test push notifications in the admin panel"
echo "4. Configure HTTPS for production deployment"
echo ""
echo "📖 See docs/PUSH_NOTIFICATIONS_SETUP.md for detailed configuration"
