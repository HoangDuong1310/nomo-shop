import type { NextApiRequest, NextApiResponse } from 'next';
import { executeQuery } from '../../../../lib/db';

interface ForceStatusResponse {
  status: 'auto' | 'open' | 'closed';
  message: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      try {
        // Get current force status
        const results = await executeQuery({
          query: `
            SELECT setting_key, setting_value 
            FROM shop_status_settings 
            WHERE setting_key IN ('force_status', 'force_message')
          `
        });

        const settings = (results as any[]).reduce((acc: any, row: any) => {
          acc[row.setting_key] = row.setting_value;
          return acc;
        }, {});

        const response: ForceStatusResponse = {
          status: settings.force_status || 'auto',
          message: settings.force_message || ''
        };

        return res.status(200).json(response);
      } catch (error) {
        console.error('Error fetching force status:', error);
        return res.status(500).json({ 
          error: 'Không thể tải trạng thái khẩn cấp' 
        });
      }

    } else if (req.method === 'POST') {
      try {
        const { status, message } = req.body;

        if (!['auto', 'open', 'closed'].includes(status)) {
          return res.status(400).json({ error: 'Trạng thái không hợp lệ' });
        }

        // Update or insert force_status setting
        await executeQuery({
          query: `
            INSERT INTO shop_status_settings (setting_key, setting_value, updated_at) 
            VALUES (?, ?, NOW()) 
            ON DUPLICATE KEY UPDATE setting_value = ?, updated_at = NOW()
          `,
          values: ['force_status', status, status]
        });

        // Update or insert force_message setting
        const messageValue = message || '';
        await executeQuery({
          query: `
            INSERT INTO shop_status_settings (setting_key, setting_value, updated_at) 
            VALUES (?, ?, NOW()) 
            ON DUPLICATE KEY UPDATE setting_value = ?, updated_at = NOW()
          `,
          values: ['force_message', messageValue, messageValue]
        });

        return res.status(200).json({ 
          success: true, 
          message: 'Cập nhật trạng thái khẩn cấp thành công' 
        });
      } catch (error) {
        console.error('Error updating force status:', error);
        return res.status(500).json({ 
          error: 'Không thể cập nhật trạng thái khẩn cấp' 
        });
      }

    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Force status API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
