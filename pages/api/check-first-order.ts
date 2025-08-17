import { NextApiRequest, NextApiResponse } from 'next';
import { executeQuery } from '../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Chỉ chấp nhận phương thức GET
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Lấy số điện thoại từ query
    const { phone } = req.query;
    
    if (!phone || typeof phone !== 'string') {
      return res.status(400).json({ 
        success: false, 
        isFirstOrder: false,
        message: 'Thiếu số điện thoại hoặc số điện thoại không hợp lệ' 
      });
    }

    // Validate phone number format
    const phoneRegex = /^(0|\\+84)[0-9]{9}$/;
    if (!phoneRegex.test(phone.replace(/\\s/g, ''))) {
      return res.status(400).json({ 
        success: false, 
        isFirstOrder: false,
        message: 'Định dạng số điện thoại không hợp lệ' 
      });
    }

    // Kiểm tra trong bảng orders xem số điện thoại đã đặt hàng trước đó chưa
    const results = await executeQuery({
      query: `
        SELECT COUNT(*) as orderCount 
        FROM orders 
        WHERE phone = ?
      `,
      values: [phone],
    });

    const orderCount = (results as any[])[0].orderCount;

    // Nếu chưa có đơn hàng nào, đây là đơn hàng đầu tiên
    const isFirstOrder = orderCount === 0;

    res.status(200).json({
      success: true,
      isFirstOrder,
      message: isFirstOrder 
        ? 'Đây là đơn hàng đầu tiên của bạn, bạn được giảm giá!' 
        : 'Bạn đã đặt hàng trước đó'
    });
    
  } catch (error: any) {
    console.error('Check first order error:', error);
    res.status(500).json({
      success: false,
      isFirstOrder: false,
      message: 'Đã xảy ra lỗi khi kiểm tra đơn hàng đầu tiên',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 