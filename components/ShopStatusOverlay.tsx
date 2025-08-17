import React, { useState, useEffect } from 'react';
import { FaClock, FaTimes, FaEnvelope, FaStore, FaBell } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useShopStatus } from '../lib/context/ShopStatusContext';

const ShopStatusOverlay: React.FC = () => {
  const { shopStatus, showOverlay, setShowOverlay } = useShopStatus();
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [countdown, setCountdown] = useState('');

  // Calculate countdown to next open time
  useEffect(() => {
    if (!shopStatus || shopStatus.isOpen || !showOverlay) return;

    const updateCountdown = () => {
      if (!shopStatus.operatingHours?.today) return;

      const now = new Date();
      const today = shopStatus.operatingHours.today;
      const openTime = today.open_time;
      const currentTime = now.toTimeString().slice(0, 8);
      
      let targetTime: Date;
      
      if (currentTime < openTime) {
        // Same day, before opening
        targetTime = new Date();
        const [hours, minutes] = openTime.split(':');
        targetTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      } else {
        // Next day opening (simplified - assume same time)
        targetTime = new Date();
        targetTime.setDate(targetTime.getDate() + 1);
        const [hours, minutes] = openTime.split(':');
        targetTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      }

      const timeDiff = targetTime.getTime() - now.getTime();
      
      if (timeDiff > 0) {
        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
        
        setCountdown(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      } else {
        setCountdown('');
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [shopStatus, showOverlay]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Vui lòng nhập email');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      toast.error('Email không hợp lệ');
      return;
    }

    setIsSubscribing(true);

    try {
      const response = await fetch('/api/shop/notification/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Đăng ký thành công! Chúng tôi sẽ thông báo khi cửa hàng mở lại.');
        setIsSubscribed(true);
        setEmail('');
      } else {
        toast.error(data.message || 'Đăng ký thất bại');
      }
    } catch (error) {
      toast.error('Đã xảy ra lỗi. Vui lòng thử lại.');
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleContinueBrowsing = () => {
    setShowOverlay(false);
  };

  if (!shopStatus || shopStatus.isOpen || !showOverlay) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-auto relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={() => setShowOverlay(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
        >
          <FaTimes className="text-xl" />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white p-6 text-center">
          <div className="mb-4">
            <FaStore className="text-4xl mx-auto mb-2" />
            <h2 className="text-2xl font-bold">
              {shopStatus.title || 'Cửa hàng đóng cửa'}
            </h2>
          </div>
          
          {/* Countdown Timer */}
          {countdown && shopStatus.nextOpenTime && (
            <div className="bg-white bg-opacity-20 rounded-lg p-3">
              <div className="flex items-center justify-center mb-2">
                <FaClock className="mr-2" />
                <span className="text-sm">Mở cửa trở lại</span>
              </div>
              <div className="text-3xl font-mono font-bold">
                {countdown}
              </div>
              <div className="text-sm opacity-90 mt-1">
                {shopStatus.nextOpenTime}
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <p className="text-gray-600 mb-4">
              {shopStatus.message}
            </p>

            {shopStatus.operatingHours?.today && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-gray-800 mb-2">Giờ hoạt động hôm nay:</h4>
                <div className="text-gray-600">
                  {shopStatus.operatingHours.today.is_open ? (
                    <>
                      {shopStatus.operatingHours.today.open_time.slice(0, 5)} - {shopStatus.operatingHours.today.close_time.slice(0, 5)}
                    </>
                  ) : (
                    'Nghỉ'
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Email Notification Form */}
          {!isSubscribed && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                <FaBell className="mr-2 text-yellow-500" />
                Nhận thông báo khi mở cửa
              </h3>
              <form onSubmit={handleEmailSubmit} className="space-y-3">
                <div className="relative">
                  <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Nhập email của bạn"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    disabled={isSubscribing}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubscribing}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubscribing ? (
                    <span className="flex items-center justify-center">
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                      Đang đăng ký...
                    </span>
                  ) : (
                    'Đăng ký nhận thông báo'
                  )}
                </button>
              </form>
            </div>
          )}

          {isSubscribed && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center text-green-700">
                <FaBell className="mr-2" />
                <span className="font-medium">Đăng ký thành công!</span>
              </div>
              <p className="text-green-600 text-sm mt-1">
                Chúng tôi sẽ gửi email thông báo khi cửa hàng mở lại.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleContinueBrowsing}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 px-4 rounded-lg transition-colors"
            >
              Vẫn xem sản phẩm
            </button>
            <p className="text-xs text-gray-500 text-center">
              * Bạn có thể duyệt sản phẩm nhưng không thể đặt hàng khi cửa hàng đóng
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopStatusOverlay;
