const webpush = require('web-push');

console.log('Generating VAPID keys for Web Push Notifications...\n');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('Public Key:', vapidKeys.publicKey);
console.log('Private Key:', vapidKeys.privateKey);

console.log('\n📝 Add these to your environment variables:');
console.log('VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey);
console.log('VAPID_SUBJECT=mailto:your-email@example.com  # Replace with your email');

console.log('\n✅ VAPID keys generated successfully!');
console.log('\n🔐 Keep the private key secure and never expose it publicly.');
console.log('📧 The subject should be a mailto: link or your website URL.');
