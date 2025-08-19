import React, { createContext, useContext, useEffect, useState } from 'react';

interface StoreInfo {
  store_name: string;
  store_description?: string;
  store_address?: string;
  store_phone?: string;
  store_email?: string;
  store_hours?: string;
  store_website?: string;
  [key: string]: any;
}

interface StoreInfoContextType {
  storeInfo: StoreInfo;
  loading: boolean;
  refresh: () => Promise<void>;
}

const DEFAULT_STORE: StoreInfo = {
  store_name: 'Cloud Shop',
  store_description: '',
  store_address: '',
  store_phone: '',
  store_email: '',
  store_hours: '',
  store_website: ''
};

const StoreInfoContext = createContext<StoreInfoContextType | undefined>(undefined);

export const StoreInfoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const preloaded: StoreInfo | undefined = typeof window !== 'undefined' ? (window as any).__STORE_INFO__ : undefined;
  const [storeInfo, setStoreInfo] = useState<StoreInfo>(preloaded ? { ...DEFAULT_STORE, ...preloaded } : DEFAULT_STORE);
  const [loading, setLoading] = useState(!preloaded);

  const fetchStoreInfo = async () => {
    try {
      const res = await fetch('/api/public/store-info');
      const data = await res.json();
      if (data.success && data.storeInfo) {
        setStoreInfo({ ...storeInfo, ...data.storeInfo });
      }
    } catch (e) {
      console.error('Fetch store info error', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!preloaded) {
      fetchStoreInfo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <StoreInfoContext.Provider value={{ storeInfo, loading, refresh: fetchStoreInfo }}>
      {children}
    </StoreInfoContext.Provider>
  );
};

export const useStoreInfo = () => {
  const ctx = useContext(StoreInfoContext);
  if (!ctx) throw new Error('useStoreInfo must be used within StoreInfoProvider');
  return ctx;
};
