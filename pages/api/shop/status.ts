import { NextApiRequest, NextApiResponse } from 'next';
import { executeQuery } from '../../../lib/db';
import { connectionLimiter } from '../../../lib/connection-limiter';

interface OperatingHours {
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_open: boolean;
}

interface ShopNotification {
  id: string;
  title: string;
  message: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  show_overlay: boolean;
}

interface ShopStatusResponse {
  isOpen: boolean;
  status: 'open' | 'closed' | 'special_notification';
  message: string;
  title?: string;
  nextOpenTime?: string;
  currentTime: string;
  forceStatus?: boolean;
  operatingHours?: {
    today: OperatingHours;
    nextDay?: OperatingHours;
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ShopStatusResponse>) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      isOpen: false,
      status: 'closed',
      message: 'Method not allowed',
      currentTime: new Date().toISOString()
    });
  }

  await connectionLimiter.acquire();
  
  try {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const currentTime = now.toTimeString().slice(0, 8); // HH:MM:SS format
    
    // 1. Check for force status setting
    const forceStatusResult = await executeQuery({
      query: 'SELECT setting_key, setting_value FROM shop_status_settings WHERE setting_key IN (?, ?)',
      values: ['force_status', 'force_message']
    });

    const forceSettings = (forceStatusResult as any[]).reduce((acc: any, row: any) => {
      acc[row.setting_key] = row.setting_value;
      return acc;
    }, {});

    const forceStatus = forceSettings.force_status;
    const forceMessage = forceSettings.force_message || '';
    
    if (forceStatus === 'open') {
      return res.status(200).json({
        isOpen: true,
        status: 'open',
        message: forceMessage || 'Cửa hàng đang hoạt động',
        currentTime: now.toISOString(),
        forceStatus: true
      });
    }
    
    if (forceStatus === 'closed') {
      return res.status(200).json({
        isOpen: false,
        status: 'closed', 
        message: forceMessage || 'Cửa hàng hiện đang đóng cửa',
        currentTime: now.toISOString(),
        forceStatus: true
      });
    }

    // 2. Check for active special notifications
    const notificationsResult = await executeQuery({
      query: `
        SELECT * FROM shop_notifications 
        WHERE is_active = true 
        AND start_date <= NOW() 
        AND end_date >= NOW()
        ORDER BY start_date ASC
        LIMIT 1
      `,
      values: []
    });

    if ((notificationsResult as any[]).length > 0) {
      const notification = (notificationsResult as any[])[0] as ShopNotification;
      
      if (notification.show_overlay) {
        return res.status(200).json({
          isOpen: false,
          status: 'special_notification',
          message: notification.message || 'Cửa hàng tạm nghỉ',
          title: notification.title,
          currentTime: now.toISOString()
        });
      }
    }

    // 3. Check regular operating hours
    const operatingHoursResult = await executeQuery({
      query: 'SELECT * FROM shop_operating_hours WHERE day_of_week = ?',
      values: [currentDay]
    });

    if ((operatingHoursResult as any[]).length === 0) {
      return res.status(200).json({
        isOpen: false,
        status: 'closed',
        message: 'Không có thông tin giờ hoạt động cho ngày hôm nay',
        currentTime: now.toISOString()
      });
    }

    const todayHours = (operatingHoursResult as any[])[0] as OperatingHours;

    // Check if shop is closed for the day
    if (!todayHours.is_open) {
      // Get next open day
      const nextOpenResult = await executeQuery({
        query: `
          SELECT * FROM shop_operating_hours 
          WHERE is_open = true 
          AND day_of_week > ?
          ORDER BY day_of_week ASC
          LIMIT 1
        `,
        values: [currentDay]
      });

      let nextOpenTime = '';
      if ((nextOpenResult as any[]).length > 0) {
        const nextOpen = (nextOpenResult as any[])[0];
        const dayNames = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
        nextOpenTime = `${dayNames[nextOpen.day_of_week]} lúc ${nextOpen.open_time.slice(0, 5)}`;
      }

      return res.status(200).json({
        isOpen: false,
        status: 'closed',
        message: `Cửa hàng nghỉ vào ${['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'][currentDay]}`,
        nextOpenTime,
        currentTime: now.toISOString(),
        operatingHours: { today: todayHours }
      });
    }

    // Check if current time is within operating hours
    const openTime = todayHours.open_time;
    const closeTime = todayHours.close_time;

    const isWithinHours = currentTime >= openTime && currentTime <= closeTime;

    if (isWithinHours) {
      return res.status(200).json({
        isOpen: true,
        status: 'open',
        message: `Cửa hàng đang hoạt động (đóng cửa lúc ${closeTime.slice(0, 5)})`,
        currentTime: now.toISOString(),
        operatingHours: { today: todayHours }
      });
    } else {
      // Shop is closed, calculate next open time
      let nextOpenTime = '';
      
      if (currentTime < openTime) {
        // Same day, before opening
        nextOpenTime = `Hôm nay lúc ${openTime.slice(0, 5)}`;
      } else {
        // After closing, find next open day
        const nextDay = (currentDay + 1) % 7;
        const nextDayResult = await executeQuery({
          query: 'SELECT * FROM shop_operating_hours WHERE day_of_week = ? AND is_open = true',
          values: [nextDay]
        });

        if ((nextDayResult as any[]).length > 0) {
          const nextDayHours = (nextDayResult as any[])[0];
          const dayNames = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
          nextOpenTime = `${dayNames[nextDay]} lúc ${nextDayHours.open_time.slice(0, 5)}`;
        }
      }

      return res.status(200).json({
        isOpen: false,
        status: 'closed',
        message: 'Cửa hàng hiện đang đóng cửa',
        nextOpenTime,
        currentTime: now.toISOString(),
        operatingHours: { today: todayHours }
      });
    }

  } catch (error: any) {
    console.error('Shop status check error:', error);
    
    // Fallback: assume shop is open if API fails
    return res.status(200).json({
      isOpen: true,
      status: 'open',
      message: 'Cửa hàng đang hoạt động',
      currentTime: new Date().toISOString()
    });
  } finally {
    connectionLimiter.release();
  }
}
