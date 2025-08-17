import { useState, useEffect } from 'react';
import type { NextPage, GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { FaUser, FaShoppingBag, FaEye, FaSearch, FaCalendarAlt } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useAuth } from '../../lib/context/AuthContext';
import { verifyToken } from '../../lib/auth';
import { executeQuery } from '../../lib/db';

// Định nghĩa kiểu dữ liệu Order
interface Order {
  id: string;
  order_status: 'pending' | 'confirmed' | 'processing' | 'shipping' | 'completed' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed';
  payment_method: 'cod' | 'vnpay';
  total: number;
  created_at: string;
  items_count: number;
}

interface OrdersProps {
  initialOrders: Order[];
}

// Map các trạng thái đơn hàng sang tiếng Việt
const orderStatusMap: Record<string, { text: string; color: string; bgColor: string }> = {
  pending: { text: 'Chờ xác nhận', color: 'text-yellow-800', bgColor: 'bg-yellow-100' },
  confirmed: { text: 'Đã xác nhận', color: 'text-blue-800', bgColor: 'bg-blue-100' },
  processing: { text: 'Đang xử lý', color: 'text-indigo-800', bgColor: 'bg-indigo-100' },
  shipping: { text: 'Đang giao', color: 'text-purple-800', bgColor: 'bg-purple-100' },
  completed: { text: 'Hoàn thành', color: 'text-green-800', bgColor: 'bg-green-100' },
  cancelled: { text: 'Đã hủy', color: 'text-red-800', bgColor: 'bg-red-100' },
};

// Map các trạng thái thanh toán sang tiếng Việt
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

const Orders: NextPage<OrdersProps> = ({ initialOrders }) => {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Redirect nếu người dùng chưa đăng nhập
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth/login?returnUrl=/account/orders');
    }
  }, [isAuthenticated, loading, router]);

  // Hàm xử lý tìm kiếm đơn hàng
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  // Hàm lấy dữ liệu đơn hàng
  const fetchOrders = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/account/orders?search=${searchTerm}`);
      
      if (!response.ok) {
        throw new Error('Không thể tải dữ liệu đơn hàng');
      }
      
      const data = await response.json();
      setOrders(data.orders);
      
    } catch (error) {
      toast.error('Có lỗi xảy ra khi tải dữ liệu đơn hàng');
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

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

  if (loading) {
    return (
      <Layout>
        <div className="container-custom my-12 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return null; // Sẽ được chuyển hướng bởi useEffect
  }

  return (
    <Layout>
      <Head>
        <title>Lịch sử đơn hàng - Cloud Shop</title>
        <meta name="description" content="Lịch sử đơn hàng của bạn tại Cloud Shop" />
      </Head>
      
      <div className="container-custom py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Tài khoản của tôi</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="bg-primary-100 rounded-full p-3">
                  <FaUser className="text-primary-600 text-xl" />
                </div>
                <div>
                  <h2 className="font-medium text-lg">{user?.name}</h2>
                  <p className="text-gray-500 text-sm">{user?.email}</p>
                </div>
              </div>
              
              <nav className="space-y-2">
                <Link href="/account" className="block px-4 py-2 rounded-md text-gray-700 hover:bg-gray-50">
                  Thông tin tài khoản
                </Link>
                <Link href="/account/orders" className="block px-4 py-2 rounded-md bg-primary-50 text-primary-700 font-medium">
                  Lịch sử đơn hàng
                </Link>
                <Link href="/account/change-password" className="block px-4 py-2 rounded-md text-gray-700 hover:bg-gray-50">
                  Đổi mật khẩu
                </Link>
              </nav>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center">
                  <FaShoppingBag className="mr-2 text-primary-600" /> 
                  Lịch sử đơn hàng
                </h2>
                
                {/* Form tìm kiếm */}
                <form onSubmit={handleSearch} className="flex">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm kiếm đơn hàng..."
                    className="input-field py-1 px-3 text-sm w-48 md:w-auto"
                  />
                  <button
                    type="submit"
                    className="btn-primary py-1 px-3 ml-2 flex items-center"
                  >
                    <FaSearch className="text-sm" />
                  </button>
                </form>
              </div>
              
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
                </div>
              ) : orders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="py-2 px-4 border-b text-left">Mã đơn hàng</th>
                        <th className="py-2 px-4 border-b text-left">Trạng thái</th>
                        <th className="py-2 px-4 border-b text-center">Số sản phẩm</th>
                        <th className="py-2 px-4 border-b text-right">Tổng tiền</th>
                        <th className="py-2 px-4 border-b text-left">Thanh toán</th>
                        <th className="py-2 px-4 border-b text-center">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id}>
                          <td className="py-2 px-4 border-b">
                            <div className="flex flex-col">
                              <Link href={`/account/orders/${order.id}`} className="font-medium text-primary-600 hover:text-primary-800">
                                #{order.id.substring(0, 8)}
                              </Link>
                              <span className="text-xs text-gray-500">{formatDate(order.created_at)}</span>
                            </div>
                          </td>
                          <td className="py-2 px-4 border-b">
                            <div>
                              <span className={`inline-block px-3 py-1 rounded-md text-xs font-medium ${orderStatusMap[order.order_status].color} ${orderStatusMap[order.order_status].bgColor}`}>
                                {orderStatusMap[order.order_status].text}
                              </span>
                              
                              {/* Chỉ hiển thị trạng thái thanh toán trong các trường hợp cần thiết */}
                              {order.order_status !== 'cancelled' && (
                                order.payment_method === 'vnpay' || order.payment_status === 'paid' ? (
                                  <span className={`inline-block mt-1 px-3 py-1 rounded-md text-xs font-medium ${paymentStatusMap[order.payment_status].color} ${paymentStatusMap[order.payment_status].bgColor}`}>
                                    {paymentStatusMap[order.payment_status].text}
                                  </span>
                                ) : null
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-4 border-b text-center">
                            {order.items_count}
                          </td>
                          <td className="py-2 px-4 border-b text-right font-medium">
                            {order.total.toLocaleString('vi-VN')}đ
                          </td>
                          <td className="py-2 px-4 border-b">
                            <span className="text-sm">{paymentMethodMap[order.payment_method]}</span>
                          </td>
                          <td className="py-2 px-4 border-b text-center">
                            <Link href={`/account/orders/${order.id}`} className="text-primary-600 hover:text-primary-800">
                              <FaEye className="inline-block" /> Xem
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <FaShoppingBag className="mx-auto text-4xl mb-4 text-gray-300" />
                  <p>Bạn chưa có đơn hàng nào</p>
                  <Link href="/menu" className="btn-primary inline-block mt-4 px-4 py-2">
                    Mua sắm ngay
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    // Lấy token từ cookie
    const token = context.req.cookies.auth_token;
    
    // Nếu không có token, chuyển hướng đến trang đăng nhập
    if (!token) {
      return {
        redirect: {
          destination: '/auth/login?returnUrl=/account/orders',
          permanent: false,
        },
      };
    }
    
    // Verify token
    const decodedToken = verifyToken(token);
    
    if (!decodedToken || !decodedToken.id) {
      return {
        redirect: {
          destination: '/auth/login?returnUrl=/account/orders',
          permanent: false,
        },
      };
    }
    
    // Lấy danh sách đơn hàng của người dùng
    const orders = await executeQuery({
      query: `
        SELECT o.id, o.order_status, o.payment_status, o.payment_method, o.total, o.created_at, 
               COUNT(oi.id) as items_count
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.user_id = ?
        GROUP BY o.id
        ORDER BY o.created_at DESC
      `,
      values: [decodedToken.id],
    });
    
    // Xử lý dữ liệu trả về để tránh lỗi serialize Date
    const serializedOrders = JSON.parse(JSON.stringify(orders));

    return {
      props: {
        initialOrders: serializedOrders,
      },
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      props: {
        initialOrders: [],
      },
    };
  }
};

export default Orders; 