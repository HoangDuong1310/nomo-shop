const mysql = require('mysql2/promise');

async function setupEmailTables() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'cloudshop'
  });

  try {
    console.log('🔧 Setting up email tables...');

    // 1. Tạo bảng email_logs
    console.log('Creating email_logs table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS email_logs (
        id VARCHAR(36) PRIMARY KEY,
        recipient_email VARCHAR(255) NOT NULL,
        template_type VARCHAR(50) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        status ENUM('pending', 'sent', 'failed', 'bounced') DEFAULT 'pending',
        sent_at DATETIME NULL,
        opened_at DATETIME NULL,
        clicked_at DATETIME NULL,
        error_message TEXT NULL,
        order_id VARCHAR(36) NULL,
        user_id VARCHAR(36) NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        
        INDEX idx_recipient (recipient_email),
        INDEX idx_status (status),
        INDEX idx_template (template_type),
        INDEX idx_order (order_id),
        INDEX idx_created (created_at)
      )
    `);

    // 2. Tạo bảng user_email_preferences
    console.log('Creating user_email_preferences table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS user_email_preferences (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        order_updates BOOLEAN DEFAULT true,
        payment_notifications BOOLEAN DEFAULT true,
        shipping_updates BOOLEAN DEFAULT true,
        marketing_emails BOOLEAN DEFAULT false,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        UNIQUE KEY unique_user (user_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 3. Thêm email preferences mặc định cho users hiện có
    console.log('Adding default email preferences for existing users...');
    await connection.execute(`
      INSERT INTO user_email_preferences (id, user_id, order_updates, payment_notifications, shipping_updates, marketing_emails)
      SELECT UUID(), id, true, true, true, false 
      FROM users 
      WHERE NOT EXISTS (
          SELECT 1 FROM user_email_preferences WHERE user_id = users.id
      )
    `);

    // 4. Kiểm tra kết quả
    const [emailLogsCount] = await connection.execute('SELECT COUNT(*) as count FROM email_logs');
    const [preferencesCount] = await connection.execute('SELECT COUNT(*) as count FROM user_email_preferences');

    console.log('✅ Email tables setup completed successfully!');
    console.log(`📊 Email logs: ${emailLogsCount[0].count} records`);
    console.log(`📊 Email preferences: ${preferencesCount[0].count} records`);

    await connection.end();

  } catch (error) {
    console.error('❌ Email tables setup failed:', error);
    await connection.end();
    process.exit(1);
  }
}

setupEmailTables();
