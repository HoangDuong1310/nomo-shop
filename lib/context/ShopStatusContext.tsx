import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from './AuthContext';

interface ShopStatus {
  isOpen: boolean;
  status: 'open' | 'closed' | 'special_notification';
  message: string;
  title?: string;
  nextOpenTime?: string;
  currentTime: string;
  operatingHours?: {
    today: {
      day_of_week: number;
      open_time: string;
      close_time: string;
      is_open: boolean;
    };
  };
}

interface ShopStatusContextType {
  shopStatus: ShopStatus | null;
  loading: boolean;
  showOverlay: boolean;
  setShowOverlay: (show: boolean) => void;
  refreshStatus: () => Promise<void>;
}

const ShopStatusContext = createContext<ShopStatusContextType | undefined>(undefined);

interface ShopStatusProviderProps {
  children: ReactNode;
}

export const ShopStatusProvider = ({ children }: ShopStatusProviderProps) => {
  const [shopStatus, setShopStatus] = useState<ShopStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showOverlay, setShowOverlay] = useState<boolean>(false);
  const router = useRouter();
  const { user } = useAuth();

  const fetchShopStatus = async () => {
    try {
      const response = await fetch('/api/shop/status');
      const data = await response.json();

      setShopStatus(data);

      // Luôn hiển thị overlay khi đóng ngoại trừ admin hoặc route /admin
      if (!data.isOpen && (data.status === 'closed' || data.status === 'special_notification')) {
        const isAdminRoute = router.pathname.startsWith('/admin');
        const isAuthRoute = router.pathname.startsWith('/auth');
        const isAdminUser = user?.role === 'admin';
        setShowOverlay(!(isAdminRoute || isAuthRoute || isAdminUser));
      } else {
        setShowOverlay(false);
      }

    } catch (error) {
      console.error('Error fetching shop status:', error);
      // Fallback: assume shop is open
      setShopStatus({
        isOpen: true,
        status: 'open',
        message: 'Cửa hàng đang hoạt động',
        currentTime: new Date().toISOString()
      });
      setShowOverlay(false);
    } finally {
      setLoading(false);
    }
  };

  const refreshStatus = async () => {
    setLoading(true);
    await fetchShopStatus();
  };

  // Fetch status on mount
  useEffect(() => {
    fetchShopStatus();
  }, []);

  // Refresh status every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchShopStatus();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  // Disable dismiss when shop đóng: chỉ cho phép tắt nếu mở lại
  const handleSetShowOverlay = (show: boolean) => {
    if (shopStatus && !shopStatus.isOpen) {
      // Cho phép tắt nếu là admin hoặc trong admin route
  const isAdminRoute = router.pathname.startsWith('/admin');
  const isAuthRoute = router.pathname.startsWith('/auth');
  const isAdminUser = user?.role === 'admin';
  if (!(isAdminRoute || isAuthRoute || isAdminUser)) {
        setShowOverlay(true);
        return;
      }
    }
    setShowOverlay(show);
  };

  // Re-evaluate overlay khi thay đổi user hoặc route
  useEffect(() => {
    if (!shopStatus) return;
    if (!shopStatus.isOpen) {
      const isAdminRoute = router.pathname.startsWith('/admin');
      const isAuthRoute = router.pathname.startsWith('/auth');
      const isAdminUser = user?.role === 'admin';
      setShowOverlay(!(isAdminRoute || isAuthRoute || isAdminUser));
    }
  }, [user, router.pathname]);

  return (
    <ShopStatusContext.Provider 
      value={{ 
        shopStatus, 
        loading, 
        showOverlay, 
        setShowOverlay: handleSetShowOverlay, 
        refreshStatus 
      }}
    >
      {children}
    </ShopStatusContext.Provider>
  );
};

export const useShopStatus = () => {
  const context = useContext(ShopStatusContext);
  
  if (context === undefined) {
    throw new Error('useShopStatus must be used within a ShopStatusProvider');
  }
  
  return context;
};
