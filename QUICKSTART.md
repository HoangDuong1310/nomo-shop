# 🎯 QUICKSTART GUIDE - CLOUD SHOP

## ⚡ SUPER FAST SETUP (2 Minutes!)

### Prerequisites 
- Node.js 18+
- MySQL/MariaDB running
- Database created: `cloudshop`

### 1. Clone & Install
```bash
git clone <your-repo>
cd cloud-shop
npm install
```

### 2. Environment Setup
```bash
# Copy and edit environment file
cp .env.example .env.local

# Edit database credentials:
# DB_HOST=localhost
# DB_USER=root  
# DB_PASSWORD=your_password
# DB_DATABASE=cloudshop
```

### 3. ONE COMMAND SETUP 🚀
```bash
npm run setup
```
**This does EVERYTHING:**
- ✅ Creates 17 database tables
- ✅ Shop status system + operating hours
- ✅ Email notification system
- ✅ Product variants & attributes
- ✅ Admin user (admin@cloudshop.com / admin123)
- ✅ 6 demo products + categories
- ✅ Demo discount codes

### 4. Build & Start
```bash
npm run build
npm start
```

### 5. Access Your Shop 🎉
- **Shop:** http://localhost:3000
- **Admin:** http://localhost:3000/admin
- **Login:** admin@cloudshop.com / admin123

---

## 📋 Available NPM Commands

```bash
# Development
npm run dev              # Start development server

# Setup Commands  
npm run setup           # Complete setup (database + admin + demo)
npm run setup-db        # Database tables only
npm run create-admin    # Admin user only
npm run seed-demo       # Demo data only

# Production
npm run build           # Build for production
npm start               # Start production server
npm run deploy          # Full deployment (install + setup + build)

# PM2 (Production with clustering)
npm run pm2:start       # Start with PM2
npm run pm2:stop        # Stop PM2
npm run pm2:restart     # Restart PM2
npm run pm2:delete      # Delete PM2 process
```

---

## 🎫 Demo Features

**Demo Discount Codes:**
- `WELCOME10` - 10% off orders over 50,000đ
- `FREESHIP` - Free shipping (15,000đ off) orders over 100,000đ

**Demo Products:**
- Cà phê đen đá (25,000đ → 20,000đ sale)
- Cà phê sữa đá (30,000đ)  
- Trá sữa truyền thống (35,000đ)
- Bánh mì thịt nướng (20,000đ)
- Bánh croissant bơ (15,000đ)
- Kẹo dẻo trái cây (12,000đ)

**Features Ready:**
- ✅ Product catalog with variants
- ✅ Shopping cart & checkout
- ✅ Order management
- ✅ Admin panel with all CRUD operations
- ✅ Shop operating hours control
- ✅ Email notifications
- ✅ Discount codes system
- ✅ User accounts & authentication
- ✅ VNPay payment integration
- ✅ Responsive design

---

## 🆘 Quick Troubleshooting

**Database Connection Error?**
```bash
# Check .env.local file
# Ensure MySQL is running
# Verify database 'cloudshop' exists
```

**Build Error?**
```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

**Admin Can't Login?**
```bash
# Recreate admin user
npm run create-admin
```

**Need Fresh Demo Data?**
```bash
# Clear products table and re-seed
npm run seed-demo
```

---

**🎉 You're ready to go! Happy coding! 🚀**
