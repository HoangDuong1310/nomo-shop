import type { NextPage } from 'next'
import Head from 'next/head'
import { useStoreInfo } from '../lib/context/StoreInfoContext'
import { useState, useEffect } from 'react'
import { FaShoppingCart, FaMapMarkerAlt, FaQrcode } from 'react-icons/fa'
import Link from 'next/link'

const Home: NextPage = () => {
  const { storeInfo } = useStoreInfo();
  const title = `${storeInfo.store_name || 'Cloud Shop'} - Đặt món trực tuyến qua mã QR`;
  return (
    <div>
      <Head>
        <title>{title}</title>
        <meta name="description" content={storeInfo.store_description || 'Đặt món trực tuyến nhanh chóng và tiện lợi qua mã QR'} />
      </Head>

      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
          <div className="container-custom py-16 md:py-24">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">Đặt món ngon chỉ trong vài giây</h1>
                <p className="text-xl opacity-90">Quét mã QR để truy cập vào cửa hàng trực tuyến, đặt món và nhận ngay tại nhà.</p>
                <div className="pt-4 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                  <Link href="/menu" className="btn-secondary flex items-center justify-center space-x-2">
                    <span>Đặt món ngay</span>
                    <FaShoppingCart />
                  </Link>
                  <Link href="/about" className="btn-outline bg-white/10 text-white flex items-center justify-center space-x-2">
                    <span>Tìm hiểu thêm</span>
                    <FaMapMarkerAlt />
                  </Link>
                </div>
              </div>
              <div className="flex justify-center">
                <div className="bg-white p-6 rounded-lg shadow-lg">
                  <FaQrcode className="text-primary-600 text-9xl mx-auto" />
                  <p className="mt-4 text-center text-gray-900 font-medium">Quét mã QR để đặt món</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16">
          <div className="container-custom">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Tại sao nên chọn chúng tôi?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="card p-6 text-center">
                <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaQrcode className="text-2xl" />
                </div>
                <h3 className="text-xl font-bold mb-2">Đặt món qua mã QR</h3>
                <p className="text-gray-600">Chỉ cần quét mã QR, bạn có thể truy cập vào menu và đặt món một cách nhanh chóng.</p>
              </div>
              <div className="card p-6 text-center">
                <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaShoppingCart className="text-2xl" />
                </div>
                <h3 className="text-xl font-bold mb-2">Đặt hàng dễ dàng</h3>
                <p className="text-gray-600">Giao diện thân thiện, dễ sử dụng giúp bạn đặt món chỉ trong vài bước đơn giản.</p>
              </div>
              <div className="card p-6 text-center">
                <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaMapMarkerAlt className="text-2xl" />
                </div>
                <h3 className="text-xl font-bold mb-2">Free ship trong 3km</h3>
                <p className="text-gray-600">Miễn phí giao hàng trong bán kính 3km, giúp bạn tiết kiệm chi phí.</p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 bg-gray-50">
          <div className="container-custom">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Cách thức hoạt động</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="card p-6 bg-white relative">
                <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold">1</div>
                <h3 className="text-xl font-bold mb-2 pt-2">Quét mã QR</h3>
                <p className="text-gray-600">Quét mã QR từ card giới thiệu hoặc tại cửa hàng</p>
              </div>
              <div className="card p-6 bg-white relative">
                <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold">2</div>
                <h3 className="text-xl font-bold mb-2 pt-2">Chọn món</h3>
                <p className="text-gray-600">Duyệt qua menu và thêm món ăn vào giỏ hàng</p>
              </div>
              <div className="card p-6 bg-white relative">
                <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold">3</div>
                <h3 className="text-xl font-bold mb-2 pt-2">Đặt hàng</h3>
                <p className="text-gray-600">Nhập thông tin giao hàng và chọn phương thức thanh toán</p>
              </div>
              <div className="card p-6 bg-white relative">
                <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold">4</div>
                <h3 className="text-xl font-bold mb-2 pt-2">Nhận món</h3>
                <p className="text-gray-600">Đồ ăn sẽ được giao đến tận nơi trong thời gian ngắn nhất</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-primary-700 text-white">
          <div className="container-custom text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Sẵn sàng đặt món?</h2>
            <p className="text-xl opacity-90 mb-8">Trải nghiệm đặt món trực tuyến nhanh chóng và tiện lợi ngay hôm nay!</p>
            <Link href="/menu" className="btn-secondary inline-flex items-center justify-center space-x-2 bg-white text-primary-700 hover:bg-gray-100">
              <span>Đặt món ngay</span>
              <FaShoppingCart />
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white py-8">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">{storeInfo.store_name || 'Cloud Shop'}</h3>
              <p className="text-gray-400">{storeInfo.store_description || 'Đặt món trực tuyến qua mã QR, giao hàng nhanh chóng và tiện lợi.'}</p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Liên hệ</h3>
              <p className="text-gray-400">Địa chỉ: {storeInfo.store_address || '123 Đường ABC, Quận XYZ, TP.HCM'}</p>
              <p className="text-gray-400">SĐT: {storeInfo.store_phone || '0123 456 789'}</p>
              <p className="text-gray-400">Email: {storeInfo.store_email || 'info@cloudshop.com'}</p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Giờ mở cửa</h3>
              <p className="text-gray-400">{storeInfo.store_hours || 'Thứ 2 - Thứ 6: 8:00 - 22:00'}</p>
              {/* Có thể tách riêng weekend nếu muốn sau */}
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>© {new Date().getFullYear()} {storeInfo.store_name || 'Cloud Shop'}. Tất cả các quyền được bảo lưu.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home