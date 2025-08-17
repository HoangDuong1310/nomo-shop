import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  FaShoppingCart, 
  FaUser, 
  FaBars, 
  FaTimes, 
  FaSignOutAlt, 
  FaUserCircle,
  FaHistory,
  FaCog
} from 'react-icons/fa';
import { useAuth } from '../../lib/context/AuthContext';

type HeaderProps = {
  cartItemsCount?: number;
};

const Header = ({ cartItemsCount = 0 }: HeaderProps) => {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  // Đóng menu người dùng khi click bên ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuRef]);

  // Xử lý đăng xuất
  const handleLogout = async () => {
    await logout();
    setIsUserMenuOpen(false);
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container-custom py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold text-primary-600">
            Cloud Shop
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className={`${router.pathname === '/' ? 'text-primary-600 font-medium' : 'text-gray-700 hover:text-primary-600'} transition-colors`}>
              Trang chủ
            </Link>
            <Link href="/menu" className={`${router.pathname === '/menu' ? 'text-primary-600 font-medium' : 'text-gray-700 hover:text-primary-600'} transition-colors`}>
              Thực đơn
            </Link>
            <Link href="/about" className={`${router.pathname === '/about' ? 'text-primary-600 font-medium' : 'text-gray-700 hover:text-primary-600'} transition-colors`}>
              Giới thiệu
            </Link>
            <Link href="/contact" className={`${router.pathname === '/contact' ? 'text-primary-600 font-medium' : 'text-gray-700 hover:text-primary-600'} transition-colors`}>
              Liên hệ
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center space-x-4">
            {/* Cart Button */}
            <Link href="/cart" className="relative p-2 text-gray-700 hover:text-primary-600 transition-colors">
              <FaShoppingCart className="text-xl" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </Link>
            
            {/* User Button / Menu */}
            <div className="hidden md:block relative">
              {isAuthenticated ? (
                <div className="relative">
                  <button 
                    onClick={toggleUserMenu}
                    className="p-2 text-gray-700 hover:text-primary-600 transition-colors flex items-center"
                  >
                    <FaUserCircle className="text-xl mr-2" />
                    <span className="font-medium">{user?.name?.split(' ')[0]}</span>
                  </button>
                  
                  {/* User Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div 
                      ref={userMenuRef}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50"
                    >
                      <Link href="/account" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center">
                        <FaUser className="mr-2 text-primary-600" />
                        Tài khoản của tôi
                      </Link>
                      <Link href="/account/orders" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center">
                        <FaHistory className="mr-2 text-primary-600" />
                        Lịch sử đơn hàng
                      </Link>
                      {user?.role === 'admin' && (
                        <Link href="/admin" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center">
                          <FaCog className="mr-2 text-primary-600" />
                          Quản trị viên
                        </Link>
                      )}
                      <button 
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <FaSignOutAlt className="mr-2 text-primary-600" />
                        Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/auth/login" className="p-2 text-gray-700 hover:text-primary-600 transition-colors flex items-center">
                  <FaUser className="text-xl mr-2" />
                  <span>Đăng nhập</span>
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2 text-gray-700 hover:text-primary-600 focus:outline-none transition-colors" 
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden pt-4 pb-2 border-t mt-4 space-y-3">
            <Link href="/" className={`block py-2 px-4 ${router.pathname === '/' ? 'text-primary-600 font-medium' : 'text-gray-700'}`}>
              Trang chủ
            </Link>
            <Link href="/menu" className={`block py-2 px-4 ${router.pathname === '/menu' ? 'text-primary-600 font-medium' : 'text-gray-700'}`}>
              Thực đơn
            </Link>
            <Link href="/about" className={`block py-2 px-4 ${router.pathname === '/about' ? 'text-primary-600 font-medium' : 'text-gray-700'}`}>
              Giới thiệu
            </Link>
            <Link href="/contact" className={`block py-2 px-4 ${router.pathname === '/contact' ? 'text-primary-600 font-medium' : 'text-gray-700'}`}>
              Liên hệ
            </Link>
            
            {/* Mobile User Menu */}
            {isAuthenticated ? (
              <>
                <div className="block py-2 px-4 font-medium text-primary-600">
                  <FaUserCircle className="inline mr-2" />
                  Xin chào, {user?.name?.split(' ')[0]}
                </div>
                <Link href="/account" className="block py-2 px-4 text-gray-700 pl-8">
                  Tài khoản của tôi
                </Link>
                <Link href="/account/orders" className="block py-2 px-4 text-gray-700 pl-8">
                  Lịch sử đơn hàng
                </Link>
                {user?.role === 'admin' && (
                  <Link href="/admin" className="block py-2 px-4 text-gray-700 pl-8">
                    Quản trị viên
                  </Link>
                )}
                <button 
                  onClick={handleLogout} 
                  className="block w-full text-left py-2 px-4 text-gray-700 pl-8"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <Link href="/auth/login" className={`block py-2 px-4 ${router.pathname === '/auth/login' ? 'text-primary-600 font-medium' : 'text-gray-700'}`}>
                Đăng nhập / Đăng ký
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header; 