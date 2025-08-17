const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function createDatabase() {
  let connection;
  
  try {
    console.log('🔧 Creating Cloud Shop Database...\n');

    // Create connection without database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });

    console.log('✅ Connected to MySQL server');

    // Create database
    await connection.execute('CREATE DATABASE IF NOT EXISTS cloud_shop');
    console.log('✅ Database "cloud_shop" created successfully');

    await connection.end();
    console.log('✅ Connection closed');

    console.log('\n🎉 Database setup completed!');
    console.log('Now you can run: node scripts/setup-shop-status.js');

  } catch (error) {
    console.error('❌ Database creation failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('✅ Connection closed');
    }
  }
}

createDatabase();
