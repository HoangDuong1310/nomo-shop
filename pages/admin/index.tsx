import { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { 
  FaShoppingBag, 
  FaBoxOpen, 
  FaUsers, 
  FaMoneyBillWave,
  FaArrowUp,
  FaArrowDown,
  FaSpinner,
  FaChartLine
} from 'react-icons/fa';
import dynamic from 'next/dynamic';
const SalesLineChart = dynamic(() => import('../../components/charts/SalesLineChart').then(m => m.default), { ssr: false });
import AdminLayout from '../../components/Layout/AdminLayout';

interface DashboardStat {
  title: string;
  value: string | number;
  icon: JSX.Element;
  trend?: {
    value: number;
    isUp: boolean;
  };
  color: string;
}

interface DashboardData {
  recentOrders: any[];
  stats: {
    orders: number;
    products: number;
    customers: number;
    revenue: number;
  }
}

const AdminDashboard: NextPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    recentOrders: [],
    stats: {
      orders: 0,
      products: 0,
      customers: 0,
      revenue: 0,
    }
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        // Thay thế bằng API call thực tế
        const response = await fetch('/api/admin/dashboard');
        if (response.ok) {
          const data = await response.json();
          setDashboardData(data);
        } else {
          // Dùng dữ liệu mẫu trong môi trường phát triển
          setDashboardData({
            recentOrders: [
              { 
                id: 'order-1', 
                full_name: 'Nguyễn Văn A', 
                total: 250000, 
                created_at: new Date().toISOString(),
                order_status: 'pending'
              },
              { 
                id: 'order-2', 
                full_name: 'Trần Thị B', 
                total: 350000, 
                created_at: new Date().toISOString(),
                order_status: 'completed'
              },
              { 
                id: 'order-3', 
                full_name: 'Lê Văn C', 
                total: 150000, 
                created_at: new Date().toISOString(),
                order_status: 'processing'
              },
            ],
            stats: {
              orders: 27,
              products: 32,
              customers: 15,
              revenue: 4750000,
            }
          });
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const stats: DashboardStat[] = [
    {
      title: 'Tổng đơn hàng',
      value: dashboardData.stats.orders,
      icon: <FaShoppingBag className="w-6 h-6" />,
      trend: { value: 12.5, isUp: true },
      color: 'bg-blue-500'
    },
    {
      title: 'Tổng sản phẩm',
      value: dashboardData.stats.products,
      icon: <FaBoxOpen className="w-6 h-6" />,
      color: 'bg-purple-500'
    },
    {
      title: 'Tổng khách hàng',
      value: dashboardData.stats.customers,
      icon: <FaUsers className="w-6 h-6" />,
      trend: { value: 5.2, isUp: true },
      color: 'bg-green-500'
    },
    {
      title: 'Doanh thu',
      value: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(dashboardData.stats.revenue),
      icon: <FaMoneyBillWave className="w-6 h-6" />,
      trend: { value: 8.1, isUp: true },
      color: 'bg-yellow-500'
    }
  ];

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Map các trạng thái đơn hàng sang tiếng Việt và màu sắc
  const orderStatusMap: Record<string, { text: string; color: string }> = {
    pending: { text: 'Chờ xác nhận', color: 'bg-yellow-100 text-yellow-800' },
    confirmed: { text: 'Đã xác nhận', color: 'bg-blue-100 text-blue-800' },
    processing: { text: 'Đang xử lý', color: 'bg-indigo-100 text-indigo-800' },
    shipping: { text: 'Đang giao', color: 'bg-purple-100 text-purple-800' },
    completed: { text: 'Hoàn thành', color: 'bg-green-100 text-green-800' },
    cancelled: { text: 'Đã hủy', color: 'bg-red-100 text-red-800' },
  };

  return (
    <AdminLayout title="Tổng quan">
      <Head>
        <title>Tổng quan - Cloud Shop Admin</title>
        <meta name="description" content="Tổng quan quản trị Cloud Shop" />
      </Head>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <FaSpinner className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : (
        <>
          {/* Thống kê */}
          <div className="grid grid-cols-1 gap-6 mb-6 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <div key={index} className="p-6 bg-white rounded-lg shadow">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                    <p className="text-2xl font-semibold">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.color} text-white`}>
                    {stat.icon}
                  </div>
                </div>
                
                {stat.trend && (
                  <div className="flex items-center text-sm">
                    <span className={`mr-2 ${stat.trend.isUp ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.trend.isUp ? <FaArrowUp /> : <FaArrowDown />}
                    </span>
                    <span className={`font-medium ${stat.trend.isUp ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.trend.value}%
                    </span>
                    <span className="ml-2 text-gray-500">so với tháng trước</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Mini biểu đồ doanh thu (mẫu demo) */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div className="flex items-center gap-2">
                <FaChartLine className="text-primary-600" />
                <h2 className="text-lg font-semibold">Xu hướng doanh thu (demo)</h2>
              </div>
              <a href="/admin/reports" className="text-sm text-primary-600 hover:underline">Xem chi tiết</a>
            </div>
            <div className="h-56 p-4">
              <SalesLineChart
                data={Array.from({length: 10}).map((_,i)=>({
                  date: new Date(Date.now() - (9-i)*86400000).toISOString().slice(0,10),
                  total: 2000000 + Math.random()*1500000,
                  orders: 5 + Math.round(Math.random()*10)
                }))}
                currencyFormatter={(v)=> new Intl.NumberFormat('vi-VN',{style:'currency', currency:'VND'}).format(v)}
                height={180}
              />
            </div>
          </div>

          {/* Đơn hàng gần đây */}
          <div className="bg-white rounded-lg shadow">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">Đơn hàng gần đây</h2>
              <Link href="/admin/orders" className="text-sm text-primary-600 hover:underline">
                Xem tất cả
              </Link>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mã đơn hàng
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Khách hàng
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày đặt
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Giá trị
                    </th>
                    <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dashboardData.recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="font-medium text-gray-900">
                          #{order.id.substring(0, 8)}
                        </span>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        {order.full_name}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(order.created_at)}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${orderStatusMap[order.order_status].color}`}>
                          {orderStatusMap[order.order_status].text}
                        </span>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap text-right text-sm font-medium">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total)}
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap text-center text-sm">
                        <Link href={`/admin/orders/${order.id}`} className="text-primary-600 hover:text-primary-900 mx-1">
                          Chi tiết
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
};

export default AdminDashboard; 