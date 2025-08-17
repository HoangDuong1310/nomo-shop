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
  if (req.method !== 'GET') {
    return res.status(405).json({ RspCode: '97', Message: 'Method not allowed' });
  }

  try {
    const { query } = req;
    const vnp_SecureHash = String(query.vnp_SecureHash || '');

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
      return res.status(200).json({ RspCode: '97', Message: 'Checksum failed' });
    }

    const orderId = String(query.vnp_TxnRef);
    const responseCode = String(query.vnp_ResponseCode);

    if (!orderId) return res.status(200).json({ RspCode: '04', Message: 'Order not found' });

    const newStatus = responseCode === '00' ? 'paid' : 'failed';

    await executeQuery({
      query: 'UPDATE orders SET payment_status = ?, updated_at = NOW() WHERE id = ? AND payment_status <> \"paid\"',
      values: [newStatus, orderId],
    });

    return res.status(200).json({ RspCode: '00', Message: 'Confirm success' });
  } catch (error: any) {
    console.error('VNPay IPN error:', error);
    return res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
  }
}

