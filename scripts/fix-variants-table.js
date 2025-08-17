// Script để tạo bảng product_variants nếu thiếu
const mysql = require('mysql2/promise');

async function fixVariantsTable() {
  let connection;
  
  try {
    console.log('🔧 Fixing product_variants table...\n');

    // Kết nối đến MySQL
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'cloudshop'
    });

    // Kiểm tra bảng có tồn tại không
    try {
      await connection.execute('DESCRIBE product_variants');
      console.log('✅ Table product_variants already exists');
      return;
    } catch (error) {
      console.log('⚠️  Table product_variants does not exist, creating...');
    }

    // Tạo bảng product_variants
    await connection.execute(`
      CREATE TABLE product_variants (
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

    console.log('✅ Table product_variants created successfully!');

    // Kiểm tra lại
    const [result] = await connection.execute('DESCRIBE product_variants');
    console.log(`📋 Table structure:`, result);

    console.log('\n🎯 Next steps:');
    console.log('1. Visit: http://localhost:3000/admin/products');
    console.log('2. Click gear icon (⚙️) next to any product');
    console.log('3. Add variants with pricing');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixVariantsTable();