import { NextApiRequest, NextApiResponse } from 'next';
import { executeQuery } from '../../../lib/db';

// Public (non-auth) endpoint that exposes which payment methods are enabled
// and basic bank transfer info.

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
  try {
    const rows = await executeQuery({
      query: 'SELECT setting_key, setting_value FROM settings WHERE setting_key LIKE "payment.%"'
    });
    const settings: any = {
      accept_cash: true,
      accept_bank_transfer: false,
      accept_credit_card: false,
      accept_vnpay: true,
      accept_direct_bank: false,
      bank_account_name: '',
      bank_account_number: '',
  bank_name: '',
  bank_code: '',
  bank_template: 'compact2'
    };
    if (Array.isArray(rows)) {
      (rows as any[]).forEach(r => {
        const key = r.setting_key.replace('payment.', '');
        if (key.startsWith('accept_')) {
          settings[key] = r.setting_value === 'true';
        } else if (key.startsWith('bank_')) {
          settings[key] = r.setting_value;
        } else if (['bank_code','bank_template'].includes(key)) {
          settings[key] = r.setting_value;
        }
      });
    }
    return res.status(200).json({ success: true, payment: settings });
  } catch (e: any) {
    console.error('Public payment-settings error:', e);
    return res.status(500).json({ success: false, message: 'Unable to load payment settings' });
  }
}
