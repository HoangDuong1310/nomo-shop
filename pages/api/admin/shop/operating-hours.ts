import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../../../lib/auth';
import { getTokenFromRequest } from '../../../../lib/auth-utils';
import { executeQuery } from '../../../../lib/db';

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
      try {
        // Get operating hours
        const operatingHoursResult = await executeQuery({
          query: 'SELECT * FROM shop_operating_hours ORDER BY day_of_week',
          values: []
        });

        return res.status(200).json({
          success: true,
          operatingHours: operatingHoursResult
        });
      } catch (error) {
        console.error('Error fetching operating hours:', error);
        return res.status(500).json({
          success: false,
          message: 'Không thể tải giờ hoạt động'
        });
      }

    } else if (req.method === 'PUT') {
      try {
        // Update operating hours
        const { operatingHours } = req.body;

        if (!Array.isArray(operatingHours)) {
          return res.status(400).json({ success: false, message: 'Invalid data format' });
        }

        // Validate each operating hour entry
        for (const hour of operatingHours) {
          if (typeof hour.day_of_week !== 'number' || hour.day_of_week < 0 || hour.day_of_week > 6) {
            return res.status(400).json({ 
              success: false, 
              message: 'Ngày trong tuần không hợp lệ' 
            });
          }

          if (hour.is_open && (!hour.open_time || !hour.close_time)) {
            return res.status(400).json({ 
              success: false, 
              message: 'Giờ mở cửa và đóng cửa là bắt buộc khi mở cửa' 
            });
          }

          if (hour.is_open && hour.open_time >= hour.close_time) {
            return res.status(400).json({ 
              success: false, 
              message: 'Giờ đóng cửa phải sau giờ mở cửa' 
            });
          }
        }

        // Update each day's operating hours
        for (const hour of operatingHours) {
          await executeQuery({
            query: `
              UPDATE shop_operating_hours 
              SET open_time = ?, close_time = ?, is_open = ?, updated_at = NOW()
              WHERE day_of_week = ?
            `,
            values: [hour.open_time, hour.close_time, hour.is_open, hour.day_of_week]
          });
        }

        return res.status(200).json({
          success: true,
          message: 'Cập nhật giờ hoạt động thành công'
        });
      } catch (error) {
        console.error('Error updating operating hours:', error);
        return res.status(500).json({
          success: false,
          message: 'Không thể cập nhật giờ hoạt động'
        });
      }

    } else {
      res.setHeader('Allow', ['GET', 'PUT']);
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

  } catch (error: any) {
    console.error('Operating hours API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xử lý yêu cầu'
    });
  }
}
