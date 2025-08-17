const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function setupShopStatusDatabase() {
  let connection;
  
  try {
    console.log('🔧 Setting up Shop Status Database...\n');

    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'cloudshop'  // Use existing database
    });

    console.log('✅ Connected to database');

    // Read and execute SQL schema
    const fs = require('fs');
    const path = require('path');
    const sqlPath = path.join(__dirname, '..', 'lib', 'db-shop-status.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Split SQL commands by semicolon and execute each one
    const commands = sqlContent.split(';').filter(cmd => cmd.trim().length > 0);

    for (const command of commands) {
      if (command.trim()) {
        try {
          await connection.execute(command);
          console.log('✅ Executed SQL command successfully');
        } catch (error) {
          console.error('❌ Error executing SQL command:', error.message);
          console.log('Command:', command.substring(0, 100) + '...');
        }
      }
    }

    // Verify tables were created
    console.log('\n📊 Verifying tables...');
    
    const tables = [
      'shop_operating_hours',
      'shop_notifications', 
      'shop_email_notifications',
      'shop_status_settings'
    ];

    for (const table of tables) {
      try {
        const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`✅ ${table}: ${rows[0].count} records`);
      } catch (error) {
        console.log(`❌ ${table}: Error - ${error.message}`);
      }
    }

    // Test shop status API
    console.log('\n🧪 Testing Shop Status API...');
    
    const [operatingHours] = await connection.execute(
      'SELECT * FROM shop_operating_hours ORDER BY day_of_week'
    );

    if (operatingHours.length === 7) {
      console.log('✅ Operating hours configured for all days');
      console.log('📅 Current operating hours:');
      
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      operatingHours.forEach(hour => {
        const status = hour.is_open ? `${hour.open_time} - ${hour.close_time}` : 'Closed';
        console.log(`   ${dayNames[hour.day_of_week]}: ${status}`);
      });
    } else {
      console.log('❌ Operating hours not fully configured');
    }

    // Check settings
    const [settings] = await connection.execute('SELECT * FROM shop_status_settings');
    console.log(`✅ Shop status settings: ${settings.length} configured`);
    
    settings.forEach(setting => {
      console.log(`   ${setting.setting_key}: ${setting.setting_value}`);
    });

    console.log('\n🎉 Shop Status Database setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Access admin panel: /admin/shop-status');
    console.log('   2. Configure operating hours as needed');
    console.log('   3. Test the shop status overlay on frontend');
    console.log('   4. Verify email notifications work');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('✅ Database connection closed');
    }
  }
}

// Run the setup
setupShopStatusDatabase();
