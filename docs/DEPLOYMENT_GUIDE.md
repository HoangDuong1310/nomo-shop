# 🚀 DEPLOYMENT GUIDE - CLOUD SHOP

## 📋 PREREQUISITE (Chuẩn bị trước)
- [x] Server với Node.js 18+ 
- [x] MySQL/MariaDB
- [x] Domain name (optional)
- [x] SSL certificate (optional)

## 🔧 DEPLOYMENT STEPS

### 1. 📦 UPLOAD PROJECT
```bash
# Upload toàn bộ project lên server (trừ node_modules, .next)
# Có thể dùng FTP, SCP, hoặc Git
```

### 2. 🗄️ DATABASE SETUP (ONE COMMAND!)
```bash
# Tạo database
mysql -u root -p -e "CREATE DATABASE cloudshop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Setup EVERYTHING với 1 lệnh duy nhất:
cd /path/to/your/project
npm run setup
```

**✨ What this single command does:**
- ✅ Creates all 17 database tables
- ✅ Sets up shop status system with operating hours
- ✅ Configures email notification system  
- ✅ Creates product variants and attributes system
- ✅ Creates admin user (admin@cloudshop.com / admin123)
- ✅ Adds 6 demo products with categories
- ✅ Adds demo discount codes (WELCOME10, FREESHIP)

**Alternative manual setup (not recommended):**
```bash
# If you want to run individual scripts:
npm run setup-db      # Database schema only
npm run create-admin  # Admin user only
npm run seed-demo     # Demo data only
```

### 3. ⚙️ ENVIRONMENT CONFIG
```bash
# 🔧 DEVELOPMENT (local)
cp .env.example .env.local
nano .env.local

# 🚀 PRODUCTION (server)  
cp .env.example .env
nano .env
```

**📝 Environment File Priority:**
1. `.env.local` (development, ignored by git)
2. `.env` (production, can be committed)  
3. Default values (if no env file found)

The `npm run setup` command will automatically detect and use the appropriate environment file.

### 4. 📦 INSTALL & DEPLOY
```bash
# Install dependencies và setup hoàn chỉnh
npm run deploy

# This command does:
# - npm install
# - npm run setup (complete database + admin + demo data)  
# - npm run build
```

### 5. 🏗️ BUILD PROJECT
```bash
npm run build
```

### 6. 🚀 START APPLICATION
```bash
# Development
npm run dev

# Production với PM2
npm install -g pm2
pm2 start npm --name "cloud-shop" -- start
pm2 save
pm2 startup
```

---

## 🎯 QUICK DEPLOYMENT (5 lệnh chính)

Sau khi upload project lên server, chạy theo thứ tự:

### Bước 1: Cài đặt dependencies
```bash
npm install
```

### Bước 2: Setup database 
```bash
node scripts/setup-shop-status.js
```

### Bước 3: Build project
```bash
npm run build
```

### Bước 4: Start production server
```bash
npm start
```

### Bước 5: (Optional) Setup PM2 cho production
```bash
npm install -g pm2
pm2 start npm --name "cloud-shop" -- start
pm2 save
pm2 startup
```

---

## 📝 FILE CẦN THIẾT

### Tối thiểu cần có:
- `.env.local` - Environment variables
- `package.json` - Dependencies
- Toàn bộ source code (trừ node_modules, .next)

### Cấu hình Environment Variables:

**📁 For PRODUCTION (.env):**
```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_production_password
DB_DATABASE=cloudshop

# Application
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-production-secret-key

# Email (production SMTP)
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-production-email
SMTP_PASS=your-production-password

# Payment (VNPay production)
VNPAY_TMN_CODE=your-production-vnpay-code
VNPAY_SECRET_KEY=your-production-vnpay-secret
```

**📁 For DEVELOPMENT (.env.local):**
```env
# Database (local)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_local_password
DB_DATABASE=cloudshop_dev

# Application (local)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-dev-secret-key

# Email (test SMTP or development)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-test-email@gmail.com
SMTP_PASS=your-app-password

# Payment (VNPay sandbox)
VNPAY_TMN_CODE=your-sandbox-vnpay-code
VNPAY_SECRET_KEY=your-sandbox-vnpay-secret
```

---

## 🔄 UPDATE PROJECT (Khi có version mới)

```bash
# 1. Stop server
pm2 stop cloud-shop

# 2. Backup database
mysqldump -u root -p cloudshop > backup.sql

# 3. Update code
git pull origin main
# hoặc upload file mới

# 4. Install new dependencies
npm install

# 5. Run migrations (nếu có)
# node scripts/migrate.js

# 6. Rebuild
npm run build

# 7. Restart server
pm2 start cloud-shop
```

---

## 🚨 TROUBLESHOOTING

### Lỗi thường gặp:

1. **Database connection failed**
   ```bash
   # Kiểm tra MySQL running
   sudo systemctl status mysql
   
   # Test connection
   mysql -u root -p
   ```

2. **Port đã được sử dụng**
   ```bash
   # Kiểm tra port 3000
   lsof -i :3000
   
   # Thay đổi port trong package.json
   "start": "next start -p 8080"
   ```

3. **Permission denied**
   ```bash
   # Phân quyền folder
   chown -R www-data:www-data /path/to/project
   chmod -R 755 /path/to/project
   ```

---

## ⚡ PRODUCTION OPTIMIZATIONS

### 1. Use PM2 Cluster Mode
```bash
pm2 start ecosystem.config.js
```

### 2. Setup Nginx Reverse Proxy
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. Setup SSL with Let's Encrypt
```bash
sudo certbot --nginx -d yourdomain.com
```

---

## 📊 MONITORING

```bash
# Check application status
pm2 status
pm2 logs cloud-shop

# Check system resources
htop
df -h

# Check database
mysql -u root -p -e "SHOW PROCESSLIST;"
```

---

**🎉 DEPLOYMENT COMPLETED!**

Your Cloud Shop is now running in production mode.
