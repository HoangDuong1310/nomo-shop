import { NextApiRequest, NextApiResponse } from 'next';
import PushNotificationService, { PushSubscription } from '../../../lib/push-notification-service';
import { verifyToken } from '../../../lib/auth';
import { getTokenFromRequest } from '../../../lib/auth-utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    const { subscription, userAgent, browserInfo } = req.body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription data'
      });
    }

    // Get user ID from token if available (optional for push notifications)
    let userId = null;
    const token = getTokenFromRequest(req);
    if (token) {
      try {
        const decodedToken = verifyToken(token);
        if (decodedToken && decodedToken.id) {
          userId = decodedToken.id;
        }
      } catch (error) {
        // Token invalid but that's ok, we can still accept push subscriptions from anonymous users
        console.log('Invalid token, proceeding with anonymous subscription');
      }
    }

    // Validate subscription format
    const pushSubscription: PushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
      }
    };

    // Save subscription to database
    const subscriptionId = await PushNotificationService.saveSubscription(
      pushSubscription,
      userId,
      userAgent,
      browserInfo
    );

    res.status(200).json({
      success: true,
      message: 'Push subscription saved successfully',
      subscriptionId
    });

  } catch (error: any) {
    console.error('Error subscribing to push notifications:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to save push subscription'
    });
  }
}
