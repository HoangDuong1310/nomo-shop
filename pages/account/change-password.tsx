import { useState, useEffect } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { FaUser, FaLock, FaSave } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useAuth } from '../../lib/context/AuthContext';

const ChangePassword: NextPage = () => {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isUpdating, setIsUpdating] = useState(false);

  // Redirect nếu người dùng chưa đăng nhập
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth/login?returnUrl=/account/change-password');
    }
  }, [isAuthenticated, loading, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Xóa lỗi khi người dùng bắt đầu nhập lại
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại';
    }
    
    if (!formData.newPassword) {
      newErrors.newPassword = 'Vui lòng nhập mật khẩu mới';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Mật khẩu mới phải có ít nhất 6 ký tự';
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsUpdating(true);
    
    try {
      const response = await fetch('/api/account/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Đổi mật khẩu thất bại');
      }
      
      toast.success('Đổi mật khẩu thành công');
      
      // Xóa dữ liệu form
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
    } catch (error: any) {
      toast.error(error.message || 'Đổi mật khẩu thất bại. Vui lòng thử lại!');
    } finally {
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container-custom my-12 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return null; // Sẽ được chuyển hướng bởi useEffect
  }

  return (
    <Layout>
      <Head>
        <title>Đổi mật khẩu - Cloud Shop</title>
        <meta name="description" content="Đổi mật khẩu tài khoản" />
      </Head>
      
      <div className="container-custom py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Tài khoản của tôi</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="bg-primary-100 rounded-full p-3">
                  <FaUser className="text-primary-600 text-xl" />
                </div>
                <div>
                  <h2 className="font-medium text-lg">{user?.name}</h2>
                  <p className="text-gray-500 text-sm">{user?.email}</p>
                </div>
              </div>
              
              <nav className="space-y-2">
                <Link href="/account" className="block px-4 py-2 rounded-md text-gray-700 hover:bg-gray-50">
                  Thông tin tài khoản
                </Link>
                <Link href="/account/orders" className="block px-4 py-2 rounded-md text-gray-700 hover:bg-gray-50">
                  Lịch sử đơn hàng
                </Link>
                <Link href="/account/change-password" className="block px-4 py-2 rounded-md bg-primary-50 text-primary-700 font-medium">
                  Đổi mật khẩu
                </Link>
              </nav>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-6">Đổi mật khẩu</h2>
              
              <form onSubmit={handleSubmit}>
                {/* Mật khẩu hiện tại */}
                <div className="mb-4">
                  <label htmlFor="currentPassword" className="block text-gray-700 font-medium mb-2">
                    Mật khẩu hiện tại
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                      <FaLock />
                    </span>
                    <input
                      type="password"
                      id="currentPassword"
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleChange}
                      className={`input-field pl-10 ${errors.currentPassword ? 'border-red-500' : ''}`}
                      placeholder="Nhập mật khẩu hiện tại"
                    />
                  </div>
                  {errors.currentPassword && <p className="text-red-500 text-sm mt-1">{errors.currentPassword}</p>}
                </div>
                
                {/* Mật khẩu mới */}
                <div className="mb-4">
                  <label htmlFor="newPassword" className="block text-gray-700 font-medium mb-2">
                    Mật khẩu mới
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                      <FaLock />
                    </span>
                    <input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      className={`input-field pl-10 ${errors.newPassword ? 'border-red-500' : ''}`}
                      placeholder="Nhập mật khẩu mới"
                    />
                  </div>
                  {errors.newPassword && <p className="text-red-500 text-sm mt-1">{errors.newPassword}</p>}
                </div>
                
                {/* Xác nhận mật khẩu mới */}
                <div className="mb-6">
                  <label htmlFor="confirmPassword" className="block text-gray-700 font-medium mb-2">
                    Xác nhận mật khẩu mới
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                      <FaLock />
                    </span>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`input-field pl-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                      placeholder="Xác nhận mật khẩu mới"
                    />
                  </div>
                  {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                </div>
                
                {/* Submit button */}
                <div>
                  <button
                    type="submit"
                    className="btn-primary py-2 px-6 flex items-center justify-center"
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <span className="inline-block h-5 w-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></span>
                    ) : (
                      <FaSave className="mr-2" />
                    )}
                    {isUpdating ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ChangePassword; 