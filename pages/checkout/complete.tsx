import { useState, useEffect, useRef } from 'react';
import type { NextPage, GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { FaCheckCircle, FaClipboard, FaArrowRight, FaHome, FaShoppingBag, FaPhone, FaComments } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { executeQuery } from '../../lib/db';
import { useCart } from '../../lib/context/CartContext';

interface OrderSummary {
  id: string;
  full_name: string;
  phone: string;
  address: string;
  note?: string;
  total: number;
  shipping_fee: number;
  discount: number;
  order_status: 'pending' | 'confirmed' | 'processing' | 'shipping' | 'completed' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed';
  payment_method: 'cod' | 'vnpay';
  created_at: string;
}

interface CompleteProps {
  order: OrderSummary | null;
  orderItems: any[];
  error?: string;
}

// Map trạng thái đơn hàng sang tiếng Việt
const orderStatusMap: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  processing: 'Đang xử lý',
  shipping: 'Đang giao hàng',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

// Map trạng thái thanh toán sang tiếng Việt
const paymentStatusMap: Record<string, string> = {
  pending: 'Chờ thanh toán',
  paid: 'Đã thanh toán',
  failed: 'Thanh toán thất bại',
};

// Map phương thức thanh toán sang tiếng Việt
const paymentMethodMap: Record<string, string> = {
  cod: 'Thanh toán khi nhận hàng',
  vnpay: 'Thanh toán VNPay',
};

const Complete: React.FC<CompleteProps> = ({ order, orderItems, error }) => {
  const router = useRouter();
  const { clearCart } = useCart();
  const [copied, setCopied] = useState(false);
  const hasCartBeenCleared = useRef(false);

  // Clear cart chỉ một lần duy nhất khi component mount
  useEffect(() => {
    if (!hasCartBeenCleared.current) {
      clearCart();
      hasCartBeenCleared.current = true;
    }
  }, []); // Không có dependency để tránh re-run

  // Hiển thị lỗi nếu có
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // Hàm xử lý sao chép mã đơn hàng
  const handleCopyOrderId = () => {
    if (order) {
      navigator.clipboard.writeText(order.id);
      setCopied(true);
      toast.success('Đã sao chép mã đơn hàng');
      
      // Đặt lại trạng thái copied sau 3 giây
      setTimeout(() => setCopied(false), 3000);
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

  // Ước tính thời gian giao hàng (giả định 30 phút chuẩn bị + 20 phút giao hàng)
  const estimateDeliveryTime = (dateString: string) => {
    const orderDate = new Date(dateString);
    const deliveryTime = new Date(orderDate.getTime() + 50 * 60 * 1000); // 50 phút
    
    return new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(deliveryTime);
  };

  if (!order) {
    return (
      <Layout>
        <div className="container-custom py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Không tìm thấy thông tin đơn hàng</h1>
            <p className="text-gray-600 mb-8">Đơn hàng không tồn tại hoặc đã bị xóa</p>
            <div className="flex justify-center space-x-4">
              <Link href="/" className="btn-primary px-6 py-2">
                <FaHome className="mr-2 inline-block" /> Trang chủ
              </Link>
              <Link href="/menu" className="btn-outline px-6 py-2">
                <FaShoppingBag className="mr-2 inline-block" /> Tiếp tục mua sắm
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Đặt hàng thành công - Cloud Shop</title>
        <meta name="description" content="Đơn hàng của bạn đã được đặt thành công" />
      </Head>
      
      <div className="container-custom py-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6 animate-bounce">
              <FaCheckCircle className="text-green-600 text-4xl animate-pulse" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">🎉 Cảm ơn bạn đã đặt hàng!</h1>
            <p className="text-lg text-gray-600">Đơn hàng của bạn đã được nhận và đang được xử lý</p>
            <div className="inline-block bg-green-50 text-green-800 px-4 py-2 rounded-full text-sm font-medium mt-3">
              ⏰ Dự kiến giao hàng trong 30-50 phút
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
            {/* Thông tin đơn hàng */}
            <div className="p-6 border-b">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Thông tin đơn hàng</h2>
                <div className="flex items-center text-sm">
                  <span className="text-gray-600">Thời gian đặt: {formatDate(order.created_at)}</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <span className="w-32 text-gray-600">Mã đơn hàng:</span>
                  <div className="flex items-center">
                    <span className="font-medium">{order.id.substring(0, 8)}...</span>
                    <button 
                      onClick={handleCopyOrderId}
                      className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors"
                      title="Sao chép mã đơn hàng"
                    >
                      <FaClipboard className={copied ? "text-green-600" : "text-gray-400"} />
                    </button>
                  </div>
                </div>
                
                <div className="flex">
                  <span className="w-32 text-gray-600">Trạng thái:</span>
                  <span className="font-medium">
                    {orderStatusMap[order.order_status]} 
                    {order.payment_method === 'cod' && order.payment_status === 'pending' && 
                      " (Thanh toán khi nhận hàng)"}
                  </span>
                </div>
                
                <div className="flex">
                  <span className="w-32 text-gray-600">Thanh toán:</span>
                  <span className="font-medium">
                    {paymentMethodMap[order.payment_method]} 
                    {order.payment_method === 'vnpay' && ` - ${paymentStatusMap[order.payment_status]}`}
                  </span>
                </div>
                
                <div className="flex">
                  <span className="w-32 text-gray-600">Người nhận:</span>
                  <span className="font-medium">{order.full_name}</span>
                </div>
                
                <div className="flex">
                  <span className="w-32 text-gray-600">Số điện thoại:</span>
                  <span className="font-medium">{order.phone}</span>
                </div>
                
                <div className="flex items-start">
                  <span className="w-32 text-gray-600">Địa chỉ:</span>
                  <span className="font-medium flex-1">{order.address}</span>
                </div>
                
                {order.note && (
                  <div className="flex items-start">
                    <span className="w-32 text-gray-600">Ghi chú:</span>
                    <span className="font-medium flex-1 text-gray-700 italic">{order.note}</span>
                  </div>
                )}
                
                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Phí giao hàng:</span>
                    <span className="font-medium">{(order.shipping_fee || 0).toLocaleString('vi-VN')}đ</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between items-center text-green-600">
                      <span>Giảm giá:</span>
                      <span className="font-medium">-{order.discount.toLocaleString('vi-VN')}đ</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-lg font-bold text-primary-600 border-t pt-2 mt-2">
                    <span>Tổng tiền:</span>
                    <span>{order.total.toLocaleString('vi-VN')}đ</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Chi tiết sản phẩm */}
            <div className="p-6 bg-gray-50">
              <h3 className="font-bold mb-4 flex items-center">
                <FaShoppingBag className="mr-2" />
                Sản phẩm đã đặt
              </h3>
              
              <div className="space-y-3">
                {orderItems.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.product_name}</h4>
                      {item.product_option && (
                        <p className="text-sm text-gray-600">{item.product_option}</p>
                      )}
                      <p className="text-sm text-gray-500">
                        {item.price.toLocaleString('vi-VN')}đ × {item.quantity}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{item.subtotal.toLocaleString('vi-VN')}đ</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Thông tin giao hàng */}
          <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
            <div className="p-6">
              <h3 className="font-bold mb-4">Thông tin giao hàng</h3>
              
              {order.order_status === 'pending' && (
                <div className="flex items-start border-l-4 border-yellow-400 bg-yellow-50 p-4 rounded">
                  <div>
                    <p className="font-medium">Đơn hàng đang chờ xác nhận</p>
                    <p className="text-sm text-gray-600">
                      Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất để xác nhận đơn hàng
                    </p>
                    <p className="text-sm mt-2">
                      Dự kiến giao hàng: <span className="font-medium">Khoảng {estimateDeliveryTime(order.created_at)} hôm nay</span>
                    </p>
                  </div>
                </div>
              )}

              {order.order_status === 'confirmed' && (
                <div className="flex items-start border-l-4 border-blue-400 bg-blue-50 p-4 rounded">
                  <div>
                    <p className="font-medium">Đơn hàng đã được xác nhận</p>
                    <p className="text-sm text-gray-600">
                      Chúng tôi đang chuẩn bị đơn hàng của bạn
                    </p>
                    <p className="text-sm mt-2">
                      Dự kiến giao hàng: <span className="font-medium">Khoảng {estimateDeliveryTime(order.created_at)} hôm nay</span>
                    </p>
                  </div>
                </div>
              )}

              {order.order_status === 'processing' && (
                <div className="flex items-start border-l-4 border-indigo-400 bg-indigo-50 p-4 rounded">
                  <div>
                    <p className="font-medium">Đơn hàng đang được chuẩn bị</p>
                    <p className="text-sm text-gray-600">
                      Đơn hàng của bạn đang được chế biến
                    </p>
                    <p className="text-sm mt-2">
                      Dự kiến giao hàng: <span className="font-medium">Khoảng {estimateDeliveryTime(order.created_at)} hôm nay</span>
                    </p>
                  </div>
                </div>
              )}

              {order.order_status === 'shipping' && (
                <div className="flex items-start border-l-4 border-purple-400 bg-purple-50 p-4 rounded">
                  <div>
                    <p className="font-medium">Đơn hàng đang được giao</p>
                    <p className="text-sm text-gray-600">
                      Shipper của chúng tôi đang trên đường giao hàng đến bạn
                    </p>
                    <p className="text-sm mt-2">
                      Dự kiến giao hàng: <span className="font-medium">Trong vòng 20 phút</span>
                    </p>
                  </div>
                </div>
              )}

              {order.order_status === 'completed' && (
                <div className="flex items-start border-l-4 border-green-400 bg-green-50 p-4 rounded">
                  <div>
                    <p className="font-medium">Đơn hàng đã hoàn thành</p>
                    <p className="text-sm text-gray-600">
                      Cảm ơn bạn đã mua sắm tại Cloud Shop
                    </p>
                  </div>
                </div>
              )}

              {order.order_status === 'cancelled' && (
                <div className="flex items-start border-l-4 border-red-400 bg-red-50 p-4 rounded">
                  <div>
                    <p className="font-medium">Đơn hàng đã bị hủy</p>
                    <p className="text-sm text-gray-600">
                      Nếu bạn có thắc mắc, vui lòng liên hệ với chúng tôi
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Hướng dẫn theo dõi đơn hàng */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="font-bold mb-4">Theo dõi đơn hàng của bạn</h3>
            <p className="text-gray-600 mb-4">Bạn có thể kiểm tra trạng thái đơn hàng của mình bất cứ lúc nào bằng cách truy cập vào phần "Lịch sử đơn hàng" trong tài khoản của bạn.</p>
            
            <div className="flex flex-wrap gap-4 mt-4">
              <Link href={`/account/orders/${order.id}`} className="btn-primary px-6 py-2 flex items-center">
                <FaShoppingBag className="mr-2" /> Xem chi tiết đơn hàng
              </Link>
              <Link href="/account/orders" className="btn-outline px-6 py-2 flex items-center">
                <FaClipboard className="mr-2" /> Lịch sử đơn hàng
              </Link>
            </div>
          </div>

          {/* Thông tin liên hệ và hỗ trợ */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-8">
            <h3 className="font-bold mb-4 text-gray-800">Cần hỗ trợ? Chúng tôi luôn sẵn sàng!</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <FaPhone className="text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Hotline</p>
                  <p className="text-sm text-gray-600">1900 1234 (7:00-22:00)</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <FaComments className="text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Chat với chúng tôi</p>
                  <p className="text-sm text-gray-600">Trực tuyến 24/7</p>
                </div>
              </div>
            </div>
            <div className="mt-4 p-4 bg-white rounded-lg border-l-4 border-blue-400">
              <p className="text-sm">
                💡 <strong>Mẹo:</strong> Lưu mã đơn hàng <strong>{order.id.substring(0, 8)}...</strong> 
                để dễ dàng tra cứu và hỗ trợ nhanh chóng khi cần!
              </p>
            </div>
          </div>
          
          {/* Các nút điều hướng */}
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/" className="btn-outline px-6 py-2 flex items-center">
              <FaHome className="mr-2" /> Trang chủ
            </Link>
            <Link href="/menu" className="btn-primary px-6 py-2 flex items-center">
              <FaShoppingBag className="mr-2" /> Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  // Lấy orderId từ query parameters
  const { orderId } = context.query;

  if (!orderId) {
    return {
      props: {
        order: null,
        orderItems: [],
        error: 'Không tìm thấy thông tin đơn hàng',
      },
    };
  }

  try {
    // Truy vấn thông tin đơn hàng từ cơ sở dữ liệu
    const orderResults = await executeQuery({
      query: `
        SELECT id, full_name, phone, address, note, total, shipping_fee, discount, 
               order_status, payment_status, payment_method, created_at
        FROM orders
        WHERE id = ?
      `,
      values: [orderId],
    });

    if ((orderResults as any[]).length === 0) {
      return {
        props: {
          order: null,
          orderItems: [],
          error: 'Không tìm thấy đơn hàng với mã này',
        },
      };
    }

    // Lấy chi tiết sản phẩm trong đơn hàng
    const orderItemsResults = await executeQuery({
      query: `
        SELECT product_name, product_option, price, quantity, subtotal
        FROM order_items
        WHERE order_id = ?
        ORDER BY created_at ASC
      `,
      values: [orderId],
    });

    // Xử lý dữ liệu để tránh lỗi serialization
    const serializedOrder = JSON.parse(JSON.stringify((orderResults as any[])[0]));
    const serializedOrderItems = JSON.parse(JSON.stringify(orderItemsResults as any[]));

    return {
      props: {
        order: serializedOrder,
        orderItems: serializedOrderItems,
      },
    };
  } catch (error) {
    return {
      props: {
        order: null,
        orderItems: [],
        error: 'Đã xảy ra lỗi khi tải thông tin đơn hàng',
      },
    };
  }
};

export default Complete; 