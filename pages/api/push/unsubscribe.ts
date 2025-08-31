import { NextApiRequest, NextApiResponse } from 'next';
import PushNotificationService, { PushSubscription } from '../../../lib/push-notification-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    const { subscription } = req.body;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription data'
      });
    }

    const pushSubscription: PushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys?.p256dh || '',
        auth: subscription.keys?.auth || ''
      }
    };

    // Remove subscription from database
    await PushNotificationService.removeSubscription(pushSubscription);

    res.status(200).json({
      success: true,
      message: 'Push subscription removed successfully'
    });

  } catch (error: any) {
    console.error('Error unsubscribing from push notifications:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to remove push subscription'
    });
  }
}
