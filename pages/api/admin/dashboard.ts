import { NextApiRequest, NextApiResponse } from 'next';
import { executeQuery } from '../../../lib/db';
import { verifyToken } from '../../../lib/auth';
import { getTokenFromRequest } from '../../../lib/auth-utils';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Chỉ chấp nhận phương thức GET
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

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

    // Lấy thống kê đơn hàng
    const orderStatsQuery = await executeQuery({
      query: 'SELECT COUNT(*) as total_orders, SUM(total) as total_revenue FROM orders',
      values: [],
    });
    
    // Lấy số lượng sản phẩm
    const productCountQuery = await executeQuery({
      query: 'SELECT COUNT(*) as total_products FROM products',
      values: [],
    });
    
    // Lấy số lượng khách hàng
    const customerCountQuery = await executeQuery({
      query: 'SELECT COUNT(*) as total_customers FROM users WHERE role = "user"',
      values: [],
    });
    
    // Lấy đơn hàng gần đây
    const recentOrdersQuery = await executeQuery({
      query: `
        SELECT o.id, o.full_name, o.total, o.created_at, o.order_status 
        FROM orders o 
        ORDER BY o.created_at DESC 
        LIMIT 5
      `,
      values: [],
    });

    const orderStats = (orderStatsQuery as any[])[0];
    const productCount = (productCountQuery as any[])[0];
    const customerCount = (customerCountQuery as any[])[0];
    
    // Format dữ liệu để trả về
    const dashboardData = {
      stats: {
        orders: orderStats.total_orders || 0,
        revenue: orderStats.total_revenue || 0,
        products: productCount.total_products || 0,
        customers: customerCount.total_customers || 0,
      },
      recentOrders: recentOrdersQuery || []
    };

    // Xử lý dữ liệu để tránh lỗi serialize Date
    const serializedData = JSON.parse(JSON.stringify(dashboardData));

    res.status(200).json(serializedData);
    
  } catch (error: any) {
    console.error('Dashboard API error:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy dữ liệu dashboard',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 