import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../../../lib/auth';
import { getTokenFromRequest } from '../../../../lib/auth-utils';
import { executeQuery } from '../../../../lib/db';
import PushNotificationService from '../../../../lib/push-notification-service';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Verify admin access
    const token = getTokenFromRequest(req);
    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const decodedToken = verifyToken(token);
    if (!decodedToken || !decodedToken.id) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    // Check if user is admin
    const userResult = await executeQuery({
      query: 'SELECT role FROM users WHERE id = ?',
      values: [decodedToken.id]
    });

    if ((userResult as any[]).length === 0 || (userResult as any[])[0].role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    if (req.method === 'GET') {
      // Get push notification statistics and subscribers
      try {
        const [subscriptions, stats, settings] = await Promise.all([
          executeQuery({
            query: `
              SELECT 
                ps.*,
                u.email as user_email,
                u.name as user_name
              FROM push_subscriptions ps
              LEFT JOIN users u ON ps.user_id = u.id
              ORDER BY ps.created_at DESC
            `,
            values: []
          }),
          PushNotificationService.getNotificationStats(7),
          executeQuery({
            query: 'SELECT * FROM push_notification_settings WHERE id = "default-push-settings"',
            values: []
          })
        ]);

        return res.status(200).json({
          success: true,
          subscriptions,
          stats,
          settings: (settings as any[])[0] || {}
        });
      } catch (error) {
        console.error('Error fetching push notification data:', error);
        return res.status(500).json({
          success: false,
          message: 'Không thể tải dữ liệu push notifications'
        });
      }

    } else if (req.method === 'POST') {
      // Send push notification to all subscribers
      try {
        const { title, message, type, url } = req.body;

        if (!title || !message) {
          return res.status(400).json({
            success: false,
            message: 'Title và message là bắt buộc'
          });
        }

        let result;
        switch (type) {
          case 'shop_status':
            result = await PushNotificationService.sendShopStatusNotification(
              true, // Assuming shop is open for test
              message,
              title
            );
            break;
          case 'special_announcement':
            result = await PushNotificationService.sendSpecialAnnouncement(
              title,
              message,
              url
            );
            break;
          default:
            // Generic notification
            result = await PushNotificationService.sendNotificationToAll({
              title,
              body: message,
              icon: '/images/logo-192.png',
              badge: '/images/badge-72.png',
              tag: 'admin-notification',
              type: 'special_announcement',
              url: url || '/',
              data: {
                type: 'admin_notification',
                title,
                message,
                url
              }
            });
        }

        return res.status(200).json({
          success: true,
          message: `Đã gửi push notification thành công`,
          sent: result.sent,
          failed: result.failed
        });

      } catch (error) {
        console.error('Error sending push notification:', error);
        return res.status(500).json({
          success: false,
          message: 'Không thể gửi push notification'
        });
      }

    } else if (req.method === 'PUT') {
      // Update push notification settings
      try {
        const { 
          shop_status_notifications,
          order_status_notifications,
          special_announcements,
          marketing_notifications,
          max_daily_notifications,
          quiet_hours_start,
          quiet_hours_end
        } = req.body;

        await executeQuery({
          query: `
            UPDATE push_notification_settings 
            SET 
              shop_status_notifications = ?,
              order_status_notifications = ?,
              special_announcements = ?,
              marketing_notifications = ?,
              max_daily_notifications = ?,
              quiet_hours_start = ?,
              quiet_hours_end = ?,
              updated_at = NOW()
            WHERE id = 'default-push-settings'
          `,
          values: [
            shop_status_notifications,
            order_status_notifications,
            special_announcements,
            marketing_notifications,
            max_daily_notifications,
            quiet_hours_start,
            quiet_hours_end
          ]
        });

        return res.status(200).json({
          success: true,
          message: 'Cập nhật cài đặt push notifications thành công'
        });

      } catch (error) {
        console.error('Error updating push notification settings:', error);
        return res.status(500).json({
          success: false,
          message: 'Không thể cập nhật cài đặt push notifications'
        });
      }

    } else if (req.method === 'DELETE') {
      // Delete specific push subscription
      try {
        const { id } = req.query;

        if (!id) {
          return res.status(400).json({
            success: false,
            message: 'Subscription ID là bắt buộc'
          });
        }

        await executeQuery({
          query: 'DELETE FROM push_subscriptions WHERE id = ?',
          values: [id]
        });

        return res.status(200).json({
          success: true,
          message: 'Xóa push subscription thành công'
        });

      } catch (error) {
        console.error('Error deleting push subscription:', error);
        return res.status(500).json({
          success: false,
          message: 'Không thể xóa push subscription'
        });
      }
    }

    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });

  } catch (error) {
    console.error('Push notification admin API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}
