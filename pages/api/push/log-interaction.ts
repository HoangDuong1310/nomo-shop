import { NextApiRequest, NextApiResponse } from 'next';
import { executeQuery } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    const { action, notificationId, timestamp } = req.body;

    if (!action || !timestamp) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Log the interaction if notificationId is provided
    if (notificationId) {
      await executeQuery({
        query: `
          UPDATE push_notification_logs 
          SET status = ?, updated_at = FROM_UNIXTIME(?)
          WHERE JSON_EXTRACT(data_payload, '$.id') = ?
        `,
        values: [action === 'click' ? 'clicked' : 'delivered', timestamp / 1000, notificationId]
      });
    }

    // You can also log to analytics service here
    console.log(`Push notification ${action}:`, { notificationId, timestamp });

    res.status(200).json({
      success: true,
      message: 'Interaction logged successfully'
    });

  } catch (error: any) {
    console.error('Error logging push notification interaction:', error);
    res.status(200).json({
      success: true,
      message: 'Logged client-side only'
    });
  }
}
