import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import { executeQuery } from '../../../../lib/db';

function sortObject(obj: Record<string, string>) {
  const sorted: Record<string, string> = {};
  Object.keys(obj).sort().forEach((key) => {
    sorted[key] = obj[key];
  });
  return sorted;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // VNPay return dùng GET
  try {
    const { query } = req;
    const vnp_SecureHash = String(query.vnp_SecureHash || '');

    // Build data to verify
    const input: Record<string, string> = {};
    Object.keys(query).forEach((key) => {
      if (key.startsWith('vnp_') && key !== 'vnp_SecureHash' && key !== 'vnp_SecureHashType') {
        input[key] = String(query[key]);
      }
    });

    const secretKey = process.env.VNPAY_SECRET_KEY || '';
    const sorted = sortObject(input);
    const signParams = new URLSearchParams();
    Object.entries(sorted).forEach(([k, v]) => signParams.append(k, String(v)));
    const signData = signParams.toString();
    const signed = crypto.createHmac('sha512', secretKey).update(Buffer.from(signData, 'utf-8')).digest('hex');

    if (!secretKey || signed !== vnp_SecureHash) {
      return res.status(400).json({ success: false, message: 'Checksum invalid' });
    }

    const orderId = String(query.vnp_TxnRef);
    const responseCode = String(query.vnp_ResponseCode);

    if (!orderId) return res.status(400).json({ success: false, message: 'Missing orderId' });

    // Cập nhật trạng thái thanh toán theo responseCode
    // 00: Success
    const newStatus = responseCode === '00' ? 'paid' : 'failed';

    await executeQuery({
      query: 'UPDATE orders SET payment_status = ?, updated_at = NOW() WHERE id = ? AND payment_status <> \"paid\"',
      values: [newStatus, orderId],
    });

    // Điều hướng về trang hoàn tất
    const redirectUrl = `/checkout/complete?orderId=${orderId}`;
    res.writeHead(302, { Location: redirectUrl });
    res.end();
  } catch (error: any) {
    console.error('VNPay return error:', error);
    return res.status(500).json({ success: false, message: 'Internal error' });
  }
}

