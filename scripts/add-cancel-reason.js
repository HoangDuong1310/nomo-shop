require('dotenv').config({ path: '.env.local' });
const mysql = require('mysql2/promise');

async function addCancelReasonColumn() {
  console.log('🔄 Đang thêm cột cancel_reason vào bảng orders...');

  try {
    // Kết nối đến MySQL
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      database: process.env.MYSQL_DATABASE || 'cloudshop',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
    });

    // Kiểm tra xem cột đã tồn tại chưa
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'cancel_reason'
    `, [process.env.MYSQL_DATABASE || 'cloudshop']);

    if (columns.length > 0) {
      console.log('✅ Cột cancel_reason đã tồn tại trong bảng orders');
    } else {
      // Thêm cột mới vào bảng
      await connection.query(`
        ALTER TABLE orders
        ADD COLUMN cancel_reason TEXT
      `);
      console.log('✅ Đã thêm cột cancel_reason vào bảng orders');
    }

    await connection.end();
    return { success: true };
  } catch (error) {
    console.error('❌ Lỗi khi thêm cột cancel_reason:', error);
    return { success: false, error };
  }
}

addCancelReasonColumn().then(result => {
  if (result.success) {
    console.log('🎉 Hoàn thành!');
    process.exit(0);
  } else {
    console.error('❌ Thất bại!');
    process.exit(1);
  }
}); 