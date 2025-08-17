import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import { executeQuery } from '../../../../lib/db';

function sortObject(obj: Record<string, string | number>) {
  const sorted: Record<string, string | number> = {};
  Object.keys(obj).sort().forEach((key) => {
    sorted[key] = obj[key];
  });
  return sorted;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { orderId } = req.body as { orderId: string };
    if (!orderId) return res.status(400).json({ success: false, message: 'Missing orderId' });

    const rows = await executeQuery({
      query: 'SELECT id, total, payment_status FROM orders WHERE id = ?',
      values: [orderId],
    });
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    const order = (rows as any[])[0];
    if (order.payment_status === 'paid') {
      return res.status(200).json({ success: true, message: 'Order already paid', redirectUrl: `/checkout/complete?orderId=${orderId}` });
    }

    // Config
    const tmnCode = process.env.VNPAY_MERCHANT_CODE || '';
    const secretKey = process.env.VNPAY_SECRET_KEY || '';
    const vnpUrl = process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    const returnUrl = process.env.VNPAY_RETURN_URL || `${req.headers.origin || ''}/api/payments/vnpay/return`;

    if (!tmnCode || !secretKey) {
      return res.status(500).json({ success: false, message: 'VNPay config missing' });
    }

    const createDate = new Date();
    const vnpCreateDate = `${createDate.getFullYear()}${('0' + (createDate.getMonth() + 1)).slice(-2)}${('0' + createDate.getDate()).slice(-2)}${('0' + createDate.getHours()).slice(-2)}${('0' + createDate.getMinutes()).slice(-2)}${('0' + createDate.getSeconds()).slice(-2)}`;

    const vnpParams: Record<string, string | number> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId,
      vnp_OrderInfo: `Thanh toan don hang ${orderId}`,
      vnp_OrderType: 'other',
      vnp_Amount: Math.round(Number(order.total) * 100), // x100 theo VNP
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
      vnp_CreateDate: vnpCreateDate,
    };

    // Sort params and build form-encoded string for signing
    const sorted = sortObject(vnpParams);
    const signParams = new URLSearchParams();
    Object.entries(sorted).forEach(([k, v]) => signParams.append(k, String(v)));
    const signData = signParams.toString();
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    // Final redirect params: include SecureHash and SecureHashType
    const finalParams = new URLSearchParams(signParams.toString());
    finalParams.append('vnp_SecureHashType', 'HmacSHA512');
    finalParams.append('vnp_SecureHash', signed);

    const redirectUrl = `${vnpUrl}?${finalParams.toString()}`;

    return res.status(200).json({ success: true, redirectUrl });
  } catch (error: any) {
    console.error('VNPay create error:', error);
    return res.status(500).json({ success: false, message: 'Internal error' });
  }
}

