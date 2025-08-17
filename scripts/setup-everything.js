const { setupCompleteDatabase } = require('./setup-complete-database');
const { createDefaultAdmin } = require('./create-default-admin');
const { seedDemoData } = require('./seed-demo-data');

async function setupEverything() {
  try {
    console.log('🚀 CLOUD SHOP - COMPLETE SETUP');
    console.log('===============================\n');

    // Step 1: Setup database
    console.log('STEP 1: Database Setup');
    console.log('----------------------');
    await setupCompleteDatabase();

    // Step 2: Create admin
    console.log('\nSTEP 2: Admin User Creation');
    console.log('----------------------------');
    await createDefaultAdmin();

    // Step 3: Seed demo data
    console.log('\nSTEP 3: Demo Data Seeding');
    console.log('-------------------------');
    await seedDemoData();

    console.log('\n🎉 COMPLETE SETUP FINISHED!');
    console.log('============================');
    console.log('\n📋 What\'s been set up:');
    console.log('   ✅ Complete database schema (17 tables)');
    console.log('   ✅ Shop status system with operating hours');
    console.log('   ✅ Email notification system');
    console.log('   ✅ Product variants and attributes');
    console.log('   ✅ Admin user (admin@cloudshop.com / admin123)');
    console.log('   ✅ Demo products and categories');
    console.log('   ✅ Demo discount codes');
    
    console.log('\n🚀 Next steps:');
    console.log('   1. npm run build');
    console.log('   2. npm start');
    console.log('   3. Visit: http://localhost:3000');
    console.log('   4. Admin panel: http://localhost:3000/admin');
    
    console.log('\n💡 Demo discount codes:');
    console.log('   • WELCOME10 - 10% off orders over 50,000đ');
    console.log('   • FREESHIP - Free shipping (15,000đ off) orders over 100,000đ');

  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    throw error;
  }
}

if (require.main === module) {
  setupEverything()
    .then(() => {
      console.log('\n✅ All setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupEverything };
