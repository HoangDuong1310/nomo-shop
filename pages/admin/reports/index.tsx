import { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { 
  FaChartLine, 
  FaChartBar, 
  FaCalendarAlt, 
  FaSpinner, 
  FaBoxOpen,
  FaShoppingBag,
  FaUsers
} from 'react-icons/fa';
import AdminLayout from '../../../components/Layout/AdminLayout';

interface SalesData {
  date: string;
  total: number;
  orders: number;
}

interface ProductPerformance {
  id: string;
  name: string;
  total_sold: number;
  revenue: number;
}

interface CustomerStats {
  total_customers: number;
  new_customers: number;
  repeat_customers: number;
  avg_order_value: number;
}

interface ReportData {
  sales: SalesData[];
  products: ProductPerformance[];
  customers: CustomerStats;
}

const ReportsPage: NextPage = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [reportData, setReportData] = useState<ReportData>({
    sales: [],
    products: [],
    customers: {
      total_customers: 0,
      new_customers: 0,
      repeat_customers: 0,
      avg_order_value: 0
    }
  });
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year'>('week');

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  };

  useEffect(() => {
    let cancelled = false;
    const fetchReportData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/admin/reports?range=${dateRange}`, {
          credentials: 'include'
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        if (cancelled) return;

        // Normalise data shapes (phòng trường hợp API trả chuỗi)
        const sales = (data.sales || []).map((d: any) => ({
          date: d.date || d.created_at || new Date().toISOString(),
            // API trả date dạng 'YYYY-MM-DD' => giữ nguyên (formatDate xử lý)
          total: Number(d.total) || 0,
          orders: Number(d.orders) || 0
        }));
        const products = (data.products || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          total_sold: Number(p.total_sold) || 0,
          revenue: Number(p.revenue) || 0
        }));
        const customers = {
          total_customers: Number(data.customers?.total_customers) || 0,
          new_customers: Number(data.customers?.new_customers) || 0,
          repeat_customers: Number(data.customers?.repeat_customers) || 0,
          avg_order_value: Number(data.customers?.avg_order_value) || 0
        };

        setReportData({ sales, products, customers });
      } catch (error) {
        if (!cancelled) {
          console.error('Error fetching report data:', error);
          // Giữ nguyên state cũ nhưng tắt loading
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    fetchReportData();
    return () => {
      cancelled = true;
    };
  }, [dateRange]);

  return (
    <AdminLayout title="Báo cáo">
      <Head>
        <title>Báo cáo - Cloud Shop Admin</title>
        <meta name="description" content="Báo cáo doanh thu và hoạt động - Cloud Shop Admin" />
      </Head>

      {/* Date Range Selector */}
      <div className="flex mb-6 bg-white p-4 rounded-lg shadow">
        <div className="flex space-x-2 items-center">
          <FaCalendarAlt className="text-gray-500" />
          <span className="text-gray-700 font-medium">Khoảng thời gian:</span>
        </div>
        <div className="flex ml-4 space-x-2">
          <button 
            onClick={() => setDateRange('week')}
            className={`px-4 py-1 rounded-md ${dateRange === 'week' ? 'bg-primary-100 text-primary-700 font-medium' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Tuần này
          </button>
          <button 
            onClick={() => setDateRange('month')}
            className={`px-4 py-1 rounded-md ${dateRange === 'month' ? 'bg-primary-100 text-primary-700 font-medium' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Tháng này
          </button>
          <button 
            onClick={() => setDateRange('year')}
            className={`px-4 py-1 rounded-md ${dateRange === 'year' ? 'bg-primary-100 text-primary-700 font-medium' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Năm nay
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <FaSpinner className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Sales Overview */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b">
              <div className="flex items-center">
                <FaChartLine className="text-primary-600 mr-2" />
                <h2 className="text-lg font-semibold">Doanh thu</h2>
              </div>
            </div>

            <div className="p-6">
              {/* Sales Chart */}
              <div className="h-64 mb-8 border border-gray-200 rounded-lg p-4">
                {/* In a real application, this would be a chart component */}
                {reportData.sales.length === 0 ? (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">Chưa có dữ liệu</div>
                ) : (
                  <div className="flex h-full items-end space-x-2">
                    {(() => {
                      const maxTotal = Math.max(...reportData.sales.map(s => s.total), 1);
                      return reportData.sales.map((day, index) => {
                        const height = (day.total / maxTotal) * 100; // scale theo max thực tế
                        return (
                          <div key={index} className="flex flex-col items-center flex-1">
                            <div
                              className="bg-primary-500 hover:bg-primary-600 rounded-t w-full transition-all duration-200"
                              style={{ height: `${height}%` }}
                              title={`${formatCurrency(day.total)} - ${day.orders} đơn hàng`}
                            ></div>
                            <div className="text-xs mt-2 text-gray-600">
                              {formatDate(day.date)}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </div>

              {/* Sales Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center mb-2">
                    <FaShoppingBag className="text-blue-500 mr-2" />
                    <h3 className="font-medium text-gray-700">Tổng đơn hàng</h3>
                  </div>
                  <p className="text-2xl font-semibold text-gray-900">
                    {reportData.sales.reduce((sum, day) => sum + day.orders, 0)}
                  </p>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center mb-2">
                    <FaChartBar className="text-green-500 mr-2" />
                    <h3 className="font-medium text-gray-700">Tổng doanh thu</h3>
                  </div>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(reportData.sales.reduce((sum, day) => sum + day.total, 0))}
                  </p>
                </div>
                
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center mb-2">
                    <FaUsers className="text-purple-500 mr-2" />
                    <h3 className="font-medium text-gray-700">Giá trị trung bình</h3>
                  </div>
                  <p className="text-2xl font-semibold text-gray-900">
                    {formatCurrency(reportData.customers.avg_order_value)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Product Performance */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b">
              <div className="flex items-center">
                <FaBoxOpen className="text-primary-600 mr-2" />
                <h2 className="text-lg font-semibold">Hiệu suất sản phẩm</h2>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sản phẩm
                    </th>
                    <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Số lượng đã bán
                    </th>
                    <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Doanh thu
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">{product.name}</span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                        {product.total_sold}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-medium">
                        {formatCurrency(product.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Customer Statistics */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b">
              <div className="flex items-center">
                <FaUsers className="text-primary-600 mr-2" />
                <h2 className="text-lg font-semibold">Thống kê khách hàng</h2>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-700 mb-2">Tổng khách hàng</h3>
                  <p className="text-2xl font-semibold text-gray-900">{reportData.customers.total_customers}</p>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-medium text-gray-700 mb-2">Khách hàng mới</h3>
                  <p className="text-2xl font-semibold text-gray-900">{reportData.customers.new_customers}</p>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-gray-700 mb-2">Khách hàng quay lại</h3>
                  <p className="text-2xl font-semibold text-gray-900">{reportData.customers.repeat_customers}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default ReportsPage; 