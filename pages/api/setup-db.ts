import { NextApiRequest, NextApiResponse } from 'next';
import { initializeDatabase, executeQuery } from '../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Initialize basic database tables
    await initializeDatabase();

    // Add the settings table
    await executeQuery({
      query: `
        CREATE TABLE IF NOT EXISTS settings (
          setting_key VARCHAR(100) PRIMARY KEY,
          setting_value TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );
      `,
      values: [],
    });

    // Insert default settings if they don't exist
    const defaultSettings = [
      // Store settings
      { key: 'store.store_name', value: 'Cloud Shop' },
      { key: 'store.store_description', value: 'Chuỗi cửa hàng đồ uống chất lượng cao' },
      { key: 'store.store_address', value: '123 Đường ABC, Quận 1, TP. Hồ Chí Minh' },
      { key: 'store.store_phone', value: '0987654321' },
      { key: 'store.store_email', value: 'contact@cloudshop.com' },
      { key: 'store.store_hours', value: 'T2-T6: 7:00 - 22:00, T7-CN: 7:00 - 23:00' },
      { key: 'store.store_website', value: 'www.cloudshop.com' },
      // Default store coordinates (TP.HCM trung tâm) - có thể chỉnh trong Admin Settings
      { key: 'store.store_lat', value: '10.776889' },
      { key: 'store.store_lng', value: '106.700806' },

      // Shipping settings
      { key: 'shipping.free_shipping_min_amount', value: '200000' },
      { key: 'shipping.free_shipping_radius', value: '3' },
      { key: 'shipping.shipping_fee_per_km', value: '5000' },

      // Payment settings
      { key: 'payment.accept_cash', value: 'true' },
      { key: 'payment.accept_bank_transfer', value: 'true' },
      { key: 'payment.accept_credit_card', value: 'false' },
      { key: 'payment.bank_account_name', value: 'CÔNG TY CLOUD SHOP' },
      { key: 'payment.bank_account_number', value: '0123456789' },
      { key: 'payment.bank_name', value: 'Ngân hàng TMCP Kỹ Thương Việt Nam (Techcombank)' },
    ];

    // Insert default settings
    for (const setting of defaultSettings) {
      await executeQuery({
        query: `
          INSERT IGNORE INTO settings (setting_key, setting_value)
          VALUES (?, ?)
        `,
        values: [setting.key, setting.value],
      });
    }

    res.status(200).json({ message: 'Database initialized successfully' });
  } catch (error) {
    console.error('Error initializing database:', error);
    res.status(500).json({ message: 'Error initializing database', error: String(error) });
  }
} 