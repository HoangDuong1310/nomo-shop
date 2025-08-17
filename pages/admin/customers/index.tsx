import { useState, useEffect, useCallback } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { 
  FaSearch, 
  FaEye, 
  FaSpinner, 
  FaChevronLeft, 
  FaChevronRight,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaShoppingBag
} from 'react-icons/fa';
import AdminLayout from '../../../components/Layout/AdminLayout';
import { toast } from 'react-toastify';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  role: string;
  created_at: string;
  orders_count: number;
  total_spent: number;
}

interface CustomerStats {
  total_customers: number;
  new_customers_this_month: number;
  active_customers: number;
  total_orders: number;
  total_revenue: number;
}

const CustomersAdminPage: NextPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [stats, setStats] = useState<CustomerStats>({
    total_customers: 0,
    new_customers_this_month: 0,
    active_customers: 0,
    total_orders: 0,
    total_revenue: 0,
  });
  const itemsPerPage = 10;

  // Fetch users with pagination, search and stats
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      let url = `/api/admin/customers?page=${currentPage}&limit=${itemsPerPage}`;
      
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setTotalItems(data.total);
        setTotalPages(Math.ceil(data.total / itemsPerPage));
        setStats(data.stats);
      } else {
        toast.error('Không thể tải danh sách khách hàng');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Đã xảy ra lỗi khi tải danh sách khách hàng');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchTerm]);

  // Fetch data when dependencies change
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers();
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // fetchUsers will be called by useEffect
  };

  return (
    <AdminLayout title="Quản lý khách hàng">
      <Head>
        <title>Quản lý khách hàng - Cloud Shop Admin</title>
        <meta name="description" content="Quản lý khách hàng - Cloud Shop Admin" />
      </Head>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm font-medium text-gray-500">Tổng số khách hàng</p>
          <p className="text-2xl font-semibold">{stats.total_customers}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm font-medium text-gray-500">Khách hàng mới tháng này</p>
          <p className="text-2xl font-semibold">{stats.new_customers_this_month}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm font-medium text-gray-500">Khách hàng đã mua hàng</p>
          <p className="text-2xl font-semibold">{stats.active_customers}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm font-medium text-gray-500">Tổng số đơn hàng</p>
          <p className="text-2xl font-semibold">{stats.total_orders}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm font-medium text-gray-500">Tổng doanh thu</p>
          <p className="text-2xl font-semibold">{formatCurrency(stats.total_revenue)}</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex">
          <div className="relative flex-grow">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm khách hàng theo tên, email, số điện thoại..."
              className="input-field pr-10 w-full md:w-80"
            />
            <button 
              type="submit" 
              className="absolute right-0 top-0 h-full px-3 text-gray-500 hover:text-primary-600"
            >
              <FaSearch />
            </button>
          </div>
        </form>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Danh sách khách hàng</h2>
            <p className="text-sm text-gray-600">
              Tổng số: {totalItems} khách hàng
            </p>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <FaSpinner className="animate-spin text-primary-600 text-2xl" />
            </div>
          ) : users.length > 0 ? (
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Khách hàng
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Liên hệ
                  </th>
                  <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày đăng ký
                  </th>
                  <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Đơn hàng
                  </th>
                  <th className="py-3 px-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tổng chi tiêu
                  </th>
                  <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-primary-600 font-semibold">{user.name.charAt(0)}</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.role === 'admin' ? 'Quản trị viên' : 'Khách hàng'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center text-sm text-gray-500">
                          <FaEnvelope className="mr-2 text-gray-400" /> {user.email}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <FaPhone className="mr-2 text-gray-400" /> {user.phone || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center">
                        <FaShoppingBag className="mr-2 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {user.orders_count}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right font-medium">
                      {formatCurrency(user.total_spent)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <Link
                        href={`/admin/customers/${user.id}`}
                        className="text-primary-600 hover:text-primary-900"
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
              Không có khách hàng nào
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

export default CustomersAdminPage;
