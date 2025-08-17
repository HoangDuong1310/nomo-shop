import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  // State để lưu giá trị
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);

  // Lấy giá trị từ localStorage khi component mount
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      console.log(`Loading from localStorage [${key}]:`, item);
      if (item) {
        const parsed = JSON.parse(item);
        console.log(`Parsed value for [${key}]:`, parsed);
        setStoredValue(parsed);
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
    } finally {
      setIsLoaded(true);
    }
  }, [key]);

  // Hàm để cập nhật localStorage
  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      if (isLoaded) {
        console.log(`Saving to localStorage [${key}]:`, value);
        window.localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [isLoaded ? storedValue : initialValue, setValue];
}
