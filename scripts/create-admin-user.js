// Script để tạo tài khoản admin
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function createAdminUser() {
  let connection;
  
  try {
    // Kết nối đến MySQL
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'cloudshop'
    });

    console.log('✅ Kết nối database thành công');

    // Thông tin admin mặc định
    const adminData = {
      id: uuidv4(),
      name: 'Administrator',
      email: 'admin@cloudshop.com',
      phone: '0123456789',
      address: '123 Admin Street',
      password: 'admin123456', // Mật khẩu mặc định
      role: 'admin'
    };

    // Kiểm tra xem admin đã tồn tại chưa
    const [existingAdmin] = await connection.execute(
      'SELECT * FROM users WHERE email = ? OR role = "admin"',
      [adminData.email]
    );

    if (existingAdmin.length > 0) {
      console.log('⚠️  Tài khoản admin đã tồn tại');
      console.log('📧 Email:', adminData.email);
      console.log('🔑 Mật khẩu mặc định: admin123456');
      return;
    }

    // Hash mật khẩu
    const hashedPassword = await bcrypt.hash(adminData.password, 10);

    // Tạo tài khoản admin
    await connection.execute(
      `INSERT INTO users (id, name, email, phone, address, password, role, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        adminData.id,
        adminData.name,
        adminData.email,
        adminData.phone,
        adminData.address,
        hashedPassword,
        adminData.role
      ]
    );

    console.log('🎉 Tạo tài khoản admin thành công!');
    console.log('📧 Email:', adminData.email);
    console.log('🔑 Mật khẩu:', adminData.password);
    console.log('🔗 Đăng nhập tại: http://localhost:3000/auth/login');
    console.log('');
    console.log('⚠️  Hãy đổi mật khẩu sau khi đăng nhập lần đầu!');

  } catch (error) {
    console.error('❌ Lỗi khi tạo tài khoản admin:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Chạy script
createAdminUser();