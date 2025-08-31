import React, { useState } from 'react';
import { FaBell, FaTimes } from 'react-icons/fa';
import { useShopStatus } from '../lib/context/ShopStatusContext';
import { usePushNotification } from '../lib/context/PushNotificationContext';

const NotificationBanner: React.FC = () => {
  const { shopStatus } = useShopStatus();
  const { isSupported, isSubscribed, subscribe } = usePushNotification();
  const [dismissed, setDismissed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  // Only show when shop is closed and user hasn't subscribed and hasn't dismissed
  if (!shopStatus || shopStatus.isOpen || isSubscribed || dismissed || !isSupported) {
    return null;
  }

  const handleSubscribe = async () => {
    setSubscribing(true);
    const success = await subscribe();
    setSubscribing(false);
    
    if (success) {
      setDismissed(true); // Hide banner after successful subscription
    }
  };

  return (
    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <FaBell className="text-blue-400 mr-3" />
          <div>
            <p className="text-sm text-blue-800 font-medium">
              Cửa hàng đang đóng cửa
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Bật thông báo để biết ngay khi chúng tôi mở cửa trở lại!
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleSubscribe}
            disabled={subscribing}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {subscribing ? 'Đang bật...' : 'Bật thông báo'}
          </button>
          
          <button
            onClick={() => setDismissed(true)}
            className="text-blue-600 hover:text-blue-800 p-1"
            title="Đóng"
          >
            <FaTimes size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationBanner;
