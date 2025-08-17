import { ReactNode, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
  FaHome, 
  FaBoxOpen, 
  FaListUl, 
  FaShoppingBag, 
  FaUsers, 
  FaChartBar, 
  FaCog, 
  FaBars, 
  FaTimes, 
  FaSignOutAlt,
  FaBell,
  FaStore
} from 'react-icons/fa';
import { useAuth } from '../../lib/context/AuthContext';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
}

const AdminLayout = ({ children, title }: AdminLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();
  const { user, isAuthenticated, loading, logout } = useAuth();

  // Kiểm tra quyền admin
  useEffect(() => {
    if (!loading && (!isAuthenticated || (user && user.role !== 'admin'))) {
      router.push('/auth/login?returnUrl=/admin');
    }
  }, [isAuthenticated, loading, user, router]);

  // Kiểm tra kích thước màn hình
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (loading || !isAuthenticated || (user && user.role !== 'admin')) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Menu items for sidebar
  const menuItems = [
    {
      title: 'Tổng quan',
      icon: <FaHome className="w-5 h-5" />,
      href: '/admin',
      active: router.pathname === '/admin',
    },
    {
      title: 'Sản phẩm',
      icon: <FaBoxOpen className="w-5 h-5" />,
      href: '/admin/products',
      active: router.pathname.startsWith('/admin/products'),
    },
    {
      title: 'Danh mục',
      icon: <FaListUl className="w-5 h-5" />,
      href: '/admin/categories',
      active: router.pathname.startsWith('/admin/categories'),
    },
    {
      title: 'Đơn hàng',
      icon: <FaShoppingBag className="w-5 h-5" />,
      href: '/admin/orders',
      active: router.pathname.startsWith('/admin/orders'),
    },
    {
      title: 'Khách hàng',
      icon: <FaUsers className="w-5 h-5" />,
      href: '/admin/customers',
      active: router.pathname.startsWith('/admin/customers'),
    },
    {
      title: 'Báo cáo',
      icon: <FaChartBar className="w-5 h-5" />,
      href: '/admin/reports',
      active: router.pathname.startsWith('/admin/reports'),
    },
    {
      title: 'Trạng thái cửa hàng',
      icon: <FaStore className="w-5 h-5" />,
      href: '/admin/shop-status',
      active: router.pathname.startsWith('/admin/shop-status'),
    },
    {
      title: 'Cài đặt',
      icon: <FaCog className="w-5 h-5" />,
      href: '/admin/settings',
      active: router.pathname.startsWith('/admin/settings'),
    },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div 
        className={`${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed inset-y-0 left-0 z-30 w-64 transition duration-300 transform bg-white shadow-lg md:relative md:translate-x-0`}
      >
        <div className="flex items-center justify-between h-16 px-6 bg-primary-600">
          <Link href="/admin" className="text-xl font-bold text-white">
            Cloud Shop Admin
          </Link>
          <button 
            onClick={toggleSidebar}
            className="p-1 text-white rounded-md md:hidden focus:outline-none"
          >
            <FaTimes className="w-6 h-6" />
          </button>
        </div>

        <div className="px-2 py-4 overflow-y-auto">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-100 ${
                    item.active ? 'bg-gray-100 text-primary-600 font-medium' : ''
                  }`}
                >
                  <div className={`${item.active ? 'text-primary-600' : 'text-gray-500'}`}>
                    {item.icon}
                  </div>
                  <span className="ml-3">{item.title}</span>
                </Link>
              </li>
            ))}
          </ul>
          
          <div className="pt-4 mt-4 border-t">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-100"
            >
              <FaSignOutAlt className="w-5 h-5 text-gray-500" />
              <span className="ml-3">Đăng xuất</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between h-16 px-6 bg-white shadow">
          <div className="flex items-center">
            <button 
              onClick={toggleSidebar}
              className="p-1 mr-4 text-gray-500 rounded-md md:hidden focus:outline-none focus:shadow-outline"
            >
              <FaBars className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-semibold">{title}</h1>
          </div>

          <div className="flex items-center">
            <button className="p-2 mr-4 text-gray-500 hover:text-gray-700">
              <FaBell className="w-5 h-5" />
            </button>
            <div className="flex items-center">
              <div className="hidden mr-3 text-right md:block">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">Quản trị viên</p>
              </div>
              <div className="w-8 h-8 overflow-hidden bg-gray-300 rounded-full">
                <div className="flex items-center justify-center w-full h-full bg-primary-600 text-white">
                  {user?.name?.charAt(0)}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Backdrop for mobile */}
      {isSidebarOpen && isMobile && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
    </div>
  );
};

export default AdminLayout; 