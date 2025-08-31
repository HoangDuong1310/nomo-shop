import webpush from 'web-push';
import { executeQuery } from './db';

// Configure web-push with VAPID keys
const vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY!,
  privateKey: process.env.VAPID_PRIVATE_KEY!,
  subject: process.env.VAPID_SUBJECT || 'mailto:admin@cloudshop.com'
};

if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
  console.warn('VAPID keys not configured. Push notifications will not work.');
} else {
  webpush.setVapidDetails(
    vapidKeys.subject,
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  type?: 'shop_status' | 'order_update' | 'special_announcement' | 'marketing';
  url?: string;
}

export class PushNotificationService {
  /**
   * Get all active push subscriptions from database
   */
  static async getActiveSubscriptions(userId?: string): Promise<any[]> {
    let query = 'SELECT * FROM push_subscriptions WHERE is_active = true';
    let values: any[] = [];

    if (userId) {
      query += ' AND user_id = ?';
      values.push(userId);
    }

    try {
      const subscriptions = await executeQuery({
        query,
        values
      }) as any[];

      return subscriptions;
    } catch (error) {
      console.error('Error getting active subscriptions:', error);
      return [];
    }
  }

  /**
   * Save push subscription to database
   */
  static async saveSubscription(
    subscription: PushSubscription, 
    userId?: string, 
    userAgent?: string,
    browserInfo?: any
  ): Promise<string> {
    const { v4: uuidv4 } = require('uuid');
    const subscriptionId = uuidv4();

    try {
      // Check if subscription already exists
      const existing = await executeQuery({
        query: 'SELECT id FROM push_subscriptions WHERE endpoint = ?',
        values: [subscription.endpoint]
      }) as any[];

      if (existing.length > 0) {
        // Update existing subscription
        await executeQuery({
          query: `
            UPDATE push_subscriptions 
            SET p256dh_key = ?, auth_key = ?, user_id = ?, user_agent = ?, 
                browser_info = ?, is_active = true, updated_at = NOW()
            WHERE endpoint = ?
          `,
          values: [
            subscription.keys.p256dh,
            subscription.keys.auth,
            userId || null,
            userAgent || null,
            JSON.stringify(browserInfo || {}),
            subscription.endpoint
          ]
        });

        return existing[0].id;
      } else {
        // Create new subscription
        await executeQuery({
          query: `
            INSERT INTO push_subscriptions 
            (id, user_id, endpoint, p256dh_key, auth_key, user_agent, browser_info, is_active) 
            VALUES (?, ?, ?, ?, ?, ?, ?, true)
          `,
          values: [
            subscriptionId,
            userId || null,
            subscription.endpoint,
            subscription.keys.p256dh,
            subscription.keys.auth,
            userAgent || null,
            JSON.stringify(browserInfo || {})
          ]
        });

        return subscriptionId;
      }
    } catch (error) {
      console.error('Error saving subscription:', error);
      throw error;
    }
  }

  /**
   * Remove push subscription from database
   */
  static async removeSubscription(subscription: PushSubscription): Promise<void> {
    try {
      await executeQuery({
        query: 'DELETE FROM push_subscriptions WHERE endpoint = ?',
        values: [subscription.endpoint]
      });
    } catch (error) {
      console.error('Error removing subscription:', error);
      throw error;
    }
  }

  /**
   * Verify if subscription exists and is active
   */
  static async verifySubscription(subscription: PushSubscription): Promise<boolean> {
    try {
      const result = await executeQuery({
        query: 'SELECT id FROM push_subscriptions WHERE endpoint = ? AND is_active = true',
        values: [subscription.endpoint]
      }) as any[];

      return result.length > 0;
    } catch (error) {
      console.error('Error verifying subscription:', error);
      return false;
    }
  }

  /**
   * Send push notification to a specific subscription
   */
  static async sendNotification(
    subscription: PushSubscription, 
    payload: NotificationPayload
  ): Promise<boolean> {
    try {
      const pushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth
        }
      };

      // Add unique ID to payload for tracking
      const { v4: uuidv4 } = require('uuid');
      const notificationId = uuidv4();
      
      const fullPayload = {
        ...payload,
        data: {
          ...payload.data,
          id: notificationId,
          timestamp: Date.now()
        }
      };

      await webpush.sendNotification(
        pushSubscription,
        JSON.stringify(fullPayload)
      );

      // Log successful notification
      await this.logNotification(subscription.endpoint, fullPayload, 'sent');
      
      return true;
    } catch (error: any) {
      console.error('Error sending push notification:', error);
      
      // Log failed notification
      await this.logNotification(subscription.endpoint, payload, 'failed', error.message);
      
      // Handle expired subscriptions
      if (error.statusCode === 410 || error.statusCode === 404) {
        console.log('Subscription expired, removing from database');
        await this.removeSubscription(subscription);
      }
      
      return false;
    }
  }

  /**
   * Send push notification to all active subscriptions
   */
  static async sendNotificationToAll(
    payload: NotificationPayload,
    userId?: string
  ): Promise<{ sent: number; failed: number }> {
    const subscriptions = await this.getActiveSubscriptions(userId);
    let sent = 0;
    let failed = 0;

    // Send notifications in batches to avoid overwhelming the service
    const batchSize = 100;
    for (let i = 0; i < subscriptions.length; i += batchSize) {
      const batch = subscriptions.slice(i, i + batchSize);
      
      const promises = batch.map(async (sub) => {
        const pushSubscription: PushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh_key,
            auth: sub.auth_key
          }
        };

        const success = await this.sendNotification(pushSubscription, payload);
        return success ? 'sent' : 'failed';
      });

      const results = await Promise.all(promises);
      sent += results.filter(r => r === 'sent').length;
      failed += results.filter(r => r === 'failed').length;

      // Add small delay between batches
      if (i + batchSize < subscriptions.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return { sent, failed };
  }

  /**
   * Send shop status notification
   */
  static async sendShopStatusNotification(
    isOpen: boolean, 
    message: string,
    title?: string
  ): Promise<{ sent: number; failed: number }> {
    const payload: NotificationPayload = {
      title: title || (isOpen ? '🎉 Cửa hàng đã mở!' : '🔒 Cửa hàng đã đóng'),
      body: message,
      icon: '/images/logo-192.png',
      badge: '/images/badge-72.png',
      tag: 'shop-status',
      type: 'shop_status',
      url: isOpen ? '/menu' : '/',
      data: {
        type: 'shop_status',
        isOpen,
        message
      }
    };

    return await this.sendNotificationToAll(payload);
  }

  /**
   * Send order status notification
   */
  static async sendOrderStatusNotification(
    userId: string,
    orderId: string,
    status: string,
    message: string
  ): Promise<{ sent: number; failed: number }> {
    const statusTitles: { [key: string]: string } = {
      confirmed: '✅ Đơn hàng đã được xác nhận',
      preparing: '👨‍🍳 Đang chuẩn bị đơn hàng',
      ready: '🎉 Đơn hàng đã sẵn sàng',
      delivered: '🚚 Đơn hàng đã được giao',
      cancelled: '❌ Đơn hàng đã bị hủy'
    };

    const payload: NotificationPayload = {
      title: statusTitles[status] || '📋 Cập nhật đơn hàng',
      body: message,
      icon: '/images/logo-192.png',
      badge: '/images/badge-72.png',
      tag: `order-${orderId}`,
      type: 'order_update',
      url: `/account/orders/${orderId}`,
      data: {
        type: 'order_update',
        orderId,
        status,
        message
      }
    };

    return await this.sendNotificationToAll(payload, userId);
  }

  /**
   * Send special announcement notification
   */
  static async sendSpecialAnnouncement(
    title: string,
    message: string,
    url?: string
  ): Promise<{ sent: number; failed: number }> {
    const payload: NotificationPayload = {
      title,
      body: message,
      icon: '/images/logo-192.png',
      badge: '/images/badge-72.png',
      tag: 'special-announcement',
      type: 'special_announcement',
      url: url || '/',
      requireInteraction: true,
      data: {
        type: 'special_announcement',
        title,
        message,
        url
      }
    };

    return await this.sendNotificationToAll(payload);
  }

  /**
   * Log notification for tracking
   */
  private static async logNotification(
    endpoint: string,
    payload: NotificationPayload,
    status: 'sent' | 'failed' | 'delivered' | 'clicked',
    errorMessage?: string
  ): Promise<void> {
    try {
      // Get subscription ID from endpoint
      const subscriptionResult = await executeQuery({
        query: 'SELECT id FROM push_subscriptions WHERE endpoint = ?',
        values: [endpoint]
      }) as any[];

      if (subscriptionResult.length === 0) return;

      const { v4: uuidv4 } = require('uuid');
      const logId = uuidv4();

      await executeQuery({
        query: `
          INSERT INTO push_notification_logs 
          (id, subscription_id, title, body, data_payload, status, error_message) 
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        values: [
          logId,
          subscriptionResult[0].id,
          payload.title,
          payload.body,
          JSON.stringify(payload.data || {}),
          status,
          errorMessage || null
        ]
      });
    } catch (error) {
      console.error('Error logging notification:', error);
    }
  }

  /**
   * Get push notification statistics
   */
  static async getNotificationStats(days: number = 7): Promise<any> {
    try {
      const stats = await executeQuery({
        query: `
          SELECT 
            status,
            COUNT(*) as count,
            DATE(created_at) as date
          FROM push_notification_logs 
          WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
          GROUP BY status, DATE(created_at)
          ORDER BY date DESC, status
        `,
        values: [days]
      }) as any[];

      return stats;
    } catch (error) {
      console.error('Error getting notification stats:', error);
      return [];
    }
  }

  /**
   * Clean up old notification logs
   */
  static async cleanupOldLogs(days: number = 30): Promise<number> {
    try {
      const result = await executeQuery({
        query: 'DELETE FROM push_notification_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
        values: [days]
      }) as any;

      return result.affectedRows || 0;
    } catch (error) {
      console.error('Error cleaning up old logs:', error);
      return 0;
    }
  }
}

export default PushNotificationService;
