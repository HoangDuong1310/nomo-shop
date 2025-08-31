import React, { useState } from 'react';
import { FaBell, FaBellSlash, FaSpinner, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import { usePushNotification } from '../lib/context/PushNotificationContext';

interface PushNotificationToggleProps {
  className?: string;
  showLabel?: boolean;
  variant?: 'button' | 'switch' | 'card';
}

const PushNotificationToggle: React.FC<PushNotificationToggleProps> = ({ 
  className = '',
  showLabel = true,
  variant = 'button'
}) => {
  const {
    isSupported,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    sendTestNotification,
    permission
  } = usePushNotification();

  const [showTestButton, setShowTestButton] = useState(false);
  const [testLoading, setTestLoading] = useState(false);

  const handleToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      const success = await subscribe();
      if (success) {
        setShowTestButton(true);
        setTimeout(() => setShowTestButton(false), 5000);
      }
    }
  };

  const handleTestNotification = async () => {
    setTestLoading(true);
    await sendTestNotification();
    setTestLoading(false);
  };

  if (!isSupported) {
    return (
      <div className={`text-gray-500 text-sm ${className}`}>
        <FaExclamationTriangle className="inline mr-2" />
        Trình duyệt không hỗ trợ thông báo push
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div className={`text-red-500 text-sm ${className}`}>
        <FaBellSlash className="inline mr-2" />
        Thông báo đã bị chặn. Vui lòng bật trong cài đặt trình duyệt.
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`bg-white rounded-lg border p-4 ${className}`}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 mb-2">
              <FaBell className="inline mr-2 text-blue-600" />
              Thông báo push
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Nhận thông báo ngay lập tức về trạng thái cửa hàng, đơn hàng và ưu đãi đặc biệt
            </p>
            
            {error && (
              <div className="text-red-500 text-sm mb-3">
                <FaExclamationTriangle className="inline mr-1" />
                {error}
              </div>
            )}

            <div className="flex items-center space-x-3">
              <button
                onClick={handleToggle}
                disabled={isLoading}
                className={`
                  px-4 py-2 rounded-md text-sm font-medium transition-colors
                  ${isSubscribed 
                    ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }
                  ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                {isLoading ? (
                  <FaSpinner className="animate-spin inline mr-2" />
                ) : isSubscribed ? (
                  <FaBellSlash className="inline mr-2" />
                ) : (
                  <FaBell className="inline mr-2" />
                )}
                {isLoading ? 'Đang xử lý...' : isSubscribed ? 'Tắt thông báo' : 'Bật thông báo'}
              </button>

              {(isSubscribed && showTestButton) && (
                <button
                  onClick={handleTestNotification}
                  disabled={testLoading}
                  className="px-3 py-2 rounded-md text-sm font-medium bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                >
                  {testLoading ? (
                    <FaSpinner className="animate-spin inline mr-1" />
                  ) : (
                    <FaCheck className="inline mr-1" />
                  )}
                  {testLoading ? 'Đang gửi...' : 'Test thông báo'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'switch') {
    return (
      <div className={`flex items-center justify-between ${className}`}>
        <div className="flex-1">
          <div className="flex items-center">
            <FaBell className="text-blue-600 mr-2" />
            <span className="text-sm font-medium">Thông báo push</span>
          </div>
          {error && (
            <p className="text-red-500 text-xs mt-1">{error}</p>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleToggle}
            disabled={isLoading}
            className={`
              relative inline-flex h-6 w-11 rounded-full transition-colors
              ${isSubscribed ? 'bg-blue-600' : 'bg-gray-200'}
              ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <span
              className={`
                inline-block h-4 w-4 mt-1 rounded-full bg-white transition-transform
                ${isSubscribed ? 'translate-x-6' : 'translate-x-1'}
              `}
            />
          </button>

          {(isSubscribed && showTestButton) && (
            <button
              onClick={handleTestNotification}
              disabled={testLoading}
              className="text-green-600 hover:text-green-700 p-1"
              title="Gửi thông báo test"
            >
              {testLoading ? (
                <FaSpinner className="animate-spin" />
              ) : (
                <FaCheck />
              )}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Default button variant
  return (
    <div className={className}>
      <button
        onClick={handleToggle}
        disabled={isLoading}
        className={`
          inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors
          ${isSubscribed 
            ? 'bg-red-100 text-red-700 hover:bg-red-200' 
            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          }
          ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {isLoading ? (
          <FaSpinner className="animate-spin mr-2" />
        ) : isSubscribed ? (
          <FaBellSlash className="mr-2" />
        ) : (
          <FaBell className="mr-2" />
        )}
        
        {showLabel && (
          <>
            {isLoading ? 'Đang xử lý...' : isSubscribed ? 'Tắt thông báo' : 'Bật thông báo'}
          </>
        )}
      </button>

      {(isSubscribed && showTestButton) && (
        <button
          onClick={handleTestNotification}
          disabled={testLoading}
          className="ml-2 px-3 py-2 rounded-md text-sm font-medium bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
        >
          {testLoading ? (
            <FaSpinner className="animate-spin mr-1" />
          ) : (
            <FaCheck className="mr-1" />
          )}
          Test
        </button>
      )}

      {error && (
        <div className="mt-2 text-red-500 text-sm">
          <FaExclamationTriangle className="inline mr-1" />
          {error}
        </div>
      )}
    </div>
  );
};

export default PushNotificationToggle;
