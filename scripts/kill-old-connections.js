const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function killOldConnections() {
  let connection;
  
  try {
    console.log('🔧 Attempting to kill old connections...');
    
    // Kết nối với quyền admin
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      port: process.env.MYSQL_PORT || 3306,
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || ''
      // Không specify database để có thể kill connections
    });

    // Lấy danh sách processes
    const [processes] = await connection.execute('SHOW PROCESSLIST');
    console.log(`📊 Found ${processes.length} active processes`);

    // Kill các connections cũ (trừ connection hiện tại)
    let killedCount = 0;
    for (const process of processes) {
      if (process.Command === 'Sleep' && process.Time > 30) {
        try {
          await connection.execute(`KILL ${process.Id}`);
          killedCount++;
          console.log(`❌ Killed process ${process.Id} (sleeping for ${process.Time}s)`);
        } catch (error) {
          console.log(`⚠️  Could not kill process ${process.Id}:`, error.message);
        }
      }
    }

    console.log(`✅ Killed ${killedCount} old connections`);
    
    // Kiểm tra lại
    const [newProcesses] = await connection.execute('SHOW PROCESSLIST');
    console.log(`📊 Remaining processes: ${newProcesses.length}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes('Too many connections')) {
      console.log('\n💡 Thử các giải pháp sau:');
      console.log('1. Restart MySQL service:');
      console.log('   sudo systemctl restart mysql');
      console.log('   # hoặc trên Windows: restart MySQL service');
      console.log('\n2. Tăng max_connections trong MySQL config:');
      console.log('   [mysqld]');
      console.log('   max_connections = 200');
      console.log('\n3. Kiểm tra connection pool settings trong code');
    }
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }
}

if (require.main === module) {
  killOldConnections()
    .then(() => {
      console.log('\n✅ Connection cleanup completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Cleanup failed:', error);
      process.exit(1);
    });
}

module.exports = { killOldConnections };
