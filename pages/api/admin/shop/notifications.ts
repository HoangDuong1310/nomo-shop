import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken } from '../../../../lib/auth';
import { getTokenFromRequest } from '../../../lib/auth-utils';
import { executeQuery } from '../../../../lib/db';
import { v4 as uuidv4 } from 'uuid';

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
        // Get notifications
        const notificationsResult = await executeQuery({
          query: 'SELECT * FROM shop_notifications ORDER BY start_date DESC',
          values: []
        });

        return res.status(200).json({
          success: true,
          notifications: notificationsResult
        });
      } catch (error) {
        console.error('Error fetching notifications:', error);
        return res.status(500).json({
          success: false,
          message: 'Không thể tải danh sách thông báo'
        });
      }

    } else if (req.method === 'POST') {
      try {
        const { title, message, start_date, end_date, show_overlay } = req.body;

        // Validate required fields
        if (!title || !message || !start_date || !end_date) {
          return res.status(400).json({
            success: false,
            message: 'Vui lòng điền đầy đủ thông tin'
          });
        }

        // Validate dates
        const startDate = new Date(start_date);
        const endDate = new Date(end_date);
        
        if (startDate >= endDate) {
          return res.status(400).json({
            success: false,
            message: 'Ngày kết thúc phải sau ngày bắt đầu'
          });
        }

        const notificationId = uuidv4();
        
        await executeQuery({
          query: `
            INSERT INTO shop_notifications 
            (id, title, message, start_date, end_date, show_overlay, is_active) 
            VALUES (?, ?, ?, ?, ?, ?, true)
          `,
          values: [notificationId, title, message, start_date, end_date, show_overlay || false]
        });

        return res.status(201).json({
          success: true,
          message: 'Tạo thông báo thành công'
        });

      } catch (error) {
        console.error('Error creating notification:', error);
        return res.status(500).json({
          success: false,
          message: 'Không thể tạo thông báo'
        });
      }

    } else if (req.method === 'PUT') {
      try {
        const { id, title, message, start_date, end_date, show_overlay, is_active } = req.body;

        if (!id) {
          return res.status(400).json({
            success: false,
            message: 'ID thông báo là bắt buộc'
          });
        }

        await executeQuery({
          query: `
            UPDATE shop_notifications 
            SET title = ?, message = ?, start_date = ?, end_date = ?, 
                show_overlay = ?, is_active = ?, updated_at = NOW()
            WHERE id = ?
          `,
          values: [title, message, start_date, end_date, show_overlay, is_active, id]
        });

        return res.status(200).json({
          success: true,
          message: 'Cập nhật thông báo thành công'
        });

      } catch (error) {
        console.error('Error updating notification:', error);
        return res.status(500).json({
          success: false,
          message: 'Không thể cập nhật thông báo'
        });
      }

    } else if (req.method === 'DELETE') {
      try {
        const { id } = req.query;

        if (!id) {
          return res.status(400).json({
            success: false,
            message: 'ID thông báo là bắt buộc'
          });
        }

        await executeQuery({
          query: 'DELETE FROM shop_notifications WHERE id = ?',
          values: [id]
        });

        return res.status(200).json({
          success: true,
          message: 'Xóa thông báo thành công'
        });

      } catch (error) {
        console.error('Error deleting notification:', error);
        return res.status(500).json({
          success: false,
          message: 'Không thể xóa thông báo'
        });
      }

    } else {
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

  } catch (error: any) {
    console.error('Shop notifications API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xử lý yêu cầu'
    });
  }
}
