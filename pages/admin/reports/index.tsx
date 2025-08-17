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
    const fetchReportData = async () => {
      setIsLoading(true);
      try {
        // In a real application, this would be an API call
        // const response = await fetch(`/api/admin/reports?range=${dateRange}`);
        // const data = await response.json();
        // setReportData(data);
        
        // For now, using mock data
        setTimeout(() => {
          const mockSalesData = [];
          const today = new Date();
          
          // Generate mock sales data
          for (let i = 13; i >= 0; i--) {
            const date = new Date();
            date.setDate(today.getDate() - i);
            mockSalesData.push({
              date: date.toISOString(),
              total: Math.floor(Math.random() * 5000000) + 500000,
              orders: Math.floor(Math.random() * 10) + 1
            });
          }
          
          setReportData({
            sales: mockSalesData,
            products: [
              { id: 'prod1', name: 'Cà phê đen', total_sold: 120, revenue: 2400000 },
              { id: 'prod2', name: 'Cà phê sữa', total_sold: 150, revenue: 3750000 },
              { id: 'prod3', name: 'Bạc xỉu', total_sold: 95, revenue: 2375000 },
              { id: 'prod4', name: 'Trà sữa trân châu', total_sold: 85, revenue: 2550000 },
              { id: 'prod5', name: 'Trà đào cam sả', total_sold: 78, revenue: 1950000 },
            ],
            customers: {
              total_customers: 87,
              new_customers: 15,
              repeat_customers: 72,
              avg_order_value: 250000
            }
          });
          setIsLoading(false);
        }, 800);
      } catch (error) {
        console.error('Error fetching report data:', error);
        setIsLoading(false);
      }
    };

    fetchReportData();
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
                <div className="flex h-full items-end space-x-2">
                  {reportData.sales.map((day, index) => {
                    const height = (day.total / 5000000) * 100; // Scale for visualization
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
                  })}
                </div>
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