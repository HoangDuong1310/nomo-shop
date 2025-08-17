import { NextApiRequest, NextApiResponse } from 'next';
import { executeQuery } from '../../../lib/db';
import { verifyToken } from '../../../lib/auth';
import { validateOrderData } from '../../../lib/validation';
import { EmailService } from '../../../lib/email-service';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Chỉ chấp nhận phương thức POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const {
      items,
      customerInfo,
      discount: clientDiscount,
      total: clientTotal,
      payment_method
    } = req.body;

    // Validate order data (sơ bộ)
    const validation = validateOrderData({ items, customerInfo, total: clientTotal, payment_method });
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    // Lấy token từ cookie (nếu có)
    const token = req.cookies.auth_token;
    let userId: string | null = null;

    if (token) {
      try {
        const decodedToken = verifyToken(token);
        if (decodedToken && decodedToken.id) {
          userId = decodedToken.id;
        }
      } catch (error) {
        console.error('Token verification error:', error);
      }
    }

    // Helper: numbers in VND
    const toInt = (v: any) => {
      const n = Math.round(Number(v) || 0);
      return Number.isFinite(n) ? n : 0;
    };

    // Recompute subtotal from items
    const serverSubtotal = toInt(
      (items || []).reduce((sum: number, it: any) => sum + toInt(it.price) * toInt(it.quantity), 0)
    );

    // Compute shipping fee using settings and address (inline)
    const settingsRows = await executeQuery({
      query: 'SELECT setting_key, setting_value FROM settings WHERE setting_key IN ("store.store_lat", "store.store_lng", "shipping.free_shipping_radius", "shipping.shipping_fee_per_km")'
    });
    const settings = new Map<string, string>();
    if (Array.isArray(settingsRows)) {
      (settingsRows as any[]).forEach((r) => settings.set(r.setting_key, r.setting_value));
    }
    const storeLat = Number(settings.get('store.store_lat') || 0);
    const storeLng = Number(settings.get('store.store_lng') || 0);
    const freeRadiusKm = Number(settings.get('shipping.free_shipping_radius') || 3);
    const feePerKm = Number(settings.get('shipping.shipping_fee_per_km') || 5000);

    // Business rule: Free ship trong bán kính 3 km. Xa hơn shop sẽ đặt ship ngoài.
    // Tạm thời phí ship luôn = 0 ở phía server.
    const serverShippingFee = 0;

    // Constrain discount: max 10% subtotal, cap 50k
    const maxDiscountByRate = Math.floor(serverSubtotal * 0.1);
    const serverDiscount = Math.max(0, Math.min(toInt(clientDiscount), 50000, maxDiscountByRate));

    // Final total
    const serverTotal = Math.max(0, serverSubtotal + serverShippingFee - serverDiscount);

    // Tạo ID cho đơn hàng
    const orderId = uuidv4();

    // Tạo đơn hàng mới
    await executeQuery({
      query: `
        INSERT INTO orders (
          id, user_id, full_name, phone, address, note, 
          subtotal, shipping_fee, discount, total, 
          payment_method, payment_status, order_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      values: [
        orderId,
        userId,
        customerInfo.name,
        customerInfo.phone,
        customerInfo.address,
        customerInfo.note || null,
        serverSubtotal,
        serverShippingFee,
        serverDiscount,
        serverTotal,
        payment_method,
        // payment_status: pending cho cả COD/VNPay, sẽ cập nhật khi thanh toán thành công
        'pending',
        'pending'
      ],
    });

    // Thêm các sản phẩm vào đơn hàng
    for (const item of items) {
      await executeQuery({
        query: `
          INSERT INTO order_items (
            id, order_id, product_id, product_name,
            product_option, price, quantity, subtotal
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        values: [
          uuidv4(),
          orderId,
          item.productId,
          item.name,
          item.option || null,
          item.price,
          item.quantity,
          item.price * item.quantity
        ],
      });
    }

    // Kiểm tra nếu là đơn hàng đầu tiên của người dùng dựa trên số điện thoại
    if (serverDiscount > 0) {
      const discountId = uuidv4();
      await executeQuery({
        query: `
          INSERT INTO first_order_discounts (id, phone, order_id, discount_amount)
          VALUES (?, ?, ?, ?)
        `,
        values: [discountId, customerInfo.phone, orderId, serverDiscount],
      });
    }

    // 🔥 GỬI EMAIL XÁC NHẬN ĐƠN HÀNG VÀ ALERT ADMIN
    try {
      // Chuẩn bị dữ liệu order cho email
      const orderForEmail = {
        id: orderId,
        user_id: userId || 'guest',
        user_name: customerInfo.name,
        user_email: customerInfo.email,
        user_phone: customerInfo.phone,
        total: serverTotal,
        order_status: 'pending',
        payment_status: 'pending',
        address: customerInfo.address,
        note: customerInfo.note || '',
        created_at: new Date().toISOString(),
        items: items.map((item: any) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          image: item.image || ''
        }))
      };

      // Gửi email xác nhận đơn hàng cho khách hàng
      await EmailService.sendOrderConfirmation(orderForEmail);
      console.log(`✅ Order confirmation email sent to ${customerInfo.email}`);

      // Gửi alert email cho admin
      await EmailService.sendNewOrderAlert(orderForEmail);
      console.log(`✅ New order alert sent to admin`);

    } catch (emailError) {
      console.error('⚠️ Failed to send order emails:', emailError);
      // Không throw error để không ảnh hưởng đến order creation
    }

    res.status(200).json({
      success: true,
      message: 'Đặt hàng thành công',
      orderId: orderId,
    });
    
  } catch (error: any) {
    console.error('Order creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi tạo đơn hàng',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 