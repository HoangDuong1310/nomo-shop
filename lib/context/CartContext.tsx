import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

export type CartItem = {
  id: string;
  productId: string;
  name: string;
  price: number;
  image: string | null;
  quantity: number;
  option?: string; // Display string for options
  variantKey?: string; // Unique key for variant combination
};

type CartContextType = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id'>) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  itemsCount: number;
  subtotal: number;
  cartLoaded: boolean;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Sử dụng useLocalStorage để tự động sync với localStorage
  const [items, setItems, cartLoaded] = useLocalStorage<CartItem[]>('cart', []);
  
  const addItem = (item: Omit<CartItem, 'id'>) => {
    // Kiểm tra nếu sản phẩm đã có trong giỏ hàng với cùng variant combination
    const existingItemIndex = items.findIndex(
      (i) => i.productId === item.productId && 
             (item.variantKey ? i.variantKey === item.variantKey : i.option === item.option)
    );
    
    if (existingItemIndex > -1) {
      // Nếu đã có, tăng số lượng
      const updatedItems = [...items];
      updatedItems[existingItemIndex].quantity += item.quantity;
      setItems(updatedItems);
    } else {
      // Nếu chưa có, thêm mới
      const id = `${item.productId}-${item.variantKey || 'default'}-${Date.now()}`;
      const newItem = { id, ...item };
      setItems([...items, newItem]);
    }
  };
  
  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return;
    
    setItems(
      items.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };
  
  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };
  
  const clearCart = () => {
    setItems([]);
  };
  
  // Tính tổng số sản phẩm trong giỏ hàng
  const itemsCount = items.reduce((count, item) => count + item.quantity, 0);
  
  // Tính tổng giá trị giỏ hàng
  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
  
  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        itemsCount,
  subtotal,
  cartLoaded,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}; 