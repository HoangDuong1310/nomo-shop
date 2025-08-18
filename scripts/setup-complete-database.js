const mysql = require('mysql2/promise');
const { loadEnvConfig } = require('./utils/env-loader');

// Load environment config (sẽ tự động chọn .env.local hoặc .env)
loadEnvConfig();

async function setupCompleteDatabase() {
  let connection;
  
  try {
    console.log('🚀 COMPLETE DATABASE SETUP - CLOUD SHOP');
    console.log('=====================================\n');

    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'cloudshop'
    });

    console.log('✅ Connected to database:', process.env.DB_DATABASE || 'cloudshop');

    // 1. BASIC SCHEMA SETUP
    console.log('\n1️⃣ Setting up basic schema...');
    
    // Categories table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        image VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Products table with all fields
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        sale_price DECIMAL(10, 2) NULL,
        image VARCHAR(255),
        category_id VARCHAR(50) NOT NULL,
        options JSON,
        stock_quantity INT DEFAULT 0,
        is_featured BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id)
      )
    `);

    // Users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE,
        phone VARCHAR(20) UNIQUE NOT NULL,
        password VARCHAR(255),
        address TEXT,
        role ENUM('user', 'admin') DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Orders table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(50) PRIMARY KEY,
        user_id VARCHAR(50),
        full_name VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        address TEXT NOT NULL,
        note TEXT,
        subtotal DECIMAL(10, 2) NOT NULL,
        shipping_fee DECIMAL(10, 2) NOT NULL,
        discount DECIMAL(10, 2) DEFAULT 0,
        total DECIMAL(10, 2) NOT NULL,
        payment_method ENUM('cod', 'vnpay') DEFAULT 'cod',
        payment_status ENUM('pending', 'paid', 'failed') DEFAULT 'pending',
        order_status ENUM('pending', 'confirmed', 'processing', 'shipping', 'completed', 'cancelled') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Order items table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS order_items (
        id VARCHAR(50) PRIMARY KEY,
        order_id VARCHAR(50) NOT NULL,
        product_id VARCHAR(50) NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        product_option VARCHAR(255),
        price DECIMAL(10, 2) NOT NULL,
        quantity INT NOT NULL,
        subtotal DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `);

    // Discounts table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS discounts (
        id VARCHAR(50) PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        type ENUM('percentage', 'fixed') NOT NULL,
        value DECIMAL(10, 2) NOT NULL,
        min_order_value DECIMAL(10, 2) DEFAULT 0,
        usage_limit INT DEFAULT 1,
        used_count INT DEFAULT 0,
        start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        end_date TIMESTAMP NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // First order discounts table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS first_order_discounts (
        id VARCHAR(50) PRIMARY KEY,
        phone VARCHAR(20) NOT NULL,
        order_id VARCHAR(50) NOT NULL,
        discount_amount DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id),
        UNIQUE KEY unique_phone_discount (phone)
      )
    `);

    // Product variants table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS product_variants (
        id VARCHAR(50) PRIMARY KEY,
        product_id VARCHAR(50) NOT NULL,
        variant_name VARCHAR(255) NOT NULL,
        variant_value VARCHAR(255) NOT NULL,
        price_adjustment DECIMAL(10, 2) DEFAULT 0,
        stock_quantity INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id),
        UNIQUE KEY unique_product_variant (product_id, variant_name, variant_value)
      )
    `);

    // Settings table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS settings (
        setting_key VARCHAR(100) PRIMARY KEY,
        setting_value TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Basic schema created');

    // 2. SHOP STATUS SYSTEM
    console.log('\n2️⃣ Setting up shop status system...');
    
    // Operating hours table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS shop_operating_hours (
        id INT PRIMARY KEY AUTO_INCREMENT,
        day_of_week INT NOT NULL,
        open_time TIME,
        close_time TIME,
        is_open BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_day (day_of_week)
      )
    `);

    // Shop notifications table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS shop_notifications (
        id VARCHAR(36) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        message TEXT,
        start_date DATETIME NOT NULL,
        end_date DATETIME NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        show_overlay BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Email notifications table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS shop_email_notifications (
        id INT PRIMARY KEY AUTO_INCREMENT,
        email VARCHAR(255) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_email (email)
      )
    `);

    // Shop status settings table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS shop_status_settings (
        setting_key VARCHAR(100) PRIMARY KEY,
        setting_value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Shop status system created');

    // 3. EMAIL SYSTEM
    console.log('\n3️⃣ Setting up email system...');

    // Email logs table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS email_logs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        to_email VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        template_name VARCHAR(100),
        status ENUM('sent', 'failed', 'pending') DEFAULT 'pending',
        error_message TEXT,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Email preferences table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS email_preferences (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id VARCHAR(50),
        email VARCHAR(255) NOT NULL,
        order_confirmations BOOLEAN DEFAULT TRUE,
        promotions BOOLEAN DEFAULT TRUE,
        shop_updates BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        UNIQUE KEY unique_email (email)
      )
    `);

    console.log('✅ Email system created');

    // 4. PRODUCT ATTRIBUTES SYSTEM (if needed)
    console.log('\n4️⃣ Setting up product attributes system...');
    
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS product_attributes (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        type ENUM('select', 'color', 'size', 'text') DEFAULT 'select',
        description TEXT,
        is_required BOOLEAN DEFAULT FALSE,
        display_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS attribute_values (
        id VARCHAR(50) PRIMARY KEY,
        attribute_id VARCHAR(50) NOT NULL,
        value VARCHAR(255) NOT NULL,
        display_name VARCHAR(255) NOT NULL,
        color_code VARCHAR(7) NULL,
        price_adjustment DECIMAL(10, 2) DEFAULT 0,
        display_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (attribute_id) REFERENCES product_attributes(id),
        UNIQUE KEY unique_attribute_value (attribute_id, value)
      )
    `);

    console.log('✅ Product attributes system created');

    // 5. INSERT DEFAULT DATA
    console.log('\n5️⃣ Inserting default data...');

    // Default categories
    const [existingCategories] = await connection.execute('SELECT COUNT(*) as count FROM categories');
    if (existingCategories[0].count === 0) {
      await connection.execute(`
        INSERT INTO categories (id, name, description) VALUES 
        ('drinks', 'Đồ uống', 'Các loại đồ uống, nước giải khát'),
        ('food', 'Đồ ăn', 'Các món ăn chính'),
        ('snacks', 'Đồ ăn vặt', 'Bánh kẹo, snack'),
        ('dessert', 'Tráng miệng', 'Các món tráng miệng, bánh ngọt')
      `);
      console.log('✅ Default categories inserted');
    }

    // Default operating hours (7 days a week, 9 AM - 9 PM)
    const [existingHours] = await connection.execute('SELECT COUNT(*) as count FROM shop_operating_hours');
    if (existingHours[0].count === 0) {
      for (let day = 0; day <= 6; day++) {
        await connection.execute(
          'INSERT INTO shop_operating_hours (day_of_week, open_time, close_time, is_open) VALUES (?, ?, ?, ?)',
          [day, '09:00:00', '21:00:00', true]
        );
      }
      console.log('✅ Default operating hours inserted');
    }

    // Default shop status settings
    const defaultSettings = [
      ['enable_overlay', 'true'],
      ['overlay_message', 'Cửa hàng hiện đang đóng cửa. Vui lòng quay lại trong giờ hoạt động.'],
      ['force_status', 'auto']
    ];

    for (const [key, value] of defaultSettings) {
      await connection.execute(
        'INSERT IGNORE INTO shop_status_settings (setting_key, setting_value) VALUES (?, ?)',
        [key, value]
      );
    }
    console.log('✅ Default shop status settings inserted');

    // Default store settings
    const storeSettings = [
      ['store.store_name', 'Cloud Shop'],
      ['store.store_description', 'Chuỗi cửa hàng đồ uống chất lượng cao'],
      ['store.store_address', '123 Đường ABC, Quận 1, TP. Hồ Chí Minh'],
      ['store.store_phone', '0987654321'],
      ['store.store_email', 'contact@cloudshop.com'],
      ['store.store_hours', 'T2-T6: 7:00 - 22:00, T7-CN: 7:00 - 23:00']
    ];

    for (const [key, value] of storeSettings) {
      await connection.execute(
        'INSERT IGNORE INTO settings (setting_key, setting_value) VALUES (?, ?)',
        [key, value]
      );
    }
    console.log('✅ Default store settings inserted');

    // 6. VERIFICATION
    console.log('\n6️⃣ Verifying setup...');
    
    const tables = [
      'categories', 'products', 'users', 'orders', 'order_items', 'discounts',
      'first_order_discounts', 'product_variants', 'settings',
      'shop_operating_hours', 'shop_notifications', 'shop_email_notifications', 
      'shop_status_settings', 'email_logs', 'email_preferences',
      'product_attributes', 'attribute_values'
    ];

    console.log('📊 Database tables status:');
    for (const table of tables) {
      try {
        const [result] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`   ✅ ${table}: ${result[0].count} records`);
      } catch (error) {
        console.log(`   ❌ ${table}: ERROR - ${error.message}`);
      }
    }

    console.log('\n🎉 COMPLETE DATABASE SETUP FINISHED!');
    console.log('=====================================');
    console.log('\n📋 Next steps:');
    console.log('   1. Run: npm run build');
    console.log('   2. Run: npm start');
    console.log('   3. Access admin: /admin');
    console.log('   4. Create admin user if needed: npm run create-admin');

  } catch (error) {
    console.error('❌ Database setup error:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run setup
if (require.main === module) {
  setupCompleteDatabase()
    .then(() => {
      console.log('\n✅ Database setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Database setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupCompleteDatabase };
