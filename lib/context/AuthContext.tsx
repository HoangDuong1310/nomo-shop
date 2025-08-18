import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import { User } from '../auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

interface RegisterData {
  name: string;
  email: string;
  phone: string;
  address: string;
  password: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    // Kiểm tra người dùng đã đăng nhập chưa khi component được mount
    const checkLoggedIn = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers: any = {};
        
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
        
        const res = await fetch('/api/auth/me', { headers });
        
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Đăng nhập thất bại');
      }

      // Lưu token vào localStorage
      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      setUser(data.user);
      toast.success('Đăng nhập thành công!');
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Đăng nhập thất bại');
      return false;
    }
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Đăng ký thất bại');
      }

      toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Đăng ký thất bại');
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      // Xóa token khỏi localStorage
      localStorage.removeItem('token');
      
      setUser(null);
      toast.success('Đã đăng xuất');
      router.push('/');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Có lỗi xảy ra khi đăng xuất');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}; 