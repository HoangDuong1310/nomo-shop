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
        // Get email subscribers
        const subscribersResult = await executeQuery({
          query: 'SELECT * FROM shop_email_notifications ORDER BY created_at DESC',
          values: []
        });

        return res.status(200).json({
          success: true,
          subscribers: subscribersResult
        });
      } catch (error) {
        console.error('Error fetching email subscribers:', error);
        return res.status(500).json({
          success: false,
          message: 'Không thể tải danh sách email subscribers'
        });
      }

    } else if (req.method === 'PUT') {
      try {
        // Update subscriber status
        const { id, is_active } = req.body;

        if (!id) {
          return res.status(400).json({
            success: false,
            message: 'ID subscriber là bắt buộc'
          });
        }

        await executeQuery({
          query: 'UPDATE shop_email_notifications SET is_active = ?, updated_at = NOW() WHERE id = ?',
          values: [is_active, id]
        });

        return res.status(200).json({
          success: true,
          message: 'Cập nhật trạng thái subscriber thành công'
        });
      } catch (error) {
        console.error('Error updating subscriber status:', error);
        return res.status(500).json({
          success: false,
          message: 'Không thể cập nhật trạng thái subscriber'
        });
      }

    } else if (req.method === 'DELETE') {
      try {
        // Delete subscriber
        const { id } = req.query;

        if (!id) {
          return res.status(400).json({
            success: false,
            message: 'ID subscriber là bắt buộc'
          });
        }

        await executeQuery({
          query: 'DELETE FROM shop_email_notifications WHERE id = ?',
          values: [id]
        });

        return res.status(200).json({
          success: true,
          message: 'Xóa subscriber thành công'
        });
      } catch (error) {
        console.error('Error deleting subscriber:', error);
        return res.status(500).json({
          success: false,
          message: 'Không thể xóa subscriber'
        });
      }

    } else {
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

  } catch (error: any) {
    console.error('Email subscribers API error:', error);
    return res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xử lý yêu cầu'
    });
  }
}
