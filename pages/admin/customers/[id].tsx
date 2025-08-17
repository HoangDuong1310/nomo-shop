import { useState, useEffect } from 'react';
import { NextPage, GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  FaArrowLeft, 
  FaUser, 
  FaEnvelope, 
  FaPhone,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaShoppingBag,
  FaEye
} from 'react-icons/fa';
import AdminLayout from '../../../components/Layout/AdminLayout';
import { verifyToken } from '../../../lib/auth';
import { executeQuery } from '../../../lib/db';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  role: string;
  created_at: string;
  updated_at: string;
}

interface Order {
  id: string;
  total: number;
  order_status: string;
  payment_status: string;
  created_at: string;
}

interface UserStats {
  total_orders: number;
  total_spent: number;
  first_order_date: string | null;
  last_order_date: string | null;
  avg_order_value: number;
}

interface CustomerDetailProps {
  user: User | null;
  orders: Order[];
  stats: UserStats;
  error?: string;
}

const CustomerDetailPage: NextPage<CustomerDetailProps> = ({ user, orders, stats, error }) => {
  const router = useRouter();

  // Nếu có lỗi hoặc không tìm thấy khách hàng
  if (!user) {
    return (
      <AdminLayout title="Chi tiết khách hàng">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-red-600 mb-4">
            {error || 'Không tìm thấy thông tin khách hàng'}
          </div>
          <Link href="/admin/customers" className="text-primary-600 hover:underline flex items-center">
            <FaArrowLeft className="mr-1" /> Quay lại danh sách khách hàng
          </Link>
        </div>
      </AdminLayout>
    );
  }

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // Map các trạng thái đơn hàng sang tiếng Việt và màu sắc
  const orderStatusMap: Record<string, { text: string; color: string; bgColor: string }> = {
    pending: { text: 'Chờ xác nhận', color: 'text-yellow-800', bgColor: 'bg-yellow-100' },
    confirmed: { text: 'Đã xác nhận', color: 'text-blue-800', bgColor: 'bg-blue-100' },
    processing: { text: 'Đang xử lý', color: 'text-indigo-800', bgColor: 'bg-indigo-100' },
    shipping: { text: 'Đang giao', color: 'text-purple-800', bgColor: 'bg-purple-100' },
    completed: { text: 'Hoàn thành', color: 'text-green-800', bgColor: 'bg-green-100' },
    cancelled: { text: 'Đã hủy', color: 'text-red-800', bgColor: 'bg-red-100' },
  };

  // Map các trạng thái thanh toán sang tiếng Việt và màu sắc
  const paymentStatusMap: Record<string, { text: string; color: string; bgColor: string }> = {
    pending: { text: 'Chờ thanh toán', color: 'text-yellow-800', bgColor: 'bg-yellow-100' },
    paid: { text: 'Đã thanh toán', color: 'text-green-800', bgColor: 'bg-green-100' },
    failed: { text: 'Thanh toán thất bại', color: 'text-red-800', bgColor: 'bg-red-100' },
  };

  return (
    <AdminLayout title={`Khách hàng: ${user.name}`}>
      <Head>
        <title>Chi tiết khách hàng - Cloud Shop Admin</title>
        <meta name="description" content="Chi tiết khách hàng - Cloud Shop Admin" />
      </Head>

      <div className="mb-6">
        <Link href="/admin/customers" className="inline-flex items-center text-primary-600 hover:underline">
          <FaArrowLeft className="mr-1" /> Danh sách khách hàng
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Thông tin khách hàng */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Thông tin khách hàng</h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <FaUser className="text-primary-600 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500 mb-1">Họ tên</p>
                  <p className="font-medium">{user.name}</p>
                </div>
              </div>
              <div className="flex items-start">
                <FaEnvelope className="text-primary-600 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500 mb-1">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
              </div>
              <div className="flex items-start">
                <FaPhone className="text-primary-600 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500 mb-1">Số điện thoại</p>
                  <p className="font-medium">{user.phone || 'Chưa cập nhật'}</p>
                </div>
              </div>
              <div className="flex items-start">
                <FaMapMarkerAlt className="text-primary-600 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500 mb-1">Địa chỉ</p>
                  <p className="font-medium">{user.address || 'Chưa cập nhật'}</p>
                </div>
              </div>
              <div className="flex items-start">
                <FaCalendarAlt className="text-primary-600 mr-3 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500 mb-1">Ngày đăng ký</p>
                  <p className="font-medium">{formatDate(user.created_at)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Thống kê đơn hàng */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Thống kê mua hàng</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm text-gray-500 mb-1">Tổng đơn hàng</p>
                  <p className="text-xl font-semibold text-primary-600">{stats.total_orders}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm text-gray-500 mb-1">Tổng chi tiêu</p>
                  <p className="text-xl font-semibold text-primary-600">{formatCurrency(stats.total_spent)}</p>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-500 mb-1">Giá trị đơn hàng trung bình</p>
                <p className="text-xl font-semibold text-primary-600">{formatCurrency(stats.avg_order_value)}</p>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Đơn hàng đầu tiên</p>
                  <p className="font-medium">{formatDate(stats.first_order_date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Đơn hàng gần nhất</p>
                  <p className="font-medium">{formatDate(stats.last_order_date)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lịch sử đơn hàng */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">Lịch sử đơn hàng</h2>
              <p className="text-sm text-gray-500">
                {orders.length} đơn hàng đã đặt
              </p>
            </div>

            <div className="overflow-x-auto">
              {orders.length > 0 ? (
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mã đơn hàng
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ngày đặt
                      </th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tổng tiền
                      </th>
                      <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900">
                            #{order.id.substring(0, 8)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-500">
                            {formatDate(order.created_at)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex flex-col gap-1 items-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              orderStatusMap[order.order_status]?.bgColor || 'bg-gray-100'
                            } ${orderStatusMap[order.order_status]?.color || 'text-gray-800'}`}>
                              {orderStatusMap[order.order_status]?.text || order.order_status}
                            </span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              paymentStatusMap[order.payment_status]?.bgColor || 'bg-gray-100'
                            } ${paymentStatusMap[order.payment_status]?.color || 'text-gray-800'}`}>
                              {paymentStatusMap[order.payment_status]?.text || order.payment_status}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className="text-sm font-medium">
                            {formatCurrency(order.total)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            <FaEye className="inline-block" /> Xem
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <FaShoppingBag className="text-gray-300 text-5xl mb-4" />
                  <p className="text-gray-500">Khách hàng chưa có đơn hàng nào</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const { id } = context.params || {};
    
    // Lấy token từ cookie
    const token = context.req.cookies.auth_token;
    
    if (!token) {
      return {
        redirect: {
          destination: '/auth/login?returnUrl=' + encodeURIComponent(context.resolvedUrl),
          permanent: false,
        },
      };
    }
    
    // Verify token
    const decodedToken = verifyToken(token);
    
    if (!decodedToken || !decodedToken.id) {
      return {
        redirect: {
          destination: '/auth/login?returnUrl=' + encodeURIComponent(context.resolvedUrl),
          permanent: false,
        },
      };
    }

    // Kiểm tra quyền admin
    const userResult = await executeQuery({
      query: 'SELECT role FROM users WHERE id = ?',
      values: [decodedToken.id],
    });

    if ((userResult as any[]).length === 0 || (userResult as any[])[0].role !== 'admin') {
      return {
        redirect: {
          destination: '/',
          permanent: false,
        },
      };
    }
    
    // Lấy thông tin khách hàng
    const customerResult = await executeQuery({
      query: 'SELECT * FROM users WHERE id = ? AND role = ?',
      values: [id, 'user'],
    });
    
    if ((customerResult as any[]).length === 0) {
      return {
        props: {
          user: null,
          orders: [],
          stats: {
            total_orders: 0,
            total_spent: 0,
            first_order_date: null,
            last_order_date: null,
            avg_order_value: 0,
          },
          error: 'Không tìm thấy thông tin khách hàng',
        },
      };
    }
    
    const user = (customerResult as any[])[0];
    
    // Lấy thống kê đơn hàng của khách hàng
    const statsResult = await executeQuery({
      query: `
        SELECT
          COUNT(*) as total_orders,
          COALESCE(SUM(total), 0) as total_spent,
          MIN(created_at) as first_order_date,
          MAX(created_at) as last_order_date,
          CASE WHEN COUNT(*) > 0 THEN COALESCE(SUM(total), 0) / COUNT(*) ELSE 0 END as avg_order_value
        FROM orders
        WHERE user_id = ?
      `,
      values: [id],
    });
    
    const stats = (statsResult as any[])[0];
    
    // Lấy danh sách đơn hàng của khách hàng
    const ordersResult = await executeQuery({
      query: `
        SELECT id, total, order_status, payment_status, created_at
        FROM orders
        WHERE user_id = ?
        ORDER BY created_at DESC
      `,
      values: [id],
    });
    
    // Xử lý dữ liệu để tránh lỗi serialize Date
    const serializedUser = JSON.parse(JSON.stringify(user));
    const serializedOrders = JSON.parse(JSON.stringify(ordersResult));
    const serializedStats = JSON.parse(JSON.stringify(stats));
    
    return {
      props: {
        user: serializedUser,
        orders: serializedOrders,
        stats: serializedStats,
      },
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      props: {
        user: null,
        orders: [],
        stats: {
          total_orders: 0,
          total_spent: 0,
          first_order_date: null,
          last_order_date: null,
          avg_order_value: 0,
        },
        error: 'Có lỗi xảy ra khi tải thông tin khách hàng',
      },
    };
  }
};

export default CustomerDetailPage;