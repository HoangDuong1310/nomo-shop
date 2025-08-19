import { NextApiRequest, NextApiResponse } from 'next';
import { executeQuery } from '../../../../lib/db';
import { verifyToken } from '../../../../lib/auth';
import { getTokenFromRequest } from '../../../../lib/auth-utils';

interface StoreSettings {
  store_name: string;
  store_description: string;
  store_address: string;
  store_phone: string;
  store_email: string;
  store_hours: string;
  store_website: string;
  store_lat?: string;
  store_lng?: string;
  [key: string]: string | undefined;
}

interface ShippingSettings {
  free_shipping_min_amount: number;
  free_shipping_radius: number;
  shipping_fee_per_km: number;
  [key: string]: number;
}

interface PaymentSettings {
  accept_cash: boolean;
  accept_bank_transfer: boolean;
  accept_credit_card: boolean;
  accept_vnpay: boolean;
  accept_direct_bank: boolean; // chuyển khoản ngân hàng thủ công
  bank_account_name: string;
  bank_account_number: string;
  bank_name: string;
  bank_code?: string; // vietqr bank code slug (e.g., vietinbank)
  bank_template?: string; // vietqr template (e.g., compact2)
  [key: string]: boolean | string | undefined;
}

interface Settings {
  store: StoreSettings;
  shipping: ShippingSettings;
  payment: PaymentSettings;
  [key: string]: any;
}

interface SettingItem {
  setting_key: string;
  setting_value: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Lấy token từ cookie hoặc Authorization header
    const token = getTokenFromRequest(req);
    
    // Nếu không có token
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }
    
    // Verify token
    const decodedToken = verifyToken(token);
    
    if (!decodedToken || !decodedToken.id) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session'
      });
    }

    // Kiểm tra quyền admin
    const userResult = await executeQuery({
      query: 'SELECT role FROM users WHERE id = ?',
      values: [decodedToken.id],
    });

    if ((userResult as any[]).length === 0 || (userResult as any[])[0].role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Xử lý GET request - Lấy thiết lập
    if (req.method === 'GET') {
      // Lấy tất cả thiết lập từ bảng settings
      const settingsResult = await executeQuery({
        query: 'SELECT setting_key, setting_value FROM settings',
        values: [],
      });
      
      // Chuyển đổi dữ liệu từ mảng thành đối tượng
      const settings: Settings = {
        store: {
          store_name: '',
          store_description: '',
          store_address: '',
          store_phone: '',
          store_email: '',
          store_hours: '',
          store_website: '',
          store_lat: undefined,
          store_lng: undefined,
        },
        shipping: {
          free_shipping_min_amount: 0,
          free_shipping_radius: 0,
          shipping_fee_per_km: 0,
        },
        payment: {
          accept_cash: true,
          accept_bank_transfer: false,
          accept_credit_card: false,
          accept_vnpay: true,
          accept_direct_bank: false,
          bank_account_name: '',
          bank_account_number: '',
          bank_name: '',
          bank_code: '',
          bank_template: 'compact2',
        }
      };
      
      // Chuyển đổi mảng kết quả thành đối tượng settings
      (settingsResult as SettingItem[]).forEach(item => {
        const [category, key] = item.setting_key.split('.');
        
        if (category && key && settings[category]) {
          if (category === 'payment') {
            if (key.startsWith('accept_')) {
              settings[category][key] = item.setting_value === 'true';
            } else if (key.startsWith('bank_')) {
              settings[category][key] = item.setting_value;
            } else if (['bank_code','bank_template'].includes(key)) {
              (settings[category] as any)[key] = item.setting_value;
            }
          } else if (category === 'shipping') {
            settings[category][key] = parseFloat(item.setting_value);
          } else if (category === 'store') {
            settings[category][key] = item.setting_value;
          }
        }
      });
      
      return res.status(200).json(settings);
    }
    
    // Xử lý PUT request - Cập nhật thiết lập
    else if (req.method === 'PUT') {
      const { store, shipping, payment } = req.body as Settings;
      
      // Chuẩn bị các thiết lập để cập nhật
      const settingsToUpdate = [
        // Store settings
        { key: 'store.store_name', value: store.store_name },
        { key: 'store.store_description', value: store.store_description },
        { key: 'store.store_address', value: store.store_address },
        { key: 'store.store_phone', value: store.store_phone },
        { key: 'store.store_email', value: store.store_email },
        { key: 'store.store_hours', value: store.store_hours },
        { key: 'store.store_website', value: store.store_website },
        { key: 'store.store_lat', value: String(store.store_lat ?? '') },
        { key: 'store.store_lng', value: String(store.store_lng ?? '') },
        
        // Shipping settings
        { key: 'shipping.free_shipping_min_amount', value: String(shipping.free_shipping_min_amount) },
        { key: 'shipping.free_shipping_radius', value: String(shipping.free_shipping_radius) },
        { key: 'shipping.shipping_fee_per_km', value: String(shipping.shipping_fee_per_km) },
        
        // Payment settings
        { key: 'payment.accept_cash', value: String(payment.accept_cash) },
        { key: 'payment.accept_bank_transfer', value: String(payment.accept_bank_transfer) },
        { key: 'payment.accept_credit_card', value: String(payment.accept_credit_card) },
  { key: 'payment.accept_vnpay', value: String(payment.accept_vnpay) },
  { key: 'payment.accept_direct_bank', value: String(payment.accept_direct_bank) },
        { key: 'payment.bank_account_name', value: payment.bank_account_name },
        { key: 'payment.bank_account_number', value: payment.bank_account_number },
        { key: 'payment.bank_name', value: payment.bank_name },
  { key: 'payment.bank_code', value: (payment as any).bank_code || '' },
  { key: 'payment.bank_template', value: (payment as any).bank_template || 'compact2' },
      ];
      
      // Cập nhật từng thiết lập
      for (const setting of settingsToUpdate) {
        await executeQuery({
          query: `
            INSERT INTO settings (setting_key, setting_value)
            VALUES (?, ?)
            ON DUPLICATE KEY UPDATE setting_value = ?
          `,
          values: [setting.key, setting.value, setting.value],
        });
      }
      
      return res.status(200).json({
        success: true,
        message: 'Thiết lập đã được cập nhật thành công'
      });
    } 
    
    else {
      return res.status(405).json({ success: false, message: 'Method not allowed' });
    }
    
  } catch (error: any) {
    console.error('Settings API error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi xử lý thiết lập',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 