import React, { useState, useEffect, useRef } from 'react';
import { FaClock, FaStore } from 'react-icons/fa';
import { useShopStatus } from '../lib/context/ShopStatusContext';

const ShopStatusOverlay: React.FC = () => {
  const { shopStatus, showOverlay } = useShopStatus();
  const [countdown, setCountdown] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);

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

  // Khóa scroll & trap focus khi overlay mở
  useEffect(() => {
    if (showOverlay && shopStatus && !shopStatus.isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      // Focus container
      setTimeout(() => {
        containerRef.current?.focus();
      }, 0);
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [showOverlay, shopStatus]);

  // Simple focus trap (vì không có phần tử focusable khác)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
    }
    if (e.key === 'Escape') {
      // Không cho đóng
      e.preventDefault();
    }
  };

  if (!shopStatus || shopStatus.isOpen || !showOverlay) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[1000] p-4 pointer-events-auto select-none" aria-modal="true" role="dialog">
      <div
        ref={containerRef}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-auto relative overflow-hidden outline-none"
      >

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

        <div className="p-6">
          <div className="text-center">
            <p className="text-gray-700 font-medium mb-4 whitespace-pre-line">
              {shopStatus.message || 'Cửa hàng hiện đang tạm đóng.'}
            </p>
            {shopStatus.operatingHours?.today && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-gray-800 mb-2">Giờ hoạt động hôm nay</h4>
                <div className="text-gray-600">
                  {shopStatus.operatingHours.today.is_open
                    ? `${shopStatus.operatingHours.today.open_time.slice(0,5)} - ${shopStatus.operatingHours.today.close_time.slice(0,5)}`
                    : 'Nghỉ'}
                </div>
              </div>
            )}
            <p className="text-xs text-gray-500">Bạn không thể thao tác cho đến khi cửa hàng mở lại.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopStatusOverlay;
