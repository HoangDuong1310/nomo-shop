const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function checkDatabaseConnections() {
  let connection;
  
  try {
    console.log('🔍 Kiểm tra database connections...');
    
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      port: process.env.MYSQL_PORT || 3306,
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'cloudshop'
    });

    // Kiểm tra số lượng connections hiện tại
    const [connections] = await connection.execute('SHOW STATUS LIKE "Threads_connected"');
    console.log('📊 Current connections:', connections);

    // Kiểm tra max connections
    const [maxConnections] = await connection.execute('SHOW VARIABLES LIKE "max_connections"');
    console.log('📈 Max connections:', maxConnections);

    // Hiển thị danh sách processes
    const [processes] = await connection.execute('SHOW PROCESSLIST');
    console.log('🔍 Current processes:');
    console.table(processes);

    // Đề xuất settings
    console.log('\n💡 Đề xuất:');
    console.log('- Giảm connectionLimit trong pool xuống 2-3');
    console.log('- Sử dụng connection timeout');
    console.log('- Implement connection pooling đúng cách');
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

if (require.main === module) {
  checkDatabaseConnections()
    .then(() => {
      console.log('\n✅ Database check completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Check failed:', error);
      process.exit(1);
    });
}

module.exports = { checkDatabaseConnections };
