const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config({ path: '.env.local' });

async function createDefaultAdmin() {
  let connection;
  
  try {
    console.log('👨‍💼 Creating default admin user...');

    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'cloudshop'
    });

    // Check if admin exists
    const [existing] = await connection.execute(
      'SELECT id FROM users WHERE role = ? LIMIT 1',
      ['admin']
    );

    if (existing.length > 0) {
      console.log('ℹ️  Admin user already exists!');
      return;
    }

    // Create admin user
    const adminId = uuidv4();
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await connection.execute(
      `INSERT INTO users (id, name, email, phone, password, role) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [adminId, 'Administrator', 'admin@cloudshop.com', '0987654321', hashedPassword, 'admin']
    );

    console.log('✅ Default admin user created:');
    console.log('   📧 Email: admin@cloudshop.com');
    console.log('   📱 Phone: 0987654321');
    console.log('   🔐 Password: admin123');
    console.log('   🌐 Access: /admin');

  } catch (error) {
    console.error('❌ Error creating admin:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

if (require.main === module) {
  createDefaultAdmin()
    .then(() => {
      console.log('\n✅ Admin creation completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Admin creation failed:', error);
      process.exit(1);
    });
}

module.exports = { createDefaultAdmin };
