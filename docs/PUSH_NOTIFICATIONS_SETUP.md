# Web Push Notifications - Environment Configuration Guide

## Required Environment Variables

Add these variables to your `.env` file:

```env
# Web Push Notifications - VAPID Keys
VAPID_PUBLIC_KEY=BJtcq-MWfq6uNOnOlvLt6I9_32ap2hY0p4bE4JV_LPgwDTD8oOXTn1ObCKMdjCENjaNdHXQ0Jw5ip-rfuioZ8XU
VAPID_PRIVATE_KEY=dJLHomUw8D-QlUGLZyVs1dr_m_gMe5W32gFxA7yLXcI
VAPID_SUBJECT=mailto:admin@cloudshop.com

# Replace with your actual email or website URL
# VAPID_SUBJECT can be:
# - mailto:your-email@domain.com
# - https://your-website.com
```

## Security Notes

1. **NEVER commit VAPID private keys to version control**
2. **Generate new keys for each environment (dev, staging, production)**
3. **Keep private keys secure and rotate them periodically**

## Generating New VAPID Keys

Run the script to generate new keys:

```bash
node scripts/generate-vapid-keys.js
```

## Database Setup

The push notification tables are automatically created when you run:

```bash
node scripts/setup-push-notifications.js
```

This creates:
- `push_subscriptions` - Stores user push subscriptions
- `push_notification_logs` - Tracks notification delivery
- `push_notification_settings` - Global push settings

## HTTPS Requirement

Push notifications **require HTTPS** in production. Make sure your website is served over HTTPS.

## Browser Support

Supported browsers:
- Chrome (desktop & mobile)
- Firefox (desktop & mobile) 
- Safari (desktop & mobile, iOS 16.4+)
- Edge (desktop & mobile)

## Testing Push Notifications

1. **Local Development**: Works with `localhost` over HTTP
2. **Production**: Requires HTTPS
3. **Test Functionality**: Use the admin panel to send test notifications

## Deployment Checklist

- [ ] VAPID keys added to production environment
- [ ] Database migration completed
- [ ] HTTPS enabled
- [ ] Service worker accessible at `/sw.js`
- [ ] Push notification permissions working
- [ ] Admin panel notifications working
- [ ] Shop status notifications working
- [ ] Order status notifications working

## Monitoring & Analytics

Check push notification delivery in:
- Admin panel → Push Notifications tab
- Database `push_notification_logs` table
- Server logs for push notification errors

## Troubleshooting

### Common Issues:

1. **Service worker not registering**
   - Check console for errors
   - Ensure `/sw.js` is accessible
   - Verify HTTPS in production

2. **Push notifications not received**
   - Check browser notifications are enabled
   - Verify VAPID keys are correct
   - Check network connectivity
   - Look for errors in server logs

3. **Subscription fails**
   - Verify VAPID public key is accessible
   - Check browser support
   - Ensure user granted permission

## Performance Considerations

- Service worker is cached for 24 hours
- Push notifications are sent in batches of 100
- Failed subscriptions are automatically cleaned up
- Notification logs are cleaned up after 30 days
