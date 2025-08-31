const mysql = require('mysql2/promise');
require('dotenv').config();

async function createPushSubscriptionTable() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'cloudshop'
    });

    console.log('Creating push_subscriptions table...');

    // Create push_subscriptions table
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NULL,
        endpoint TEXT NOT NULL,
        p256dh_key VARCHAR(255) NOT NULL,
        auth_key VARCHAR(255) NOT NULL,
        user_agent TEXT NULL,
        browser_info JSON NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        last_used TIMESTAMP NULL,
        
        -- Add indexes for performance
        INDEX idx_user_id (user_id),
        INDEX idx_is_active (is_active),
        INDEX idx_created_at (created_at),
        
        -- Unique constraint on endpoint to prevent duplicates
        UNIQUE KEY unique_endpoint (endpoint(500))
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.execute(createTableQuery);
    console.log('✅ push_subscriptions table created successfully!');

    // Create push_notifications table for tracking sent notifications
    const createNotificationTrackingTable = `
      CREATE TABLE IF NOT EXISTS push_notification_logs (
        id VARCHAR(36) PRIMARY KEY,
        subscription_id VARCHAR(36) NOT NULL,
        title VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        data_payload JSON NULL,
        status ENUM('sent', 'failed', 'delivered', 'clicked') DEFAULT 'sent',
        error_message TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        INDEX idx_subscription_id (subscription_id),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at),
        
        FOREIGN KEY (subscription_id) REFERENCES push_subscriptions(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.execute(createNotificationTrackingTable);
    console.log('✅ push_notification_logs table created successfully!');

    // Add push notification settings to existing shop settings
    const addPushSettings = `
      CREATE TABLE IF NOT EXISTS push_notification_settings (
        id VARCHAR(36) PRIMARY KEY,
        shop_status_notifications BOOLEAN DEFAULT true,
        order_status_notifications BOOLEAN DEFAULT true,
        special_announcements BOOLEAN DEFAULT true,
        marketing_notifications BOOLEAN DEFAULT false,
        auto_resubscribe BOOLEAN DEFAULT true,
        max_daily_notifications INT DEFAULT 10,
        quiet_hours_start TIME DEFAULT '22:00:00',
        quiet_hours_end TIME DEFAULT '08:00:00',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.execute(addPushSettings);
    console.log('✅ push_notification_settings table created successfully!');

    // Insert default settings
    const insertDefaultSettings = `
      INSERT IGNORE INTO push_notification_settings 
      (id, shop_status_notifications, order_status_notifications, special_announcements, marketing_notifications)
      VALUES 
      ('default-push-settings', true, true, true, false);
    `;

    await connection.execute(insertDefaultSettings);
    console.log('✅ Default push notification settings inserted!');

    console.log('\n🎉 Push notification database setup completed successfully!');
    console.log('\n📋 Tables created:');
    console.log('  - push_subscriptions: Store user push subscriptions');
    console.log('  - push_notification_logs: Track notification delivery');
    console.log('  - push_notification_settings: Global push settings');

  } catch (error) {
    console.error('❌ Error creating push notification tables:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the migration
createPushSubscriptionTable()
  .then(() => {
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  });
