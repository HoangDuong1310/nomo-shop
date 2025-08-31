import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface PushNotificationContextType {
  isSupported: boolean;
  isSubscribed: boolean;
  subscription: PushSubscription | null;
  isLoading: boolean;
  error: string | null;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  checkSubscription: () => Promise<void>;
  sendTestNotification: () => Promise<boolean>;
  permission: NotificationPermission;
}

const PushNotificationContext = createContext<PushNotificationContextType | null>(null);

export const usePushNotification = () => {
  const context = useContext(PushNotificationContext);
  if (!context) {
    throw new Error('usePushNotification must be used within PushNotificationProvider');
  }
  return context;
};

interface PushNotificationProviderProps {
  children: React.ReactNode;
}

export const PushNotificationProvider: React.FC<PushNotificationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  // Check if push notifications are supported
  useEffect(() => {
    const checkSupport = () => {
      const supported = 
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window;
      
      setIsSupported(supported);
      
      if (supported && 'Notification' in window) {
        setPermission(Notification.permission);
      }
    };

    checkSupport();
  }, []);

  // Register service worker
  useEffect(() => {
    if (!isSupported) return;

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });

        console.log('Service Worker registered successfully:', registration);

        // Listen for service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker is available
                console.log('New service worker available');
              }
            });
          }
        });

      } catch (error) {
        console.error('Service Worker registration failed:', error);
        setError('Không thể đăng ký service worker');
      }
    };

    registerServiceWorker();
  }, [isSupported]);

  // Check current subscription status
  const checkSubscription = useCallback(async () => {
    if (!isSupported) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const currentSubscription = await registration.pushManager.getSubscription();
      
      if (currentSubscription) {
        setSubscription(currentSubscription.toJSON() as PushSubscription);
        setIsSubscribed(true);
        
        // Verify subscription with server
        const response = await fetch('/api/push/verify-subscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subscription: currentSubscription.toJSON()
          })
        });

        if (!response.ok) {
          // Subscription not valid on server, unsubscribe locally
          await currentSubscription.unsubscribe();
          setSubscription(null);
          setIsSubscribed(false);
        }
      } else {
        setSubscription(null);
        setIsSubscribed(false);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      setError('Không thể kiểm tra trạng thái đăng ký');
    }
  }, [isSupported]);

  // Check subscription on component mount and user change
  useEffect(() => {
    checkSubscription();
  }, [checkSubscription, user]);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('Trình duyệt không hỗ trợ push notifications');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Request notification permission
      let notificationPermission = permission;
      
      if (notificationPermission === 'default') {
        notificationPermission = await Notification.requestPermission();
        setPermission(notificationPermission);
      }

      if (notificationPermission !== 'granted') {
        throw new Error('Quyền thông báo bị từ chối');
      }

      // Get VAPID public key from server
      const keyResponse = await fetch('/api/push/vapid-public-key');
      if (!keyResponse.ok) {
        throw new Error('Không thể lấy public key');
      }
      
      const { publicKey } = await keyResponse.json();

      // Subscribe to push notifications
      const registration = await navigator.serviceWorker.ready;
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource
      });

      // Send subscription to server
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: newSubscription.toJSON(),
          userAgent: navigator.userAgent,
          browserInfo: {
            name: getBrowserInfo().name,
            version: getBrowserInfo().version,
            platform: navigator.platform
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Không thể đăng ký push notification');
      }

      setSubscription(newSubscription.toJSON() as PushSubscription);
      setIsSubscribed(true);
      
      return true;

    } catch (error: any) {
      console.error('Error subscribing to push notifications:', error);
      setError(error.message || 'Không thể đăng ký push notifications');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, permission]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !subscription) return false;

    setIsLoading(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const currentSubscription = await registration.pushManager.getSubscription();

      if (currentSubscription) {
        // Unsubscribe from browser
        await currentSubscription.unsubscribe();

        // Remove subscription from server
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subscription: currentSubscription.toJSON()
          })
        });
      }

      setSubscription(null);
      setIsSubscribed(false);
      
      return true;

    } catch (error: any) {
      console.error('Error unsubscribing from push notifications:', error);
      setError(error.message || 'Không thể hủy đăng ký push notifications');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, subscription]);

  // Send test notification
  const sendTestNotification = useCallback(async (): Promise<boolean> => {
    if (!isSubscribed || !subscription) return false;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/push/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Không thể gửi thông báo test');
      }

      return true;

    } catch (error: any) {
      console.error('Error sending test notification:', error);
      setError(error.message || 'Không thể gửi thông báo test');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSubscribed, subscription]);

  const value: PushNotificationContextType = {
    isSupported,
    isSubscribed,
    subscription,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    checkSubscription,
    sendTestNotification,
    permission
  };

  return (
    <PushNotificationContext.Provider value={value}>
      {children}
    </PushNotificationContext.Provider>
  );
};

// Utility functions
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function getBrowserInfo() {
  const ua = navigator.userAgent;
  let browserName = 'Unknown';
  let browserVersion = 'Unknown';

  if (ua.indexOf('Chrome') > -1) {
    browserName = 'Chrome';
    browserVersion = ua.match(/Chrome\/([0-9.]+)/)?.[1] || 'Unknown';
  } else if (ua.indexOf('Firefox') > -1) {
    browserName = 'Firefox';
    browserVersion = ua.match(/Firefox\/([0-9.]+)/)?.[1] || 'Unknown';
  } else if (ua.indexOf('Safari') > -1) {
    browserName = 'Safari';
    browserVersion = ua.match(/Version\/([0-9.]+)/)?.[1] || 'Unknown';
  } else if (ua.indexOf('Edge') > -1) {
    browserName = 'Edge';
    browserVersion = ua.match(/Edge\/([0-9.]+)/)?.[1] || 'Unknown';
  }

  return { name: browserName, version: browserVersion };
}
