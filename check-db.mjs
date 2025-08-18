import { executeQuery } from './lib/db.js';

async function checkDatabase() {
  try {
    console.log('Checking current database...');
    const tables = await executeQuery({
      query: 'SHOW TABLES FROM cloudshop'
    });
    console.log('Tables in cloudshop database:', tables);
    
    // Check if our shop status tables exist
    const tableNames = tables.map(t => Object.values(t)[0]);
    console.log('Table names:', tableNames);
    
    const missingTables = [];
    const requiredTables = [
      'shop_operating_hours',
      'shop_notifications', 
      'shop_email_notifications',
      'shop_status_settings'
    ];
    
    requiredTables.forEach(table => {
      if (!tableNames.includes(table)) {
        missingTables.push(table);
      }
    });
    
    if (missingTables.length > 0) {
      console.log('Missing tables:', missingTables);
      console.log('Need to create these tables in the cloudshop database');
    } else {
      console.log('All required tables exist!');
    }
    
  } catch (error) {
    console.error('Database check error:', error);
  }
}

checkDatabase();
