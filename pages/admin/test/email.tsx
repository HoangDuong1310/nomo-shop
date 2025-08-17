import React, { useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { toast } from 'react-hot-toast';
import AdminLayout from '../../../components/Layout/AdminLayout';

const EmailTestPage: NextPage = () => {
  const [email, setEmail] = useState('');
  const [templateType, setTemplateType] = useState('welcome');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const handleTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Vui lòng nhập email');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/test/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          template_type: templateType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send test email');
      }

      toast.success('Email test đã được gửi thành công!');
      setResults([data, ...results]);

    } catch (error: any) {
      console.error('Test email error:', error);
      toast.error(error.message || 'Đã xảy ra lỗi khi gửi email test');
    } finally {
      setLoading(false);
    }
  };

  const templateOptions = [
    { value: 'welcome', label: '🎉 Welcome Email' },
    { value: 'order_confirmation', label: '📦 Order Confirmation' },
    { value: 'payment_success', label: '💳 Payment Success' },
    { value: 'order_status_update', label: '📋 Order Status Update' },
    { value: 'admin_new_order', label: '🔔 Admin New Order Alert' },
  ];

  return (
    <AdminLayout title="Email Testing">
      <Head>
        <title>Email Testing - Cloud Shop Admin</title>
      </Head>

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">📧 Email System Testing</h1>
          <p className="text-gray-600">
            Test và kiểm tra hoạt động của hệ thống email notification
          </p>
        </div>

        {/* Test Form */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">🧪 Gửi Email Test</h2>
          
          <form onSubmit={handleTestEmail} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email nhận test
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="test@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="templateType" className="block text-sm font-medium text-gray-700 mb-2">
                Loại email template
              </label>
              <select
                id="templateType"
                value={templateType}
                onChange={(e) => setTemplateType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {templateOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang gửi...
                </>
              ) : (
                '📤 Gửi Email Test'
              )}
            </button>
          </form>
        </div>

        {/* Email Templates Preview */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">👁️ Preview Email Templates</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { name: 'welcome.html', label: 'Welcome Email', icon: '🎉' },
              { name: 'order-confirmation.html', label: 'Order Confirmation', icon: '📦' },
              { name: 'payment-success.html', label: 'Payment Success', icon: '💳' },
              { name: 'order-status-update.html', label: 'Status Update', icon: '📋' },
              { name: 'admin-new-order.html', label: 'Admin Alert', icon: '🔔' },
            ].map((template) => (
              <div key={template.name} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="text-center">
                  <div className="text-2xl mb-2">{template.icon}</div>
                  <h3 className="font-medium text-gray-900 mb-2">{template.label}</h3>
                  <a
                    href={`/test-emails/${template.name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-200 transition-colors"
                  >
                    👁️ Preview
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Test Results */}
        {results.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">📊 Kết quả Test</h2>
            
            <div className="space-y-3">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    result.success
                      ? 'bg-green-50 border-green-200 text-green-800'
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">
                        {result.success ? '✅' : '❌'} {result.template_type}
                      </span>
                      <span className="ml-2 text-sm opacity-75">
                        → {result.recipient}
                      </span>
                    </div>
                    <div className="text-xs opacity-75">
                      {new Date(result.timestamp).toLocaleString('vi-VN')}
                    </div>
                  </div>
                  <div className="mt-1 text-sm">
                    {result.message}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Configuration Info */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">⚙️ Cấu hình Email</h3>
          <div className="text-sm text-yellow-700 space-y-1">
            <p><strong>SMTP Host:</strong> {process.env.SMTP_HOST || 'Not configured'}</p>
            <p><strong>SMTP Port:</strong> {process.env.SMTP_PORT || 'Not configured'}</p>
            <p><strong>From Email:</strong> {process.env.SMTP_USER || 'Not configured'}</p>
            <p><strong>Admin Email:</strong> {process.env.ADMIN_EMAIL || 'Not configured'}</p>
          </div>
          
          {!process.env.SMTP_USER && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              ⚠️ <strong>Cần cấu hình SMTP:</strong> Vui lòng cập nhật SMTP_USER và SMTP_PASS trong file .env.local
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default EmailTestPage;
