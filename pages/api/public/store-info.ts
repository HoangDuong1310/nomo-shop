import { NextApiRequest, NextApiResponse } from 'next';
import { executeQuery } from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Lấy các settings liên quan đến thông tin cửa hàng cho footer
    const settingKeys = [
      'store.store_name',
      'store.store_description', 
      'store.store_address',
      'store.store_phone',
      'store.store_email',
      'store.store_hours',
      'store.store_website'
    ];

    const result = await executeQuery({
      query: `SELECT setting_key, setting_value FROM settings WHERE setting_key IN (${settingKeys.map(() => '?').join(', ')})`,
      values: settingKeys
    });

    // Chuyển đổi kết quả thành object
    const storeInfo: any = {};
    
    (result as any[]).forEach((row: any) => {
      const key = row.setting_key.replace('store.', '');
      storeInfo[key] = row.setting_value || '';
    });

    // Set default values nếu chưa có trong database
    const defaults: { [key: string]: string } = {
      store_name: 'Cloud Shop',
      store_description: 'Ứng dụng đặt món trực tuyến qua mã QR, giao hàng nhanh chóng trong bán kính 3km.',
      store_address: '123 Đường ABC, Quận XYZ, TP.HCM',
      store_phone: '0123 456 789',
      store_email: 'info@cloudshop.com',
      store_hours: 'T2-T6: 8:00 - 22:00, T7-CN: 8:00 - 23:00',
      store_website: 'www.cloudshop.com'
    };

    // Merge với defaults
    Object.keys(defaults).forEach(key => {
      if (!storeInfo[key] || storeInfo[key].trim() === '') {
        storeInfo[key] = defaults[key];
      }
    });

    res.status(200).json({
      success: true,
      storeInfo
    });

  } catch (error: any) {
    console.error('Store info API error:', error);
    
    // Return defaults nếu có lỗi
    res.status(200).json({
      success: true,
      storeInfo: {
        store_name: 'Cloud Shop',
        store_description: 'Ứng dụng đặt món trực tuyến qua mã QR, giao hàng nhanh chóng trong bán kính 3km.',
        store_address: '123 Đường ABC, Quận XYZ, TP.HCM',
        store_phone: '0123 456 789',
        store_email: 'info@cloudshop.com',
        store_hours: 'T2-T6: 8:00 - 22:00, T7-CN: 8:00 - 23:00',
        store_website: 'www.cloudshop.com'
      }
    });
  }
}
