const { executeQuery } = require('../lib/db');

async function setupStoreInfo() {
  console.log('🏪 Setting up store information...');
  
  try {
    // Kiểm tra xem đã có data chưa
    const existingSettings = await executeQuery({
      query: 'SELECT COUNT(*) as count FROM settings WHERE setting_key LIKE "store.%"',
      values: []
    });
    
    const count = existingSettings[0].count;
    console.log(`📊 Found ${count} store settings in database`);
    
    if (count === 0) {
      console.log('📝 Inserting default store settings...');
      
      // Default store settings
      const storeSettings = [
        { key: 'store.store_name', value: 'Cloud Shop - Ăn Uống Tại Nhà' },
        { key: 'store.store_description', value: 'Ứng dụng đặt món trực tuyến qua mã QR, giao hàng nhanh chóng trong bán kính 3km. Thưởng thức món ngon từ nhà hàng yêu thích ngay tại nhà!' },
        { key: 'store.store_address', value: '123 Nguyễn Văn Cừ, Quận 1, TP. Hồ Chí Minh' },
        { key: 'store.store_phone', value: '0901 234 567' },
        { key: 'store.store_email', value: 'contact@cloudshop.vn' },
        { key: 'store.store_hours', value: 'Thứ 2 - Thứ 6: 7:00 - 22:00, Thứ 7 - Chủ nhật: 7:00 - 23:00' },
        { key: 'store.store_website', value: 'www.cloudshop.vn' }
      ];
      
      for (const setting of storeSettings) {
        await executeQuery({
          query: 'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)',
          values: [setting.key, setting.value]
        });
        console.log(`✅ Added: ${setting.key} = ${setting.value}`);
      }
      
      console.log('🎉 Store settings inserted successfully!');
    } else {
      console.log('ℹ️  Store settings already exist. Updating...');
      
      // Update existing settings
      const updates = [
        { key: 'store.store_name', value: 'Cloud Shop - Ăn Uống Tại Nhà' },
        { key: 'store.store_description', value: 'Ứng dụng đặt món trực tuyến qua mã QR, giao hàng nhanh chóng trong bán kính 3km. Thưởng thức món ngon từ nhà hàng yêu thích ngay tại nhà!' },
        { key: 'store.store_address', value: '123 Nguyễn Văn Cừ, Quận 1, TP. Hồ Chí Minh' },
        { key: 'store.store_phone', value: '0901 234 567' },
        { key: 'store.store_email', value: 'contact@cloudshop.vn' },
        { key: 'store.store_hours', value: 'Thứ 2 - Thứ 6: 7:00 - 22:00, Thứ 7 - Chủ nhật: 7:00 - 23:00' },
        { key: 'store.store_website', value: 'www.cloudshop.vn' }
      ];
      
      for (const setting of updates) {
        await executeQuery({
          query: 'UPDATE settings SET setting_value = ? WHERE setting_key = ?',
          values: [setting.value, setting.key]
        });
        console.log(`🔄 Updated: ${setting.key} = ${setting.value}`);
      }
      
      console.log('🎉 Store settings updated successfully!');
    }
    
    // Test API endpoint
    console.log('\n🧪 Testing store info API...');
    
    const response = await fetch('http://localhost:3001/api/public/store-info');
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Response:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ API test failed:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Error setting up store info:', error);
    process.exit(1);
  }
}

// Chạy script
if (require.main === module) {
  setupStoreInfo()
    .then(() => {
      console.log('\n🎯 Store info setup completed!');
      console.log('📋 Next steps:');
      console.log('   1. Check footer on website to see dynamic data');
      console.log('   2. Go to Admin Settings to customize store info');
      console.log('   3. Footer will automatically update with new data');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupStoreInfo };
