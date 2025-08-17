import { NextApiRequest, NextApiResponse } from 'next';
import { executeQuery } from '../../../../lib/db';
import { verifyToken } from '../../../../lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Chỉ chấp nhận phương thức GET
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // Lấy token từ cookie
    const token = req.cookies.auth_token;
    
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

    // Lấy tham số khoảng thời gian từ query
    const { range = 'week' } = req.query;
    
    // Cấu hình khoảng thời gian cho các truy vấn
    let dateFilter;
    if (range === 'week') {
      dateFilter = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
    } else if (range === 'month') {
      dateFilter = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
    } else if (range === 'year') {
      dateFilter = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 365 DAY)';
    } else {
      dateFilter = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
    }

    // Lấy dữ liệu bán hàng theo ngày
    const salesData = await executeQuery({
      query: `
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as orders,
          SUM(total) as total
        FROM orders
        WHERE 1=1 ${dateFilter}
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `,
      values: [],
    });

    // Lấy dữ liệu hiệu suất sản phẩm
    const productPerformance = await executeQuery({
      query: `
        SELECT 
          p.id,
          p.name,
          SUM(oi.quantity) as total_sold,
          SUM(oi.price * oi.quantity) as revenue
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN orders o ON oi.order_id = o.id
        WHERE 1=1 ${dateFilter}
        GROUP BY p.id, p.name
        ORDER BY revenue DESC
        LIMIT 10
      `,
      values: [],
    });

    // Lấy thống kê khách hàng
    const totalCustomers = await executeQuery({
      query: 'SELECT COUNT(*) as count FROM users WHERE role = "user"',
      values: [],
    });

    const newCustomers = await executeQuery({
      query: `
        SELECT COUNT(*) as count 
        FROM users 
        WHERE role = "user" 
        AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      `,
      values: [],
    });

    const repeatCustomers = await executeQuery({
      query: `
        SELECT COUNT(DISTINCT user_id) as count
        FROM orders
        WHERE user_id IS NOT NULL
        AND order_status = 'completed'
        AND (
          SELECT COUNT(*) 
          FROM orders o2 
          WHERE o2.user_id = orders.user_id AND o2.order_status = 'completed'
        ) > 1
      `,
      values: [],
    });

    const avgOrderValue = await executeQuery({
      query: `
        SELECT AVG(total) as avg_value
        FROM orders
        WHERE order_status = 'completed'
        ${dateFilter}
      `,
      values: [],
    });

    // Chuẩn bị dữ liệu phản hồi
    const reportData = {
      sales: salesData,
      products: productPerformance,
      customers: {
        total_customers: (totalCustomers as any[])[0].count,
        new_customers: (newCustomers as any[])[0].count,
        repeat_customers: (repeatCustomers as any[])[0].count,
        avg_order_value: Math.round((avgOrderValue as any[])[0].avg_value || 0)
      }
    };

    // Xử lý dữ liệu để tránh lỗi serialize Date
    const serializedData = JSON.parse(JSON.stringify(reportData));

    // Trả về kết quả
    res.status(200).json(serializedData);
    
  } catch (error: any) {
    console.error('Reports API error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy dữ liệu báo cáo',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 