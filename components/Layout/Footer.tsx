import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaFacebook, FaInstagram, FaTwitter, FaMapMarkerAlt, FaPhone, FaEnvelope } from 'react-icons/fa';
import { useStoreInfo } from '../../lib/context/StoreInfoContext';

const Footer = () => {
  const { storeInfo } = useStoreInfo();

  // parse hours fallback
  const hours = storeInfo.store_hours || 'T2-T6: 8:00 - 22:00, T7-CN: 8:00 - 23:00';
  const parseStoreHours = (hoursStr: string) => {
    const parts = hoursStr.split(', ');
    return parts.map((part, index) => {
      const [days, time] = part.split(': ');
      return { days, time, key: index };
    });
  };
  const storeHours = parseStoreHours(hours);
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-xl font-bold mb-4">{storeInfo.store_name || 'Cloud Shop'}</h3>
            <p className="text-gray-400 mb-4">
              {storeInfo.store_description || 'Ứng dụng đặt món trực tuyến qua mã QR, giao hàng nhanh chóng trong bán kính 3km.'}
            </p>
            <div className="flex space-x-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <FaFacebook className="text-xl" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <FaInstagram className="text-xl" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <FaTwitter className="text-xl" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold mb-4">Liên kết nhanh</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/menu" className="text-gray-400 hover:text-white transition-colors">
                  Thực đơn
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-400 hover:text-white transition-colors">
                  Giới thiệu
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-white transition-colors">
                  Liên hệ
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="text-gray-400 hover:text-white transition-colors">
                  Chính sách bảo mật
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
                  Điều khoản sử dụng
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xl font-bold mb-4">Liên hệ</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <FaMapMarkerAlt className="text-primary-500 mt-1" />
                <span className="text-gray-400">{storeInfo.store_address || '123 Đường ABC, Quận XYZ, TP.HCM'}</span>
              </li>
              <li className="flex items-center space-x-3">
                <FaPhone className="text-primary-500" />
                <span className="text-gray-400">{storeInfo.store_phone || '0123 456 789'}</span>
              </li>
              <li className="flex items-center space-x-3">
                <FaEnvelope className="text-primary-500" />
                <span className="text-gray-400">{storeInfo.store_email || 'info@cloudshop.com'}</span>
              </li>
            </ul>
          </div>

          {/* Opening Hours */}
          <div>
            <h3 className="text-xl font-bold mb-4">Giờ mở cửa</h3>
            <ul className="space-y-2">
              {storeHours.map(({ days, time, key }) => (
                <li key={key} className="flex justify-between">
                  <span className="text-gray-400">{days}:</span>
                  <span className="text-gray-400">{time}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="container-custom py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-center md:text-left">
              © {new Date().getFullYear()} {storeInfo.store_name || 'Cloud Shop'}. Tất cả các quyền được bảo lưu.
            </p>
            <div className="mt-4 md:mt-0">
              <ul className="flex space-x-4 text-sm">
                <li>
                  <Link href="/privacy-policy" className="text-gray-400 hover:text-white transition-colors">
                    Chính sách bảo mật
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
                    Điều khoản sử dụng
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;