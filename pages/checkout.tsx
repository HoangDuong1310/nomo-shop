import { useState, useEffect } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { FaArrowLeft, FaMapMarkerAlt, FaCreditCard, FaMoneyBillWave, FaCheck, FaUniversity } from 'react-icons/fa';
import Link from 'next/link';
import { useCart } from '../lib/context/CartContext';
import { toast } from 'react-toastify';
import { useAuth } from '../lib/context/AuthContext';
import { formatPrice } from '../lib/price-utils';
import { buildVietQRUrl } from '../lib/vietqr';

type FormData = {
  name: string;
  phone: string;
  address: string;
  note: string;
  paymentMethod: 'cod' | 'vnpay' | 'bank';
};

const Checkout: NextPage = () => {
  const router = useRouter();
  const { items, subtotal, clearCart, cartLoaded } = useCart();
  const { user, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    address: '',
    note: '',
    paymentMethod: 'cod',
  });
  const [paymentSettings, setPaymentSettings] = useState<any | null>(null);

  const [isFirstOrder, setIsFirstOrder] = useState(false);
  const [applyDiscount, setApplyDiscount] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  // Miễn phí giao hàng trong bán kính 3km (theo chính sách cửa hàng)
  const shippingFee = 0;
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const total = subtotal + shippingFee - discountAmount;

  useEffect(() => {
    if (!cartLoaded) return; // wait until cart is hydrated
    if (items.length === 0) {
      // stay on page if user manually navigated without items? redirect as before
      router.push('/cart');
    }
  }, [items, cartLoaded, router]);

  // Điền thông tin từ user nếu đã đăng nhập
  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || prev.name,
        phone: user.phone || prev.phone,
        address: user.address || prev.address
      }));
    }
  }, [isAuthenticated, user]);

  // Tính khoảng cách bằng Google/Maps đã được tắt theo quy định. Phí giao hàng mặc định 0 trong bán kính 3 km.
  // Load public payment settings
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/public/payment-settings');
        if (res.ok) {
          const data = await res.json();
          if (data && data.payment) {
            setPaymentSettings(data.payment);
            if (formData.paymentMethod === 'cod' && data.payment.accept_cash === false) {
              if (data.payment.accept_vnpay) setFormData(f => ({ ...f, paymentMethod: 'vnpay' }));
              else if (data.payment.accept_direct_bank || data.payment.accept_bank_transfer) setFormData(f => ({ ...f, paymentMethod: 'bank' }));
            }
          }
        }
      } catch (e) {
        // silent
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Kiểm tra đơn hàng đầu tiên dựa trên số điện thoại
  useEffect(() => {
    const checkFirstOrder = async () => {
      if (formData.phone && formData.phone.length >= 10) {
        try {
          const response = await fetch(`/api/check-first-order?phone=${encodeURIComponent(formData.phone)}`);
          const data = await response.json();
          setIsFirstOrder(data.isFirstOrder);
        } catch (error) {
          setIsFirstOrder(false);
        }
      }
    };

    checkFirstOrder();
  }, [formData.phone]);

  // Cập nhật số tiền giảm giá khi người dùng chọn áp dụng
  useEffect(() => {
    if (applyDiscount && isFirstOrder) {
      // Giảm 10% cho đơn hàng đầu tiên, tối đa 50.000đ
      const discount = Math.min(subtotal * 0.1, 50000);
      setDiscountAmount(discount);
    } else {
      setDiscountAmount(0);
    }
  }, [applyDiscount, isFirstOrder, subtotal]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Xóa lỗi khi người dùng sửa
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handlePaymentChange = (method: 'cod' | 'vnpay' | 'bank') => {
    setFormData((prev) => ({
      ...prev,
      paymentMethod: method,
    }));
  };

  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApplyDiscount(e.target.checked);
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Vui lòng nhập họ tên';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!/^[0-9]{10,11}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'Vui lòng nhập địa chỉ giao hàng';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOrder = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Chuẩn bị dữ liệu đơn hàng
      const orderData = {
        items: items.map(item => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          option: item.option || null,
        })),
        customerInfo: {
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          note: formData.note,
        },
        subtotal,
        shipping_fee: shippingFee,
        discount: discountAmount,
        total,
        payment_method: formData.paymentMethod,
      };
      
  if (formData.paymentMethod === 'vnpay') {
        // Lưu đơn hàng trước khi chuyển sang trang thanh toán VNPay
        const response = await fetch('/api/orders/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(orderData),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Có lỗi xảy ra khi đặt hàng');
        }
        
        // Tạo URL thanh toán VNPay và chuyển hướng
        const payResp = await fetch('/api/payments/vnpay/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: data.orderId }),
        });
        const payData = await payResp.json();
        if (!payResp.ok || !payData.success) {
          throw new Error(payData.message || 'Không tạo được URL thanh toán VNPay');
        }
        
        // Redirect ngay lập tức đến VNPay, không clear cart ở đây
        // Cart sẽ được clear ở trang complete sau khi thanh toán
  window.location.href = payData.redirectUrl;
      } else if (formData.paymentMethod === 'cod') {
        // Thanh toán COD
        const response = await fetch('/api/orders/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(orderData),
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Có lỗi xảy ra khi đặt hàng');
        }
        
        // Show success message ngắn gọn
        toast.success('🎉 Đặt hàng thành công!', {
          autoClose: 1000,
        });
        
        // Redirect tất cả đến trang complete để có UX consistent
        router.push(`/checkout/complete?orderId=${data.orderId}`);
  } else if (formData.paymentMethod === 'bank') {
        const response = await fetch('/api/orders/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Có lỗi xảy ra khi đặt hàng');
        }
        toast.info('Đơn hàng đã tạo. Vui lòng chuyển khoản theo hướng dẫn.', { autoClose: 2000 });
        router.push(`/checkout/complete?orderId=${data.orderId}`);
      }
    } catch (error: any) {
      toast.error(error.message || 'Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <Head>
        <title>Thanh toán - Cloud Shop</title>
        <meta name="description" content="Thanh toán đơn hàng tại Cloud Shop" />
      </Head>
      
      <div className="container-custom py-8">
        <div className="flex items-center mb-6">
          <Link href="/cart" className="text-primary-600 hover:text-primary-700 flex items-center">
            <FaArrowLeft className="mr-2" /> Quay lại giỏ hàng
          </Link>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Thanh toán</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Thông tin giao hàng */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Thông tin giao hàng</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-gray-700 font-medium mb-2">
                    Họ tên
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`input-field ${errors.name ? 'border-red-500' : ''}`}
                    placeholder="Nhập họ tên của bạn"
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-gray-700 font-medium mb-2">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`input-field ${errors.phone ? 'border-red-500' : ''}`}
                    placeholder="Nhập số điện thoại của bạn"
                  />
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                </div>
                
                <div>
                  <label htmlFor="address" className="block text-gray-700 font-medium mb-2">
                    Địa chỉ giao hàng
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={3}
                    className={`input-field ${errors.address ? 'border-red-500' : ''}`}
                    placeholder="Nhập địa chỉ giao hàng đầy đủ"
                  />
                  {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                </div>
                
                <div>
                  <label htmlFor="note" className="block text-gray-700 font-medium mb-2">
                    Ghi chú (tùy chọn)
                  </label>
                  <textarea
                    id="note"
                    name="note"
                    value={formData.note}
                    onChange={handleChange}
                    rows={2}
                    className="input-field"
                    placeholder="Ghi chú thêm về đơn hàng hoặc giao hàng"
                  />
                </div>
                
                {/* Thông báo chính sách giao hàng */}
                <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                  <div className="flex items-start text-green-700">
                    <FaMapMarkerAlt className="mr-2 mt-0.5 text-green-600" />
                    <p className="text-sm font-medium">
                      🚀 Miễn phí giao hàng trong bán kính 3km! Cửa hàng cam kết giao hàng nhanh chóng và an toàn đến tay bạn.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Phương thức thanh toán */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-4">Phương thức thanh toán</h2>
              <div className="space-y-4">
                {(!paymentSettings || paymentSettings.accept_cash) && (
                  <div className={`p-4 border rounded-lg cursor-pointer transition-colors ${formData.paymentMethod === 'cod' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-300'}`}
                       onClick={() => handlePaymentChange('cod')}>
                    <div className="flex items-center">
                      <div className={`w-6 h-6 rounded-full mr-3 flex items-center justify-center ${formData.paymentMethod === 'cod' ? 'bg-primary-500' : 'border border-gray-300'}`}>{formData.paymentMethod === 'cod' && <FaCheck className="text-white text-sm" />}</div>
                      <div className="flex items-center">
                        <FaMoneyBillWave className="text-primary-500 text-xl mr-3" />
                        <div>
                          <p className="font-medium">Thanh toán khi nhận hàng (COD)</p>
                          <p className="text-sm text-gray-500">Thanh toán bằng tiền mặt khi nhận được hàng</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {paymentSettings && paymentSettings.accept_vnpay && (
                  <div className={`p-4 border rounded-lg cursor-pointer transition-colors ${formData.paymentMethod === 'vnpay' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-300'}`}
                       onClick={() => handlePaymentChange('vnpay')}>
                    <div className="flex items-center">
                      <div className={`w-6 h-6 rounded-full mr-3 flex items-center justify-center ${formData.paymentMethod === 'vnpay' ? 'bg-primary-500' : 'border border-gray-300'}`}>{formData.paymentMethod === 'vnpay' && <FaCheck className="text-white text-sm" />}</div>
                      <div className="flex items-center">
                        <FaCreditCard className="text-primary-500 text-xl mr-3" />
                        <div>
                          <p className="font-medium">Thanh toán VNPay</p>
                          <p className="text-sm text-gray-500">Thẻ ngân hàng, ví điện tử, QR code</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {paymentSettings && (paymentSettings.accept_direct_bank || paymentSettings.accept_bank_transfer) && (
                  <div className={`p-4 border rounded-lg cursor-pointer transition-colors ${formData.paymentMethod === 'bank' ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-300'}`}
                       onClick={() => handlePaymentChange('bank')}>
                    <div className="flex items-center">
                      <div className={`w-6 h-6 rounded-full mr-3 flex items-center justify-center ${formData.paymentMethod === 'bank' ? 'bg-primary-500' : 'border border-gray-300'}`}>{formData.paymentMethod === 'bank' && <FaCheck className="text-white text-sm" />}</div>
                      <div className="flex items-center">
                        <FaUniversity className="text-primary-500 text-xl mr-3" />
                        <div>
                          <p className="font-medium">Chuyển khoản ngân hàng</p>
                          <p className="text-sm text-gray-500">Chuyển khoản thủ công theo hướng dẫn</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {formData.paymentMethod === 'bank' && paymentSettings && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                    <p className="font-medium mb-1">Thông tin chuyển khoản:</p>
                    <p>Ngân hàng: <span className="font-semibold">{paymentSettings.bank_name || 'Cập nhật sau'}</span></p>
                    <p>Số tài khoản: <span className="font-semibold">{paymentSettings.bank_account_number || 'Cập nhật sau'}</span></p>
                    <p>Chủ tài khoản: <span className="font-semibold">{paymentSettings.bank_account_name || 'Cập nhật sau'}</span></p>
                    <p className="mt-2 text-gray-600">Vui lòng chuyển khoản theo thông tin trên. Đơn hàng sẽ được xử lý sau khi xác nhận thanh toán.</p>
                    {paymentSettings.bank_code && paymentSettings.bank_account_number && (
                      <div className="mt-4">
                        <p className="font-medium mb-2">Quét mã QR để chuyển khoản nhanh:</p>
                        <div className="bg-white p-3 rounded-md inline-block border">
                          {/* Use subtotal or total for amount? Use total */}
                          {/* Description limited spaces */}
                          {(() => {
                            const qrUrl = buildVietQRUrl({
                              bankCode: paymentSettings.bank_code,
                              accountNumber: paymentSettings.bank_account_number,
                              template: paymentSettings.bank_template || 'compact2',
                              amount: Math.max(0, Math.round(total)),
                              description: `Order ${formData.phone}`.substring(0, 40),
                              accountName: paymentSettings.bank_account_name || undefined,
                              fileExt: 'jpg'
                            });
                            return qrUrl ? <img src={qrUrl} alt="VietQR" className="w-64 h-auto" /> : null;
                          })()}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Nội dung chuyển khoản tự động: CloudShop {formData.phone}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Tóm tắt đơn hàng */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-24">
              <h2 className="text-xl font-bold mb-4">Tóm tắt đơn hàng</h2>
              
              <div className="divide-y">
                {items.map((item) => (
                  <div key={`${item.productId}-${item.option || ''}`} className="py-3 flex justify-between">
                    <div>
                      <span className="font-medium">
                        {item.name} {item.option && `(${item.option})`}
                      </span>
                      <p className="text-sm text-gray-500">SL: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p>{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t mt-4 pt-4">
                <div className="flex justify-between mb-2">
                  <span>Tạm tính:</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span>Phí giao hàng:</span>
                  <span className="text-green-600 font-medium">Miễn phí (trong bán kính 3km)</span>
                </div>
                
                {/* Giảm giá cho đơn đầu tiên */}
                {isFirstOrder && (
                  <div className="mb-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="applyDiscount"
                        checked={applyDiscount}
                        onChange={handleDiscountChange}
                        className="mr-2"
                      />
                      <label htmlFor="applyDiscount" className="text-sm text-primary-600">
                        Áp dụng giảm 10% cho đơn hàng đầu tiên
                      </label>
                    </div>
                    
                    {applyDiscount && (
                      <div className="flex justify-between mt-1 text-green-600">
                        <span>Giảm giá:</span>
                        <span>-{formatPrice(discountAmount)}</span>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Tổng cộng:</span>
                  <span className="text-primary-600">{formatPrice(total)}</span>
                </div>
              </div>
              
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleOrder}
                  disabled={isSubmitting}
                  className="btn-primary w-full py-3 flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin inline-block h-4 w-4 border-t-2 border-b-2 border-white rounded-full mr-2"></span>
                      Đang xử lý...
                    </>
                  ) : (
                    'Đặt hàng'
                  )}
                </button>
              </div>
              
              <p className="text-sm text-gray-500 mt-4">
                Bằng cách đặt hàng, bạn đồng ý với các điều khoản và điều kiện của chúng tôi.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Checkout; 