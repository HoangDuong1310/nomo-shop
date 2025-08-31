import { useState, useEffect } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { 
  FaUser, 
  FaEnvelope, 
  FaPhone, 
  FaMapMarkerAlt, 
  FaCalendarAlt,
  FaEdit,
  FaShoppingBag,
  FaLock,
  FaHistory,
  FaSpinner
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useAuth } from '../../lib/context/AuthContext';
import PushNotificationToggle from '../../components/PushNotificationToggle';

const AccountProfile: NextPage = () => {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: ''
  });

  // Redirect nếu người dùng chưa đăng nhập
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth/login?returnUrl=/account');
    }
  }, [loading, isAuthenticated, router]);

  // Load user data vào form
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        address: user.address || ''
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const response = await fetch('/api/account/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Cập nhật thất bại');
      }

      // Cập nhật thành công
      toast.success('Cập nhật thông tin thành công!');
      setIsEditing(false);
      
      // Reload để cập nhật user context
      window.location.reload();
      
    } catch (error: any) {
      toast.error(error.message || 'Cập nhật thất bại. Vui lòng thử lại!');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
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
        <title>Tài khoản của tôi - Cloud Shop</title>
        <meta name="description" content="Thông tin tài khoản cá nhân" />
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
                <Link href="/account" className="block px-4 py-2 rounded-md bg-primary-50 text-primary-700 font-medium">
                  Thông tin tài khoản
                </Link>
                <Link href="/account/orders" className="block px-4 py-2 rounded-md text-gray-700 hover:bg-gray-50 flex items-center">
                  <FaShoppingBag className="mr-2" />
                  Lịch sử đơn hàng
                </Link>
                <Link href="/account/change-password" className="block px-4 py-2 rounded-md text-gray-700 hover:bg-gray-50 flex items-center">
                  <FaLock className="mr-2" />
                  Đổi mật khẩu
                </Link>
              </nav>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center">
                  <FaUser className="mr-2 text-primary-600" /> 
                  Thông tin cá nhân
                </h2>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`flex items-center px-4 py-2 rounded-md ${
                    isEditing 
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                  }`}
                >
                  <FaEdit className="mr-2" />
                  {isEditing ? 'Hủy' : 'Chỉnh sửa'}
                </button>
              </div>

              {isEditing ? (
                // Form chỉnh sửa
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Họ tên
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="input-field w-full"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email (không thể thay đổi)
                    </label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      className="input-field w-full bg-gray-100"
                      disabled
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="input-field w-full"
                    />
                  </div>

                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                      Địa chỉ
                    </label>
                    <textarea
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      rows={3}
                      className="input-field w-full"
                    />
                  </div>

                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      className="btn-primary px-6 py-2 flex items-center"
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <FaSpinner className="animate-spin mr-2" />
                          Đang lưu...
                        </>
                      ) : (
                        'Lưu thay đổi'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        // Reset form data
                        if (user) {
                          setFormData({
                            name: user.name || '',
                            phone: user.phone || '',
                            address: user.address || ''
                          });
                        }
                      }}
                      className="btn-outline px-6 py-2"
                      disabled={isSaving}
                    >
                      Hủy
                    </button>
                  </div>
                </form>
              ) : (
                // Hiển thị thông tin
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-start">
                      <FaUser className="text-primary-600 mr-3 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Họ tên</p>
                        <p className="font-medium">{user?.name || 'Chưa cập nhật'}</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <FaEnvelope className="text-primary-600 mr-3 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Email</p>
                        <p className="font-medium">{user?.email || 'Chưa cập nhật'}</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <FaPhone className="text-primary-600 mr-3 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Số điện thoại</p>
                        <p className="font-medium">{user?.phone || 'Chưa cập nhật'}</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <FaCalendarAlt className="text-primary-600 mr-3 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Ngày tham gia</p>
                        <p className="font-medium">
                          {user?.created_at ? formatDate(user.created_at) : 'Chưa cập nhật'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <FaMapMarkerAlt className="text-primary-600 mr-3 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Địa chỉ</p>
                      <p className="font-medium">{user?.address || 'Chưa cập nhật'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Notification Preferences */}
            <div className="mt-6 bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center">
                <FaUser className="mr-2 text-primary-600" /> 
                Cài đặt thông báo
              </h2>
              
              <div className="space-y-4">
                <p className="text-gray-600 mb-4">
                  Quản lý cách bạn nhận thông báo về đơn hàng, trạng thái cửa hàng và ưu đãi đặc biệt.
                </p>
                
                <PushNotificationToggle 
                  variant="card"
                  className="w-full"
                />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/account/orders" className="bg-white rounded-lg shadow p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <div className="bg-blue-100 rounded-full p-3 mr-4">
                    <FaHistory className="text-blue-600 text-xl" />
                  </div>
                  <div>
                    <h3 className="font-medium text-lg">Lịch sử đơn hàng</h3>
                    <p className="text-gray-500 text-sm">Xem các đơn hàng đã đặt</p>
                  </div>
                </div>
              </Link>

              <Link href="/account/change-password" className="bg-white rounded-lg shadow p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <div className="bg-green-100 rounded-full p-3 mr-4">
                    <FaLock className="text-green-600 text-xl" />
                  </div>
                  <div>
                    <h3 className="font-medium text-lg">Đổi mật khẩu</h3>
                    <p className="text-gray-500 text-sm">Cập nhật mật khẩu tài khoản</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AccountProfile;
