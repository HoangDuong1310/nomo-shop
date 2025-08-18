const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const mysql = require('mysql2/promise');

async function createAdmin() {
  // Kết nối database
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || process.env.MYSQL_PORT || '3306'),
    user: process.env.DB_USER || process.env.MYSQL_USER || 'root',
    password: process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || '',
    database: process.env.DB_DATABASE || process.env.MYSQL_DATABASE || 'cloudshop',
  });

  try {
    console.log('Đang tạo tài khoản admin...');

    // Tạo mật khẩu hash
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    const adminId = uuidv4();
    const adminPhone = '0987000999'; // Đổi số điện thoại mới

    // Xóa admin cũ nếu có (để tránh lỗi trùng email/phone)
    await connection.execute(
      'DELETE FROM users WHERE email = ? OR phone = ?',
      ['admin@cloudshop.com', adminPhone]
    );

    // Thêm tài khoản admin mới
    await connection.execute(
      'INSERT INTO users (id, name, email, phone, password, role, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [adminId, 'Admin', 'admin@cloudshop.com', adminPhone, hashedPassword, 'admin']
    );

    console.log('✅ Tài khoản admin đã được tạo thành công!');
    console.log('Email: admin@cloudshop.com');
    console.log('Mật khẩu: admin123');
  } catch (error) {
    console.error('❌ Lỗi khi tạo tài khoản admin:', error);
  } finally {
    // Đóng kết nối
    await connection.end();
  }
}

// Thực thi script
createAdmin(); 