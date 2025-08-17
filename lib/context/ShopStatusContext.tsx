import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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

  const fetchShopStatus = async () => {
    try {
      const response = await fetch('/api/shop/status');
      const data = await response.json();
      
      setShopStatus(data);
      
      // Show overlay if shop is closed or has special notification
      if (!data.isOpen && (data.status === 'closed' || data.status === 'special_notification')) {
        // Check if user has dismissed overlay today
        const dismissedToday = localStorage.getItem(`shop-overlay-dismissed-${new Date().toDateString()}`);
        if (!dismissedToday) {
          setShowOverlay(true);
        }
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

  // Handle overlay dismiss
  const handleSetShowOverlay = (show: boolean) => {
    setShowOverlay(show);
    
    if (!show && shopStatus && !shopStatus.isOpen) {
      // Store dismissal for today
      localStorage.setItem(`shop-overlay-dismissed-${new Date().toDateString()}`, 'true');
    }
  };

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
