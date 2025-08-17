import { useState, useEffect, useCallback } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  FaEye, 
  FaSearch, 
  FaFilter, 
  FaSpinner, 
  FaChevronLeft, 
  FaChevronRight 
} from 'react-icons/fa';
import AdminLayout from '../../../components/Layout/AdminLayout';

interface Order {
  id: string;
  full_name: string;
  phone: string;
  total: number;
  order_status: 'pending' | 'confirmed' | 'processing' | 'shipping' | 'completed' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed';
  payment_method: 'cod' | 'vnpay';
  created_at: string;
}

interface OrdersPageProps {
  initialOrders?: Order[];
  totalCount?: number;
}

const OrdersAdminPage: NextPage<OrdersPageProps> = ({ initialOrders = [], totalCount = 0 }) => {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(totalCount);
  const itemsPerPage = 10;

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

  // Map các phương thức thanh toán sang tiếng Việt
  const paymentMethodMap: Record<string, string> = {
    cod: 'Thanh toán khi nhận hàng',
    vnpay: 'Thanh toán VNPay',
  };

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      let url = `/api/admin/orders?page=${currentPage}&limit=${itemsPerPage}`;
      
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }
      
      if (statusFilter) {
        url += `&status=${encodeURIComponent(statusFilter)}`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders);
        setTotalItems(data.total);
        setTotalPages(Math.ceil(data.total / itemsPerPage));
      } else {
        console.error('Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter]);

  // Fetch orders when dependencies change
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchOrders();
  };

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1);
    // fetchOrders will be called by useEffect
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // fetchOrders will be called by useEffect
  };

  return (
    <AdminLayout title="Quản lý đơn hàng">
      <Head>
        <title>Quản lý đơn hàng - Cloud Shop Admin</title>
        <meta name="description" content="Quản lý đơn hàng - Cloud Shop Admin" />
      </Head>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <form onSubmit={handleSearch} className="flex w-full md:w-auto">
          <div className="relative flex-grow">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm đơn hàng theo mã, tên, SĐT..."
              className="input-field pr-10"
            />
            <button 
              type="submit" 
              className="absolute right-0 top-0 h-full px-3 text-gray-500 hover:text-primary-600"
            >
              <FaSearch />
            </button>
          </div>
        </form>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            <FaFilter className="text-gray-500 mr-2" />
            <select
              value={statusFilter}
              onChange={handleStatusFilterChange}
              className="input-field py-2"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="pending">Chờ xác nhận</option>
              <option value="confirmed">Đã xác nhận</option>
              <option value="processing">Đang xử lý</option>
              <option value="shipping">Đang giao hàng</option>
              <option value="completed">Hoàn thành</option>
              <option value="cancelled">Đã hủy</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Danh sách đơn hàng</h2>
            <p className="text-sm text-gray-600">
              Tổng số: {totalItems} đơn hàng
            </p>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <FaSpinner className="animate-spin text-primary-600 text-2xl" />
            </div>
          ) : orders.length > 0 ? (
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mã đơn hàng
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Khách hàng
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày đặt
                  </th>
                  <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thanh toán
                  </th>
                  <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giá trị
                  </th>
                  <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="font-medium text-gray-900">
                        #{order.id.substring(0, 8)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <div className="font-medium text-gray-900">{order.full_name}</div>
                        <div className="text-sm text-gray-500">{order.phone}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <span 
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${orderStatusMap[order.order_status].bgColor} ${orderStatusMap[order.order_status].color}`}
                      >
                        {orderStatusMap[order.order_status].text}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <div className="flex flex-col items-center text-xs">
                        <span>{paymentMethodMap[order.payment_method]}</span>
                        <span 
                          className={`mt-1 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${paymentStatusMap[order.payment_status].bgColor} ${paymentStatusMap[order.payment_status].color}`}
                        >
                          {paymentStatusMap[order.payment_status].text}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right font-medium">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-primary-600 hover:text-primary-900 mx-1"
                      >
                        <span className="sr-only">Chi tiết</span>
                        <FaEye className="w-5 h-5 inline-block" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex justify-center items-center py-16 text-gray-500">
              Không có đơn hàng nào
            </div>
          )}
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Hiển thị <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> đến <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalItems)}</span> của{' '}
                  <span className="font-medium">{totalItems}</span> kết quả
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border text-sm font-medium ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Previous</span>
                    <FaChevronLeft className="h-4 w-4" />
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageToShow = totalPages <= 5 ? i + 1 : 
                      currentPage <= 3 ? i + 1 : 
                      currentPage >= totalPages - 2 ? totalPages - 4 + i : 
                      currentPage - 2 + i;
                    
                    return (
                      <button
                        key={pageToShow}
                        onClick={() => handlePageChange(pageToShow)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === pageToShow
                            ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageToShow}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border text-sm font-medium ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Next</span>
                    <FaChevronRight className="h-4 w-4" />
                  </button>
                </nav>
              </div>
            </div>
            <div className="flex sm:hidden">
              <button
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Trước
              </button>
              <span className="mx-2 mt-1">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className={`ml-3 relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default OrdersAdminPage; 