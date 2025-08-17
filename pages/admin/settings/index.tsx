import { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { toast } from 'react-toastify';
import { 
  FaStore, 
  FaShippingFast, 
  FaCreditCard, 
  FaSave, 
  FaSpinner,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaEnvelope,
  FaClock,
  FaGlobe
} from 'react-icons/fa';
import AdminLayout from '../../../components/Layout/AdminLayout';

interface StoreSettings {
  store_name: string;
  store_description: string;
  store_address: string;
  store_phone: string;
  store_email: string;
  store_hours: string;
  store_website: string;
  store_lat?: string;
  store_lng?: string;
}

interface ShippingSettings {
  free_shipping_min_amount: number;
  free_shipping_radius: number;
  shipping_fee_per_km: number;
}

interface PaymentSettings {
  accept_cash: boolean;
  accept_bank_transfer: boolean;
  accept_credit_card: boolean;
  bank_account_name: string;
  bank_account_number: string;
  bank_name: string;
}

interface Settings {
  store: StoreSettings;
  shipping: ShippingSettings;
  payment: PaymentSettings;
}

const SettingsPage: NextPage = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'store' | 'shipping' | 'payment'>('store');
  const [settings, setSettings] = useState<Settings>({
    store: {
      store_name: '',
      store_description: '',
      store_address: '',
      store_phone: '',
      store_email: '',
      store_hours: '',
      store_website: '',
    },
    shipping: {
      free_shipping_min_amount: 0,
      free_shipping_radius: 0,
      shipping_fee_per_km: 0,
    },
    payment: {
      accept_cash: true,
      accept_bank_transfer: false,
      accept_credit_card: false,
      bank_account_name: '',
      bank_account_number: '',
      bank_name: '',
    }
  });

  // Fetch settings on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/admin/settings');
        if (!response.ok) throw new Error('Failed to fetch settings');
        const data = await response.json();
        setSettings(data);
      } catch (error) {
        console.error('Error fetching settings:', error);
        toast.error('Đã xảy ra lỗi khi tải thiết lập');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Handle input change for store settings
  const handleStoreInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      store: {
        ...prev.store,
        [name]: value
      }
    }));
  };

  // Handle input change for shipping settings
  const handleShippingInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      shipping: {
        ...prev.shipping,
        [name]: parseFloat(value) || 0
      }
    }));
  };

  // Handle checkbox change for payment settings
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      payment: {
        ...prev.payment,
        [name]: checked
      }
    }));
  };

  // Handle input change for payment settings
  const handlePaymentInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      payment: {
        ...prev.payment,
        [name]: value
      }
    }));
  };

  // Handle form submission
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      toast.success('Thiết lập đã được lưu thành công');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Đã xảy ra lỗi khi lưu thiết lập');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout title="Cài đặt hệ thống">
      <Head>
        <title>Cài đặt hệ thống - Cloud Shop Admin</title>
        <meta name="description" content="Thiết lập cửa hàng Cloud Shop" />
      </Head>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <FaSpinner className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <div className="border-b">
            <nav className="flex flex-wrap">
              <button
                onClick={() => setActiveTab('store')}
                className={`px-6 py-4 text-sm font-medium flex items-center ${
                  activeTab === 'store' 
                    ? 'border-b-2 border-primary-500 text-primary-600' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <FaStore className="mr-2" /> Thông tin cửa hàng
              </button>
              <button
                onClick={() => setActiveTab('shipping')}
                className={`px-6 py-4 text-sm font-medium flex items-center ${
                  activeTab === 'shipping' 
                    ? 'border-b-2 border-primary-500 text-primary-600' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <FaShippingFast className="mr-2" /> Giao hàng
              </button>
              <button
                onClick={() => setActiveTab('payment')}
                className={`px-6 py-4 text-sm font-medium flex items-center ${
                  activeTab === 'payment' 
                    ? 'border-b-2 border-primary-500 text-primary-600' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <FaCreditCard className="mr-2" /> Thanh toán
              </button>
            </nav>
          </div>

          <div className="p-6">
            <form onSubmit={handleSaveSettings}>
              {/* Store Information Settings */}
              {activeTab === 'store' && (
                <div className="space-y-6">
                  <div>
                    <label htmlFor="store_name" className="block text-sm font-medium text-gray-700 mb-1">
                      Tên cửa hàng
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="store_name"
                        name="store_name"
                        value={settings.store.store_name}
                        onChange={handleStoreInputChange}
                        className="input-field pr-10 w-full"
                        placeholder="Nhập tên cửa hàng"
                      />
                      <FaStore className="absolute right-3 top-3 text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="store_description" className="block text-sm font-medium text-gray-700 mb-1">
                      Mô tả cửa hàng
                    </label>
                    <textarea
                      id="store_description"
                      name="store_description"
                      rows={3}
                      value={settings.store.store_description}
                      onChange={handleStoreInputChange}
                      className="input-field w-full"
                      placeholder="Nhập mô tả ngắn về cửa hàng"
                    />
                  </div>

                  <div>
                    <label htmlFor="store_address" className="block text-sm font-medium text-gray-700 mb-1">
                      Địa chỉ
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="store_address"
                        name="store_address"
                        value={settings.store.store_address}
                        onChange={handleStoreInputChange}
                        className="input-field pr-10 w-full"
                        placeholder="Nhập địa chỉ cửa hàng"
                      />
                      <FaMapMarkerAlt className="absolute right-3 top-3 text-gray-400" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="store_lat" className="block text-sm font-medium text-gray-700 mb-1">
                        Vĩ độ (Latitude)
                      </label>
                      <input
                        type="text"
                        id="store_lat"
                        name="store_lat"
                        value={settings.store.store_lat || ''}
                        onChange={handleStoreInputChange}
                        className="input-field w-full"
                        placeholder="VD: 10.776889"
                      />
                    </div>
                    <div>
                      <label htmlFor="store_lng" className="block text-sm font-medium text-gray-700 mb-1">
                        Kinh độ (Longitude)
                      </label>
                      <input
                        type="text"
                        id="store_lng"
                        name="store_lng"
                        value={settings.store.store_lng || ''}
                        onChange={handleStoreInputChange}
                        className="input-field w-full"
                        placeholder="VD: 106.700806"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="store_phone" className="block text-sm font-medium text-gray-700 mb-1">
                        Số điện thoại
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          id="store_phone"
                          name="store_phone"
                          value={settings.store.store_phone}
                          onChange={handleStoreInputChange}
                          className="input-field pr-10 w-full"
                          placeholder="Nhập số điện thoại"
                        />
                        <FaPhoneAlt className="absolute right-3 top-3 text-gray-400" />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="store_email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          id="store_email"
                          name="store_email"
                          value={settings.store.store_email}
                          onChange={handleStoreInputChange}
                          className="input-field pr-10 w-full"
                          placeholder="Nhập email"
                        />
                        <FaEnvelope className="absolute right-3 top-3 text-gray-400" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="store_hours" className="block text-sm font-medium text-gray-700 mb-1">
                        Giờ mở cửa
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          id="store_hours"
                          name="store_hours"
                          value={settings.store.store_hours}
                          onChange={handleStoreInputChange}
                          className="input-field pr-10 w-full"
                          placeholder="Ví dụ: T2-T6: 7:00 - 22:00"
                        />
                        <FaClock className="absolute right-3 top-3 text-gray-400" />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="store_website" className="block text-sm font-medium text-gray-700 mb-1">
                        Website
                      </label>
                      <div className="relative">
                        <input
                          type="url"
                          id="store_website"
                          name="store_website"
                          value={settings.store.store_website}
                          onChange={handleStoreInputChange}
                          className="input-field pr-10 w-full"
                          placeholder="Nhập URL website"
                        />
                        <FaGlobe className="absolute right-3 top-3 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Shipping Settings */}
              {activeTab === 'shipping' && (
                <div className="space-y-6">
                  <div>
                    <label htmlFor="free_shipping_min_amount" className="block text-sm font-medium text-gray-700 mb-1">
                      Giá trị đơn hàng tối thiểu để được miễn phí giao hàng
                    </label>
                    <div className="relative mt-1">
                      <input
                        type="number"
                        id="free_shipping_min_amount"
                        name="free_shipping_min_amount"
                        value={settings.shipping.free_shipping_min_amount}
                        onChange={handleShippingInputChange}
                        className="input-field pr-20 w-full"
                        placeholder="0"
                        min="0"
                        step="1000"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
                        VNĐ
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Đặt 0 nếu không áp dụng chính sách này
                    </p>
                  </div>

                  <div>
                    <label htmlFor="free_shipping_radius" className="block text-sm font-medium text-gray-700 mb-1">
                      Bán kính giao hàng miễn phí
                    </label>
                    <div className="relative mt-1">
                      <input
                        type="number"
                        id="free_shipping_radius"
                        name="free_shipping_radius"
                        value={settings.shipping.free_shipping_radius}
                        onChange={handleShippingInputChange}
                        className="input-field pr-10 w-full"
                        placeholder="0"
                        min="0"
                        step="0.5"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
                        km
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Đặt 0 nếu không áp dụng chính sách này
                    </p>
                  </div>

                  <div>
                    <label htmlFor="shipping_fee_per_km" className="block text-sm font-medium text-gray-700 mb-1">
                      Phí giao hàng tính theo km
                    </label>
                    <div className="relative mt-1">
                      <input
                        type="number"
                        id="shipping_fee_per_km"
                        name="shipping_fee_per_km"
                        value={settings.shipping.shipping_fee_per_km}
                        onChange={handleShippingInputChange}
                        className="input-field pr-20 w-full"
                        placeholder="0"
                        min="0"
                        step="1000"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
                        VNĐ/km
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Settings */}
              {activeTab === 'payment' && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <input
                        id="accept_cash"
                        name="accept_cash"
                        type="checkbox"
                        checked={settings.payment.accept_cash}
                        onChange={handleCheckboxChange}
                        className="h-5 w-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                      />
                      <label htmlFor="accept_cash" className="ml-2 block text-sm text-gray-900">
                        Chấp nhận thanh toán tiền mặt khi giao hàng (COD)
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        id="accept_bank_transfer"
                        name="accept_bank_transfer"
                        type="checkbox"
                        checked={settings.payment.accept_bank_transfer}
                        onChange={handleCheckboxChange}
                        className="h-5 w-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                      />
                      <label htmlFor="accept_bank_transfer" className="ml-2 block text-sm text-gray-900">
                        Chấp nhận thanh toán chuyển khoản ngân hàng
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        id="accept_credit_card"
                        name="accept_credit_card"
                        type="checkbox"
                        checked={settings.payment.accept_credit_card}
                        onChange={handleCheckboxChange}
                        className="h-5 w-5 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                      />
                      <label htmlFor="accept_credit_card" className="ml-2 block text-sm text-gray-900">
                        Chấp nhận thanh toán thẻ tín dụng/ghi nợ
                      </label>
                    </div>
                  </div>

                  {settings.payment.accept_bank_transfer && (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mt-4 space-y-4">
                      <h3 className="font-medium text-gray-900">Thông tin tài khoản ngân hàng</h3>
                      
                      <div>
                        <label htmlFor="bank_name" className="block text-sm font-medium text-gray-700 mb-1">
                          Tên ngân hàng
                        </label>
                        <input
                          type="text"
                          id="bank_name"
                          name="bank_name"
                          value={settings.payment.bank_name}
                          onChange={handlePaymentInputChange}
                          className="input-field w-full"
                          placeholder="Nhập tên ngân hàng"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="bank_account_name" className="block text-sm font-medium text-gray-700 mb-1">
                          Tên chủ tài khoản
                        </label>
                        <input
                          type="text"
                          id="bank_account_name"
                          name="bank_account_name"
                          value={settings.payment.bank_account_name}
                          onChange={handlePaymentInputChange}
                          className="input-field w-full"
                          placeholder="Nhập tên chủ tài khoản"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="bank_account_number" className="block text-sm font-medium text-gray-700 mb-1">
                          Số tài khoản
                        </label>
                        <input
                          type="text"
                          id="bank_account_number"
                          name="bank_account_number"
                          value={settings.payment.bank_account_number}
                          onChange={handlePaymentInputChange}
                          className="input-field w-full"
                          placeholder="Nhập số tài khoản"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-8 border-t pt-6">
                <button
                  type="submit"
                  className="btn-primary flex items-center justify-center w-full sm:w-auto"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <FaSave className="mr-2" />
                      Lưu thiết lập
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default SettingsPage; 