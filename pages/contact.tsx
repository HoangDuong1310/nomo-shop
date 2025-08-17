import { useState } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import Layout from '../components/Layout';
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaClock, FaFacebook, FaInstagram, FaTwitter } from 'react-icons/fa';

const Contact: NextPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    
    // Giả lập gửi form
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      });
      
      // Đặt lại thông báo thành công sau 5 giây
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 5000);
    }, 1500);
  };

  return (
    <Layout>
      <Head>
        <title>Liên hệ - Cloud Shop</title>
        <meta name="description" content="Liên hệ với Cloud Shop - Dịch vụ đặt món trực tuyến qua mã QR" />
      </Head>

      <main>
        {/* Hero Section */}
        <section className="relative bg-primary-700 text-white py-24">
          <div className="container-custom relative z-10">
            <div className="max-w-3xl">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Liên hệ với chúng tôi
              </h1>
              <p className="text-lg md:text-xl opacity-90">
                Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn. Hãy liên hệ với chúng tôi nếu bạn có bất kỳ câu hỏi hay góp ý nào.
              </p>
            </div>
          </div>
          <div className="absolute inset-0 bg-black opacity-30"></div>
        </section>

        {/* Contact Info & Form */}
        <section className="py-16">
          <div className="container-custom">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Contact Information */}
              <div className="lg:col-span-1 space-y-8">
                <div className="card p-6">
                  <h2 className="text-2xl font-bold mb-6">Thông tin liên hệ</h2>
                  
                  <div className="space-y-6">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mt-1">
                        <FaMapMarkerAlt className="text-primary-600 text-xl" />
                      </div>
                      <div className="ml-4">
                        <h3 className="font-bold">Địa chỉ</h3>
                        <p className="text-gray-600">123 Đường ABC, Quận XYZ, TP.HCM</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mt-1">
                        <FaPhone className="text-primary-600 text-xl" />
                      </div>
                      <div className="ml-4">
                        <h3 className="font-bold">Điện thoại</h3>
                        <p className="text-gray-600">0123 456 789</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mt-1">
                        <FaEnvelope className="text-primary-600 text-xl" />
                      </div>
                      <div className="ml-4">
                        <h3 className="font-bold">Email</h3>
                        <p className="text-gray-600">info@cloudshop.com</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mt-1">
                        <FaClock className="text-primary-600 text-xl" />
                      </div>
                      <div className="ml-4">
                        <h3 className="font-bold">Giờ mở cửa</h3>
                        <p className="text-gray-600">Thứ 2 - Thứ 6: 8:00 - 22:00</p>
                        <p className="text-gray-600">Thứ 7 - Chủ nhật: 8:00 - 23:00</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card p-6">
                  <h2 className="text-2xl font-bold mb-6">Kết nối với chúng tôi</h2>
                  
                  <div className="flex space-x-4">
                    <a
                      href="https://facebook.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-10 h-10 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
                    >
                      <FaFacebook />
                    </a>
                    <a
                      href="https://instagram.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-10 h-10 bg-pink-600 text-white rounded-full hover:bg-pink-700 transition-colors"
                    >
                      <FaInstagram />
                    </a>
                    <a
                      href="https://twitter.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-10 h-10 bg-blue-400 text-white rounded-full hover:bg-blue-500 transition-colors"
                    >
                      <FaTwitter />
                    </a>
                  </div>
                </div>
              </div>
              
              {/* Contact Form */}
              <div className="lg:col-span-2">
                <div className="card p-6">
                  <h2 className="text-2xl font-bold mb-6">Gửi tin nhắn cho chúng tôi</h2>
                  
                  {submitSuccess ? (
                    <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-md mb-6">
                      <p className="font-medium">Tin nhắn đã được gửi thành công!</p>
                      <p className="text-sm">Chúng tôi sẽ phản hồi bạn trong thời gian sớm nhất.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                            Họ tên <span className="text-red-600">*</span>
                          </label>
                          <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="input-field"
                            placeholder="Nhập họ tên của bạn"
                          />
                        </div>

                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            Email <span className="text-red-600">*</span>
                          </label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="input-field"
                            placeholder="Nhập địa chỉ email"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                            Số điện thoại
                          </label>
                          <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="input-field"
                            placeholder="Nhập số điện thoại"
                          />
                        </div>

                        <div>
                          <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                            Chủ đề <span className="text-red-600">*</span>
                          </label>
                          <select
                            id="subject"
                            name="subject"
                            value={formData.subject}
                            onChange={handleChange}
                            required
                            className="input-field"
                          >
                            <option value="">-- Chọn chủ đề --</option>
                            <option value="general">Thông tin chung</option>
                            <option value="order">Vấn đề về đơn hàng</option>
                            <option value="products">Thông tin sản phẩm</option>
                            <option value="partnership">Hợp tác kinh doanh</option>
                            <option value="other">Khác</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                          Tin nhắn <span className="text-red-600">*</span>
                        </label>
                        <textarea
                          id="message"
                          name="message"
                          value={formData.message}
                          onChange={handleChange}
                          required
                          rows={5}
                          className="input-field"
                          placeholder="Nhập tin nhắn của bạn"
                        />
                      </div>

                      {submitError && (
                        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
                          <p>{submitError}</p>
                        </div>
                      )}

                      <div>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="btn-primary w-full py-3 flex items-center justify-center"
                        >
                          {isSubmitting ? 'Đang gửi...' : 'Gửi tin nhắn'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Map Section */}
        <section className="py-8 mb-8">
          <div className="container-custom">
            <h2 className="text-2xl font-bold mb-6">Vị trí của chúng tôi</h2>
            <div className="w-full h-96 bg-gray-200 rounded-lg overflow-hidden">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.5177580825924!2d106.69909847576016!3d10.771469989387564!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f4b3330bcc7%3A0x4db964d76bf6e18e!2zQsOqzIFuIFRow6BuaCwgUXXhuq1uIDEsIFRow6BuaCBwaOG7kSBI4buTIENow60gTWluaCwgVmnhu4d0IE5hbQ!5e0!3m2!1svi!2s!4v1687218414111!5m2!1svi!2s" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default Contact; 