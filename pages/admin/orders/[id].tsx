import { useState, useEffect } from 'react';
import { NextPage, GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Image from 'next/image';
import {
  FaArrowLeft,
  FaUser,
  FaPhone,
  FaMapMarkerAlt,
  FaFileAlt,
  FaEdit,
  FaPrint,
  FaCheck,
  FaSpinner,
} from 'react-icons/fa';
import AdminLayout from '../../../components/Layout/AdminLayout';
import { toast } from 'react-toastify';
import { verifyToken } from '../../../lib/auth';
import { executeQuery } from '../../../lib/db';

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

interface Order {
  id: string;
  user_id: string | null;
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

interface OrderDetailProps {
  order: Order | null;
  error?: string;
}

const AdminOrderDetail: NextPage<OrderDetailProps> = ({ order, error }) => {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [orderStatus, setOrderStatus] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<string>('');

  useEffect(() => {
    if (order) {
      setOrderStatus(order.order_status);
      setPaymentStatus(order.payment_status);
    }

    if (error) {
      toast.error(error);
    }
  }, [order, error]);

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

  // Xử lý khi cập nhật trạng thái đơn hàng
  const handleUpdateStatus = async () => {
    if (!order) return;
    
    // Nếu không có thay đổi
    if (orderStatus === order.order_status && paymentStatus === order.payment_status) {
      toast.info('Không có thông tin nào thay đổi');
      return;
    }

    try {
      setIsUpdating(true);

      const response = await fetch('/api/admin/orders/update-status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
          orderStatus,
          paymentStatus,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Không thể cập nhật trạng thái đơn hàng');
      }

      toast.success('Cập nhật trạng thái đơn hàng thành công');
      
      // Reload page để lấy dữ liệu mới
      router.reload();
    } catch (error: any) {
      toast.error(error.message || 'Đã xảy ra lỗi khi cập nhật trạng thái đơn hàng');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!order) {
    return (
      <AdminLayout title="Chi tiết đơn hàng">
        <Head>
          <title>Chi tiết đơn hàng - Cloud Shop Admin</title>
          <meta name="description" content="Chi tiết đơn hàng - Cloud Shop Admin" />
        </Head>
        <div className="text-center py-12">
          <div className="text-lg text-gray-600">Không tìm thấy thông tin đơn hàng</div>
          <Link href="/admin/orders" className="mt-4 inline-block text-primary-600 hover:underline">
            ← Quay lại danh sách đơn hàng
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Chi tiết đơn hàng">
      <Head>
        <title>Chi tiết đơn hàng #{order.id.substring(0, 8)} - Cloud Shop Admin</title>
        <meta name="description" content={`Chi tiết đơn hàng #${order.id.substring(0, 8)} - Cloud Shop Admin`} />
      </Head>

      {/* Breadcrumb và buttons */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4 print:hidden">
        <div>
          <Link href="/admin/orders" className="inline-flex items-center text-primary-600 hover:underline">
            <FaArrowLeft className="mr-1" /> Danh sách đơn hàng
          </Link>
          <h1 className="text-2xl font-semibold mt-2">Đơn hàng #{order.id.substring(0, 8)}</h1>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={handlePrint}
            className="btn-outline flex items-center"
          >
            <FaPrint className="mr-2" /> In đơn
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Thông tin đơn hàng */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Thông tin đơn hàng</h2>
            <span className="text-sm text-gray-500">
              {formatDate(order.created_at)}
            </span>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-x-4">
              <div className="text-sm text-gray-500">Mã đơn hàng:</div>
              <div className="text-sm font-medium">{order.id}</div>
            </div>
            <div className="grid grid-cols-2 gap-x-4">
              <div className="text-sm text-gray-500">Phương thức thanh toán:</div>
              <div className="text-sm font-medium">{paymentMethodMap[order.payment_method]}</div>
            </div>
            <div className="border-t pt-3 mt-3">
              <div className="text-sm text-gray-500 mb-2">Trạng thái hiện tại:</div>
              <div className="flex flex-wrap gap-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${orderStatusMap[order.order_status].bgColor} ${orderStatusMap[order.order_status].color}`}>
                  {orderStatusMap[order.order_status].text}
                </span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${paymentStatusMap[order.payment_status].bgColor} ${paymentStatusMap[order.payment_status].color}`}>
                  {paymentStatusMap[order.payment_status].text}
                </span>
              </div>
              {order.cancel_reason && (
                <div className="mt-2 text-sm">
                  <div className="text-gray-500">Lý do hủy:</div>
                  <div className="font-medium text-red-600">{order.cancel_reason}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Thông tin khách hàng */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Thông tin khách hàng</h2>
          <div className="space-y-3">
            <div className="flex">
              <FaUser className="text-primary-600 mr-2 mt-1 flex-shrink-0" />
              <div>
                <p className="font-medium">Họ tên:</p>
                <p>{order.full_name}</p>
              </div>
            </div>
            <div className="flex">
              <FaPhone className="text-primary-600 mr-2 mt-1 flex-shrink-0" />
              <div>
                <p className="font-medium">Số điện thoại:</p>
                <p>{order.phone}</p>
              </div>
            </div>
            <div className="flex">
              <FaMapMarkerAlt className="text-primary-600 mr-2 mt-1 flex-shrink-0" />
              <div>
                <p className="font-medium">Địa chỉ giao hàng:</p>
                <p>{order.address}</p>
              </div>
            </div>
            {order.note && (
              <div className="flex">
                <FaFileAlt className="text-primary-600 mr-2 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-medium">Ghi chú:</p>
                  <p className="text-gray-600">{order.note}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cập nhật trạng thái đơn hàng */}
        <div className="bg-white rounded-lg shadow p-6 print:hidden">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <FaEdit className="mr-2 text-primary-600" />
            Cập nhật trạng thái
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trạng thái đơn hàng:
              </label>
              <select
                value={orderStatus}
                onChange={(e) => setOrderStatus(e.target.value)}
                disabled={isUpdating}
                className="input-field"
              >
                <option value="pending">Chờ xác nhận</option>
                <option value="confirmed">Đã xác nhận</option>
                <option value="processing">Đang xử lý</option>
                <option value="shipping">Đang giao hàng</option>
                <option value="completed">Hoàn thành</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trạng thái thanh toán:
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                disabled={isUpdating}
                className="input-field"
              >
                <option value="pending">Chờ thanh toán</option>
                <option value="paid">Đã thanh toán</option>
                <option value="failed">Thanh toán thất bại</option>
              </select>
            </div>
            <div className="pt-3 border-t mt-3">
              <button
                onClick={handleUpdateStatus}
                disabled={isUpdating}
                className="w-full btn-primary flex items-center justify-center"
              >
                {isUpdating ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Đang cập nhật...
                  </>
                ) : (
                  <>
                    <FaCheck className="mr-2" />
                    Cập nhật trạng thái
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Thông tin thanh toán */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Chi tiết thanh toán</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="py-2 text-gray-500">Tổng giá trị sản phẩm:</td>
                  <td className="py-2 text-right font-medium">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.subtotal)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 text-gray-500">Phí vận chuyển:</td>
                  <td className="py-2 text-right font-medium">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.shipping_fee)}
                  </td>
                </tr>
                {order.discount > 0 && (
                  <tr>
                    <td className="py-2 text-gray-500">Giảm giá:</td>
                    <td className="py-2 text-right font-medium text-green-600">
                      -{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.discount)}
                    </td>
                  </tr>
                )}
                <tr className="border-t">
                  <td className="py-2 text-gray-900 font-medium">Tổng thanh toán:</td>
                  <td className="py-2 text-right text-lg font-semibold text-primary-600">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.total)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Danh sách sản phẩm */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Sản phẩm đã đặt</h2>
          <p className="text-sm text-gray-500">{order.items.length} sản phẩm trong đơn hàng</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sản phẩm
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Giá
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số lượng
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thành tiền
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 relative bg-gray-100">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.product_name}
                            fill
                            sizes="64px"
                            className="object-cover object-center"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-gray-400">
                            No image
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{item.product_name}</div>
                        {item.product_option && (
                          <div className="text-sm text-gray-500">{item.product_option}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={3} className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                  Tổng giá trị sản phẩm:
                </td>
                <td className="px-6 py-3 text-right text-sm font-medium">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.subtotal)}
                </td>
              </tr>
            </tfoot>
          </table>
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
    
    // Lấy thông tin đơn hàng
    const orderResult = await executeQuery({
      query: `SELECT * FROM orders WHERE id = ?`,
      values: [id],
    });
    
    if ((orderResult as any[]).length === 0) {
      return {
        props: {
          order: null,
          error: 'Không tìm thấy đơn hàng',
        },
      };
    }
    
    const order = (orderResult as any[])[0];
    
    // Lấy danh sách sản phẩm trong đơn hàng
    const orderItemsResult = await executeQuery({
      query: `
        SELECT oi.*, p.image 
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?
      `,
      values: [id],
    });
    
    // Kết hợp đơn hàng và danh sách sản phẩm
    const orderWithItems = {
      ...order,
      items: orderItemsResult,
    };
    
    // Xử lý dữ liệu để tránh lỗi serialize Date
    const serializedData = JSON.parse(JSON.stringify(orderWithItems));
    
    return {
      props: {
        order: serializedData,
      },
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      props: {
        order: null,
        error: 'Có lỗi xảy ra khi tải thông tin đơn hàng',
      },
    };
  }
};

export default AdminOrderDetail; 