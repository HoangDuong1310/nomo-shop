import { useEffect, useState } from 'react';
import type { NextPage, GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Layout from '../../../components/Layout';
import { 
  FaUser, 
  FaArrowLeft, 
  FaMapMarkerAlt, 
  FaPhone, 
  FaFileAlt, 
  FaTruck, 
  FaMoneyBillWave, 
  FaCalendarAlt,
  FaTimes,
  FaExclamationTriangle
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useAuth } from '../../../lib/context/AuthContext';
import { verifyToken } from '../../../lib/auth';
import { executeQuery } from '../../../lib/db';

// Định nghĩa kiểu dữ liệu Order
interface Order {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  address: string;
  note: string | null;
  subtotal: number;
  shipping_fee: number;
  discount: number;
  total: number;
  payment_method: 'cod' | 'vnpay';
  payment_status: 'pending' | 'paid' | 'failed';
  order_status: 'pending' | 'confirmed' | 'processing' | 'shipping' | 'completed' | 'cancelled';
  cancel_reason: string | null;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
}

// Định nghĩa kiểu dữ liệu OrderItem
interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  product_option: string | null;
  price: number;
  quantity: number;
  subtotal: number;
  image: string;
}

// Props của component
interface OrderDetailProps {
  orderData: Order | null;
  allowCancel?: boolean;
  error?: string;
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
const paymentMethodMap: Record<string, { text: string; icon: typeof FaMoneyBillWave }> = {
  cod: { text: 'Thanh toán khi nhận hàng', icon: FaMoneyBillWave },
  vnpay: { text: 'Thanh toán VNPay', icon: FaMoneyBillWave },
};

const OrderDetail: NextPage<OrderDetailProps> = ({ orderData, allowCancel = false, error }) => {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const [order, setOrder] = useState<Order | null>(orderData);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  // Redirect nếu người dùng chưa đăng nhập
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth/login?returnUrl=' + encodeURIComponent(router.asPath));
    }
  }, [isAuthenticated, loading, router]);

  // Hiển thị thông báo lỗi nếu có
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Hàm xử lý việc hủy đơn hàng
  const handleCancelOrder = async () => {
    if (!order) return;

    try {
      setIsCancelling(true);
      const response = await fetch('/api/orders/cancel', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
          cancelReason: cancelReason,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Không thể hủy đơn hàng');
      }

      // Cập nhật state của order để hiển thị trạng thái mới
      setOrder({
        ...order,
        order_status: 'cancelled',
        cancel_reason: cancelReason || 'Hủy bởi khách hàng',
      });
      
      toast.success('Đơn hàng đã được hủy thành công');
      setShowCancelModal(false);
    } catch (error: any) {
      toast.error(error.message || 'Đã xảy ra lỗi khi hủy đơn hàng');
    } finally {
      setIsCancelling(false);
    }
  };

  // Render actions
  const renderActions = () => {
    return (
      <div className="mt-8 flex justify-between">
        <Link href={isAuthenticated ? "/account/orders" : "/"} className="btn-outline px-6 py-2">
          {isAuthenticated ? "Quay lại danh sách đơn hàng" : "Quay lại mua sắm"}
        </Link>
        
        {(allowCancel && order?.order_status === 'pending') && (
          <button 
            onClick={() => setShowCancelModal(true)}
            className="btn-outline border-red-500 text-red-600 hover:bg-red-50 px-6 py-2"
          >
            Hủy đơn hàng
          </button>
        )}
        
        {order?.order_status === 'completed' && (
          <button 
            onClick={() => router.push('/menu')}
            className="btn-primary px-6 py-2"
          >
            Đặt lại
          </button>
        )}
      </div>
    );
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

  if (!order) {
    return (
      <Layout>
        <div className="container-custom my-12 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">Không tìm thấy thông tin đơn hàng</h2>
            <p className="mb-6">Đơn hàng không tồn tại hoặc bạn không có quyền truy cập.</p>
            <Link href="/" className="btn-primary px-6 py-2">
              Quay lại trang chủ
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  // Component tạo icon cho phương thức thanh toán
  const PaymentMethodIcon = order.payment_method ? paymentMethodMap[order.payment_method].icon : FaMoneyBillWave;

  return (
    <Layout>
      <Head>
        <title>Chi tiết đơn hàng #{order.id.substring(0, 8)} - Cloud Shop</title>
        <meta name="description" content={`Chi tiết đơn hàng #${order.id.substring(0, 8)} tại Cloud Shop`} />
      </Head>
      
      <div className="container-custom py-8">
        {/* Nút quay lại và tiêu đề */}
        <div className="flex items-center justify-between mb-6">
          <Link href={isAuthenticated ? "/account/orders" : "/"} className="flex items-center text-primary-600 hover:text-primary-800">
            <FaArrowLeft className="mr-2" /> {isAuthenticated ? "Quay lại danh sách đơn hàng" : "Quay lại trang chủ"}
          </Link>
          <div className="flex items-center space-x-2">
            <FaCalendarAlt className="text-gray-500" />
            <span className="text-gray-500">Ngày đặt: {formatDate(order.created_at)}</span>
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
          <FaFileAlt className="mr-2 text-primary-600" />
          Chi tiết đơn hàng #{order.id.substring(0, 8)}
        </h1>
        
        {/* Thông tin tổng quan */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Trạng thái đơn hàng */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Trạng thái đơn hàng</h2>
            <div className={`${orderStatusMap[order.order_status].bgColor} ${orderStatusMap[order.order_status].color} py-2 px-4 rounded-md mb-3 font-medium text-center`}>
              {orderStatusMap[order.order_status].text}
            </div>
            
            {/* Chỉ hiển thị trạng thái thanh toán trong các trường hợp cần thiết */}
            {order.order_status !== 'cancelled' && (
              order.payment_method === 'vnpay' || order.payment_status === 'paid' ? (
                <div className={`${paymentStatusMap[order.payment_status].bgColor} ${paymentStatusMap[order.payment_status].color} py-2 px-4 rounded-md font-medium text-center mt-3`}>
                  {paymentStatusMap[order.payment_status].text}
                </div>
              ) : null
            )}
            
            {order.order_status === 'cancelled' && order.cancel_reason && (
              <div className="mt-4 p-3 bg-gray-100 rounded-md">
                <p className="text-sm font-medium">Lý do hủy:</p>
                <p className="text-sm text-gray-600">{order.cancel_reason}</p>
              </div>
            )}
          </div>
          
          {/* Thông tin thanh toán */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Thông tin thanh toán</h2>
            <div className="flex items-center mb-3">
              <PaymentMethodIcon className="text-primary-600 mr-2" />
              <span className="font-medium">{paymentMethodMap[order.payment_method].text}</span>
            </div>
            
            {/* Trạng thái thanh toán khi là vnpay hoặc đã thanh toán */}
            {(order.payment_method === 'vnpay' || order.payment_status === 'paid') && (
              <div className={`flex items-center mb-3 ${order.order_status === 'cancelled' ? 'text-gray-500' : ''}`}>
                <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                  order.order_status === 'cancelled' ? 'bg-gray-400' :
                  order.payment_status === 'paid' ? 'bg-green-500' : 
                  order.payment_status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                }`}></span>
                <span>
                  {order.order_status === 'cancelled' 
                    ? 'Thanh toán đã hủy' 
                    : paymentStatusMap[order.payment_status].text}
                </span>
              </div>
            )}
            
            {/* Chi tiết giá trị đơn hàng */}
            <div className="border-t pt-3">
              <div className="flex justify-between mb-1">
                <span>Tổng giá trị sản phẩm:</span>
                <span>{order.subtotal.toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Phí giao hàng:</span>
                <span>{order.shipping_fee.toLocaleString('vi-VN')}đ</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between mb-1 text-green-600">
                  <span>Giảm giá:</span>
                  <span>-{order.discount.toLocaleString('vi-VN')}đ</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t">
                <span>Tổng thanh toán:</span>
                <span className={order.order_status === 'cancelled' ? 'text-gray-600' : 'text-primary-600'}>
                  {order.total.toLocaleString('vi-VN')}đ
                </span>
              </div>
              
              {/* Thông tin thanh toán cho đơn hàng đã hủy */}
              {order.order_status === 'cancelled' && (
                <div className="mt-3 p-2 bg-gray-100 text-gray-700 text-sm rounded">
                  <p>Đơn hàng đã bị hủy nên không cần thanh toán.</p>
                </div>
              )}
              
              {/* Thông tin thanh toán cho COD */}
              {order.payment_method === 'cod' && order.order_status !== 'cancelled' && (
                <div className="mt-3 p-2 bg-blue-50 text-blue-800 text-sm rounded">
                  <p>Vui lòng thanh toán khi nhận hàng.</p>
                </div>
              )}
              
              {/* Thông tin thanh toán cho VNPay khi chưa thanh toán */}
              {order.payment_method === 'vnpay' && order.payment_status === 'pending' && order.order_status !== 'cancelled' && (
                <div className="mt-3 p-2 bg-yellow-50 text-yellow-800 text-sm rounded">
                  <p>Vui lòng hoàn tất thanh toán để xử lý đơn hàng.</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Thông tin giao hàng */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Thông tin giao hàng</h2>
            <div className="space-y-3">
              <div className="flex">
                <FaUser className="text-primary-600 mr-2 mt-1" />
                <div>
                  <p className="font-medium">Người nhận:</p>
                  <p>{order.full_name}</p>
                </div>
              </div>
              <div className="flex">
                <FaPhone className="text-primary-600 mr-2 mt-1" />
                <div>
                  <p className="font-medium">Số điện thoại:</p>
                  <p>{order.phone}</p>
                </div>
              </div>
              <div className="flex">
                <FaMapMarkerAlt className="text-primary-600 mr-2 mt-1" />
                <div>
                  <p className="font-medium">Địa chỉ giao hàng:</p>
                  <p>{order.address}</p>
                </div>
              </div>
              {order.note && (
                <div className="flex">
                  <FaFileAlt className="text-primary-600 mr-2 mt-1" />
                  <div>
                    <p className="font-medium">Ghi chú:</p>
                    <p>{order.note}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Danh sách sản phẩm */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 pb-4">
            <h2 className="text-lg font-semibold mb-2">Danh sách sản phẩm</h2>
            <p className="text-gray-500">{order.items.length} sản phẩm trong đơn hàng</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-6 text-left">Sản phẩm</th>
                  <th className="py-3 px-6 text-center">Giá</th>
                  <th className="py-3 px-6 text-center">Số lượng</th>
                  <th className="py-3 px-6 text-right">Thành tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {order.items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 relative">
                          <Image
                            src={item.image || '/images/placeholder.jpg'}
                            alt={item.product_name}
                            fill
                            sizes="64px"
                            className="object-cover object-center"
                          />
                        </div>
                        <div className="ml-4">
                          <Link href={`/product/${item.product_id}`} className="font-medium text-gray-900 hover:text-primary-600">
                            {item.product_name}
                          </Link>
                          {item.product_option && (
                            <p className="text-gray-500 text-sm">{item.product_option}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      {item.price.toLocaleString('vi-VN')}đ
                    </td>
                    <td className="py-4 px-6 text-center">
                      {item.quantity}
                    </td>
                    <td className="py-4 px-6 text-right font-medium">
                      {item.subtotal.toLocaleString('vi-VN')}đ
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={3} className="py-3 px-6 text-right font-medium">Tổng cộng:</td>
                  <td className="py-3 px-6 text-right font-bold text-primary-600">
                    {order.subtotal.toLocaleString('vi-VN')}đ
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
        
        {/* Actions */}
        {renderActions()}
      </div>

      {/* Modal xác nhận hủy đơn hàng */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Xác nhận hủy đơn hàng</h3>
              <button 
                onClick={() => setShowCancelModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center mb-4 p-3 bg-yellow-50 text-yellow-800 rounded-md">
                <FaExclamationTriangle className="mr-2 text-yellow-600" />
                <p className="text-sm">Bạn chắc chắn muốn hủy đơn hàng này? Hành động này không thể hoàn tác.</p>
              </div>
              
              <label className="block text-gray-700 font-medium mb-2">
                Lý do hủy đơn hàng (tùy chọn)
              </label>
              <textarea 
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="input-field min-h-[100px] w-full"
                placeholder="Nhập lý do hủy đơn hàng..."
              ></textarea>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setShowCancelModal(false)}
                className="btn-outline px-4 py-2"
                disabled={isCancelling}
              >
                Không hủy
              </button>
              <button 
                onClick={handleCancelOrder}
                className="btn-danger px-4 py-2 flex items-center"
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <>
                    <span className="animate-spin h-4 w-4 border-t-2 border-b-2 border-white rounded-full mr-2"></span>
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  'Xác nhận hủy'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    // Lấy ID từ URL
    const { id } = context.params || {};
    
    // Lấy token từ cookie
    const token = context.req.cookies.auth_token;
    
    // Biến để kiểm tra xem đơn hàng có thuộc người dùng hiện tại không
    let belongsToCurrentUser = false;
    
    if (token) {
      // Verify token
      try {
        const decodedToken = verifyToken(token);
        if (decodedToken && decodedToken.id) {
          // Kiểm tra xem đơn hàng có thuộc người dùng hiện tại không
          const userOrderResult = await executeQuery({
            query: `
              SELECT id FROM orders
              WHERE id = ? AND user_id = ?
            `,
            values: [id, decodedToken.id],
          });
          
          belongsToCurrentUser = (userOrderResult as any[]).length > 0;
        }
      } catch (error) {
        console.error('Token verification error:', error);
      }
    }

    // Truy vấn thông tin đơn hàng từ cơ sở dữ liệu
    // Nếu người dùng đăng nhập và đơn hàng thuộc về họ, hoặc
    // Nếu id đơn hàng được truyền trong query parameters (từ trang checkout)
    const orderResult = await executeQuery({
      query: `
        SELECT * FROM orders
        WHERE id = ? ${belongsToCurrentUser ? 'AND user_id = ?' : ''}
      `,
      values: belongsToCurrentUser ? [id, token ? verifyToken(token).id : null] : [id],
    });
    
    // Nếu không tìm thấy đơn hàng hoặc đơn hàng không thuộc về người dùng hiện tại
    if ((orderResult as any[]).length === 0) {
      return {
        props: {
          orderData: null,
          error: 'Không tìm thấy đơn hàng hoặc bạn không có quyền xem đơn hàng này',
        },
      };
    }
    
    const order = (orderResult as any[])[0];
    
    // Lấy thông tin chi tiết đơn hàng
    const orderItemsResult = await executeQuery({
      query: `
        SELECT oi.*, p.image
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `,
      values: [id],
    });
    
    // Chuẩn bị dữ liệu trả về
    const orderWithItems = {
      ...order,
      items: orderItemsResult,
    };
    
    // Xử lý dữ liệu trả về để tránh lỗi serialize Date
    const serializedOrder = JSON.parse(JSON.stringify(orderWithItems));

    return {
      props: {
        orderData: serializedOrder,
        allowCancel: belongsToCurrentUser, // Chỉ cho phép hủy đơn hàng nếu thuộc người dùng hiện tại
      },
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      props: {
        orderData: null,
        error: 'Đã xảy ra lỗi khi tải thông tin đơn hàng',
      },
    };
  }
};

export default OrderDetail; 