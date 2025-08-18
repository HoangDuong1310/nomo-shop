@echo off
REM 🚀 CLOUD SHOP - QUICK DEPLOYMENT SCRIPT (Windows)
REM Chạy script này sau khi upload project lên server

echo 🚀 Starting Cloud Shop Deployment...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

echo [INFO] Step 1/5: Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)

echo [INFO] Step 2/5: Setting up environment...
if not exist ".env.local" (
    echo [WARNING] .env.local not found. Creating from example...
    copy .env.example .env.local
    echo [WARNING] Please edit .env.local with your actual configuration!
)

echo [INFO] Step 3/5: Setting up database...
node scripts\setup-shop-status.js
if %errorlevel% neq 0 (
    echo [ERROR] Database setup failed
    pause
    exit /b 1
)

echo [INFO] Step 4/5: Building application...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Build failed
    pause
    exit /b 1
)

echo [INFO] Step 5/5: Starting application...
pm2 --version >nul 2>&1
if %errorlevel% equ 0 (
    pm2 start ecosystem.config.js
    pm2 save
    echo [INFO] Application started with PM2
) else (
    echo [WARNING] PM2 not found. Starting with npm...
    start npm start
)

echo.
echo 🎉 DEPLOYMENT COMPLETED!
echo.
echo Next steps:
echo 1. Edit .env.local with your actual configuration
echo 2. Restart the application: pm2 restart cloud-shop
echo 3. Check status: pm2 status
echo 4. View logs: pm2 logs cloud-shop
echo.
echo Your Cloud Shop should be running on http://localhost:3000

pause
