import { useState, useEffect } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { FaArrowLeft, FaMinus, FaPlus, FaTrash, FaMapMarkerAlt, FaShoppingCart } from 'react-icons/fa';
import { useCart } from '../lib/context/CartContext';
import { formatPrice } from '../lib/price-utils';

const Cart: NextPage = () => {
  const router = useRouter();
  const { items, updateQuantity, removeItem, subtotal } = useCart();
  // Miễn phí giao hàng trong bán kính 3km (theo chính sách cửa hàng)
  const isWithinFreeShippingRadius = true;
  const shippingFee = 0;

  // Tính tổng giá trị đơn hàng
  const total = subtotal + shippingFee;

  // Chuyển đến trang thanh toán
  const handleCheckout = () => {
    // Lưu thông tin giỏ hàng vào localStorage hoặc state toàn cục
    router.push('/checkout');
  };

  return (
    <Layout>
      <Head>
        <title>Giỏ hàng - Cloud Shop</title>
        <meta name="description" content="Giỏ hàng của bạn tại Cloud Shop" />
      </Head>

      <div className="container-custom py-8">
        {/* Tiêu đề trang */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Giỏ hàng</h1>
          <p className="text-gray-600 mt-2">Xem lại sản phẩm bạn đã chọn</p>
        </div>

        {items.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Danh sách sản phẩm */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div key={item.id} className="card p-4 flex flex-col sm:flex-row gap-4">
                  {/* Hình ảnh sản phẩm */}
                  <div className="sm:w-24 h-24 relative rounded-md overflow-hidden bg-gray-100">
                    <Image
                      src={item.image || '/images/placeholder.svg'}
                      alt={item.name}
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  </div>
                  
                  {/* Thông tin sản phẩm */}
                  <div className="flex-grow">
                    <div className="flex justify-between">
                      <h3 className="font-medium">{item.name}</h3>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-gray-500 hover:text-red-500 transition-colors"
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                    
                    {item.option && (
                      <p className="text-sm text-gray-500 mb-2">Tùy chọn: {item.option}</p>
                    )}
                    
                    <div className="flex items-end justify-between mt-2">
                      <div className="flex items-center border border-gray-300 rounded-md">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className={`px-2 py-1 ${
                            item.quantity <= 1 ? 'text-gray-400' : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <FaMinus size={10} />
                        </button>
                        <span className="px-3 py-1 border-x border-gray-300">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-2 py-1 text-gray-700 hover:bg-gray-100"
                        >
                          <FaPlus size={10} />
                        </button>
                      </div>
                      <p className="font-medium">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              <div className="mt-4">
                <Link href="/menu" className="flex items-center text-primary-600 hover:text-primary-700">
                  <FaArrowLeft className="mr-2" />
                  <span>Tiếp tục mua sắm</span>
                </Link>
              </div>
            </div>
            
            {/* Tóm tắt đơn hàng */}
            <div className="lg:col-span-1">
              <div className="card p-6 sticky top-20">
                <h3 className="font-bold text-lg mb-4">Tóm tắt đơn hàng</h3>
                
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tạm tính</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  
                  <div className="flex justify-between items-start">
                    <span className="text-gray-600">Phí giao hàng</span>
                    <div className="text-right">
                      <span className="text-green-600 font-medium">
                        Miễn phí
                      </span>
                      <div className="text-xs text-gray-500 flex items-center justify-end mt-1">
                        <FaMapMarkerAlt className="mr-1" size={10} />
                        <span>Miễn phí trong bán kính 3km</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between font-bold">
                      <span>Tổng cộng</span>
                      <span className="text-primary-600">{formatPrice(total)}</span>
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={handleCheckout}
                  className="btn-primary w-full py-3"
                  disabled={items.length === 0}
                >
                  Tiến hành thanh toán
                </button>
                
                <div className="mt-4 text-xs text-gray-500 text-center">
                  <p>Bằng việc tiến hành thanh toán, bạn đồng ý với <Link href="/terms" className="text-primary-600">điều khoản sử dụng</Link> của chúng tôi.</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Giỏ hàng trống
          <div className="py-12 text-center">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FaShoppingCart className="text-gray-400 text-4xl" />
            </div>
            <h2 className="text-2xl font-medium mb-4">Giỏ hàng của bạn đang trống</h2>
            <p className="text-gray-500 mb-8">Hãy thêm sản phẩm vào giỏ hàng để tiến hành đặt món</p>
            <Link href="/menu" className="btn-primary inline-flex">
              Xem thực đơn
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Cart; 