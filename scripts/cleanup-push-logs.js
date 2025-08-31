const PushNotificationService = require('../lib/push-notification-service');

async function cleanupNotificationLogs() {
  console.log('🧹 Cleaning up old push notification logs...');
  
  try {
    const deleted = await PushNotificationService.default.cleanupOldLogs(30); // Keep 30 days
    console.log(`✅ Cleaned up ${deleted} old notification logs`);
    
    // Get statistics
    const stats = await PushNotificationService.default.getNotificationStats(7);
    console.log('\n📊 Push notification statistics (last 7 days):');
    
    const summary = stats.reduce((acc, stat) => {
      acc[stat.status] = (acc[stat.status] || 0) + stat.count;
      return acc;
    }, {});
    
    console.log('Sent:', summary.sent || 0);
    console.log('Failed:', summary.failed || 0);
    console.log('Clicked:', summary.clicked || 0);
    console.log('Delivered:', summary.delivered || 0);
    
  } catch (error) {
    console.error('❌ Error cleaning up notification logs:', error);
    process.exit(1);
  }
}

cleanupNotificationLogs()
  .then(() => {
    console.log('\n✅ Cleanup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Cleanup failed:', error);
    process.exit(1);
  });
