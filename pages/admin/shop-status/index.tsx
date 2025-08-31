import { useState, useEffect } from 'react';
import type { NextPage } from 'next';
import Head from 'next/head';
import AdminLayout from '../../../components/Layout/AdminLayout';
import { 
  FaClock, 
  FaSave, 
  FaToggleOn, 
  FaToggleOff, 
  FaSpinner,
  FaBell,
  FaStore,
  FaCalendarAlt,
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaExclamationTriangle,
  FaCheck
} from 'react-icons/fa';
import { toast } from 'react-toastify';

interface OperatingHours {
  id: number;
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_open: boolean;
}

interface ShopNotification {
  id: string;
  title: string;
  message: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  show_overlay: boolean;
}

const AdminShopStatus: NextPage = () => {
  const [operatingHours, setOperatingHours] = useState<OperatingHours[]>([]);
  const [notifications, setNotifications] = useState<ShopNotification[]>([]);
  const [emailSubscribers, setEmailSubscribers] = useState<any[]>([]);
  const [pushSubscriptions, setPushSubscriptions] = useState<any[]>([]);
  const [pushStats, setPushStats] = useState<any[]>([]);
  const [pushSettings, setPushSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('hours');
  const [forceStatus, setForceStatus] = useState<'auto' | 'open' | 'closed'>('auto');
  const [forceMessage, setForceMessage] = useState('');
  const [forceLoading, setForceLoading] = useState(false);

  // Notification management states
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [editingNotification, setEditingNotification] = useState<ShopNotification | null>(null);
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    start_date: '',
    end_date: '',
    show_overlay: false,
    is_active: true
  });

  // Push notification states
  const [showPushModal, setShowPushModal] = useState(false);
  const [pushForm, setPushForm] = useState({
    title: '',
    message: '',
    type: 'special_announcement',
    url: ''
  });
  const [pushSending, setPushSending] = useState(false);

  const dayNames = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadOperatingHours(),
        loadNotifications(),
        loadEmailSubscribers(),
        loadPushNotifications(),
        loadForceStatus()
      ]);
    } catch (error) {
      toast.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const loadOperatingHours = async () => {
    try {
      const response = await fetch('/api/admin/shop/operating-hours');
      if (response.ok) {
        const data = await response.json();
        setOperatingHours(data.operatingHours || []);
      }
    } catch (error) {
      console.error('Error loading operating hours:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      const response = await fetch('/api/admin/shop/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const loadEmailSubscribers = async () => {
    try {
      const response = await fetch('/api/admin/shop/email-subscribers');
      if (response.ok) {
        const data = await response.json();
        setEmailSubscribers(data.subscribers || []);
      }
    } catch (error) {
      console.error('Error loading email subscribers:', error);
    }
  };

  const loadPushNotifications = async () => {
    try {
      const response = await fetch('/api/admin/push/notifications');
      if (response.ok) {
        const data = await response.json();
        setPushSubscriptions(data.subscriptions || []);
        setPushStats(data.stats || []);
        setPushSettings(data.settings || {});
      }
    } catch (error) {
      console.error('Error loading push notifications:', error);
    }
  };

  const loadForceStatus = async () => {
    try {
      const response = await fetch('/api/admin/shop/force-status');
      if (response.ok) {
        const data = await response.json();
        setForceStatus(data.status || 'auto');
        setForceMessage(data.message || '');
      }
    } catch (error) {
      console.error('Error loading force status:', error);
    }
  };

  const updateForceStatus = async () => {
    setForceLoading(true);
    try {
      const response = await fetch('/api/admin/shop/force-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: forceStatus, 
          message: forceMessage 
        })
      });

      if (response.ok) {
        toast.success('Cập nhật trạng thái khẩn cấp thành công!');
        // Trigger a refresh of shop status for all users
        if (typeof window !== 'undefined') {
          // Broadcast to other tabs
          localStorage.setItem('shop-status-updated', Date.now().toString());
        }
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      toast.error('Cập nhật thất bại');
    } finally {
      setForceLoading(false);
    }
  };

  // Notification management functions
  const handleAddNotification = () => {
    setEditingNotification(null);
    setNotificationForm({
      title: '',
      message: '',
      start_date: '',
      end_date: '',
      show_overlay: false,
      is_active: true
    });
    setShowNotificationModal(true);
  };

  const handleEditNotification = (notification: ShopNotification) => {
    setEditingNotification(notification);
    setNotificationForm({
      title: notification.title,
      message: notification.message,
      start_date: notification.start_date.slice(0, 16), // Format for datetime-local input
      end_date: notification.end_date.slice(0, 16),
      show_overlay: notification.show_overlay,
      is_active: notification.is_active
    });
    setShowNotificationModal(true);
  };

  const handleDeleteNotification = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa thông báo này?')) return;

    try {
      const response = await fetch(`/api/admin/shop/notifications?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Xóa thông báo thành công!');
        loadNotifications();
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      toast.error('Xóa thông báo thất bại');
    }
  };

  const handleSaveNotification = async () => {
    if (!notificationForm.title || !notificationForm.message || !notificationForm.start_date || !notificationForm.end_date) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      const url = '/api/admin/shop/notifications';
      const method = editingNotification ? 'PUT' : 'POST';
      const body = editingNotification 
        ? { ...notificationForm, id: editingNotification.id }
        : notificationForm;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        toast.success(editingNotification ? 'Cập nhật thông báo thành công!' : 'Tạo thông báo thành công!');
        setShowNotificationModal(false);
        loadNotifications();
      } else {
        throw new Error('Save failed');
      }
    } catch (error) {
      toast.error('Lưu thông báo thất bại');
    }
  };

  // Push notification management functions
  const handleSendPushNotification = async () => {
    if (!pushForm.title || !pushForm.message) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    setPushSending(true);
    try {
      const response = await fetch('/api/admin/push/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pushForm)
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Đã gửi push notification thành công! (${data.sent} thành công, ${data.failed} thất bại)`);
        setShowPushModal(false);
        setPushForm({ title: '', message: '', type: 'special_announcement', url: '' });
        loadPushNotifications();
      } else {
        throw new Error('Send failed');
      }
    } catch (error) {
      toast.error('Gửi push notification thất bại');
    } finally {
      setPushSending(false);
    }
  };

  const handleDeletePushSubscription = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa push subscription này?')) return;

    try {
      const response = await fetch(`/api/admin/push/notifications?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Xóa push subscription thành công!');
        loadPushNotifications();
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      toast.error('Xóa push subscription thất bại');
    }
  };

  const updateOperatingHours = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/shop/operating-hours', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operatingHours })
      });

      if (response.ok) {
        toast.success('Cập nhật giờ hoạt động thành công!');
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      toast.error('Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  };

  const updateOperatingHour = (dayOfWeek: number, field: keyof OperatingHours, value: any) => {
    setOperatingHours(prev => 
      prev.map(hour => 
        hour.day_of_week === dayOfWeek 
          ? { ...hour, [field]: value }
          : hour
      )
    );
  };

  const formatTime = (time: string) => {
    return time ? time.slice(0, 5) : '';
  };

  const handleToggleSubscriberStatus = async (subscriber: any) => {
    const newStatus = !subscriber.is_active;
    try {
      const response = await fetch(`/api/admin/shop/email-subscribers/${subscriber.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: newStatus })
      });

      if (response.ok) {
        toast.success(`Đã ${newStatus ? 'kích hoạt' : 'vô hiệu hóa'} thành công email: ${subscriber.email}`);
        loadEmailSubscribers();
      } else {
        throw new Error('Toggle status failed');
      }
    } catch (error) {
      toast.error(`Đã ${newStatus ? 'kích hoạt' : 'vô hiệu hóa'} thất bại email: ${subscriber.email}`);
    }
  };

  const handleDeleteSubscriber = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa email này?')) return;

    try {
      const response = await fetch(`/api/admin/shop/email-subscribers/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Xóa email thành công!');
        loadEmailSubscribers();
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      toast.error('Xóa email thất bại');
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Quản lý trạng thái cửa hàng">
        <div className="flex items-center justify-center h-64">
          <FaSpinner className="animate-spin text-4xl text-primary-600" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Quản lý trạng thái cửa hàng">
      <Head>
        <title>Quản lý trạng thái cửa hàng - Admin</title>
      </Head>

      <div className="container-custom py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center">
              <FaStore className="mr-3 text-primary-600" />
              Quản lý trạng thái cửa hàng
            </h1>
            <p className="text-gray-600 mt-2">
              Cấu hình giờ hoạt động và thông báo đặc biệt cho cửa hàng
            </p>
          </div>

          {/* Tabs */}
          <div className="border-b">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('hours')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'hours'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FaClock className="inline mr-2" />
                Giờ hoạt động
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'notifications'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FaBell className="inline mr-2" />
                Thông báo đặc biệt
              </button>
              <button
                onClick={() => setActiveTab('subscribers')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'subscribers'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FaEye className="inline mr-2" />
                Email subscribers ({emailSubscribers.length})
              </button>
              <button
                onClick={() => setActiveTab('push')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'push'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FaBell className="inline mr-2" />
                Push notifications
              </button>
              <button
                onClick={() => setActiveTab('force')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'force'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FaExclamationTriangle className="inline mr-2" />
                Đóng cửa khẩn cấp
              </button>
            </nav>
          </div>

          {/* Operating Hours Tab */}
          {activeTab === 'hours' && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4">Giờ hoạt động hàng tuần</h2>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-blue-800 text-sm">
                    <strong>Lưu ý:</strong> Hệ thống sẽ tự động hiển thị thông báo đóng cửa khi ngoài giờ hoạt động. 
                    Khách hàng có thể đăng ký nhận email thông báo khi cửa hàng mở lại.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {operatingHours.map((hour, index) => (
                  <div key={hour.day_of_week} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <div className="w-24">
                      <span className="font-medium">{dayNames[hour.day_of_week]}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateOperatingHour(hour.day_of_week, 'is_open', !hour.is_open)}
                        className={`p-2 rounded ${hour.is_open ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {hour.is_open ? <FaToggleOn className="text-2xl" /> : <FaToggleOff className="text-2xl" />}
                      </button>
                      <span className={`text-sm font-medium ${hour.is_open ? 'text-green-600' : 'text-red-600'}`}>
                        {hour.is_open ? 'Mở cửa' : 'Đóng cửa'}
                      </span>
                    </div>

                    {hour.is_open && (
                      <>
                        <div className="flex items-center space-x-2">
                          <label className="text-sm font-medium">Mở cửa:</label>
                          <input
                            type="time"
                            value={formatTime(hour.open_time)}
                            onChange={(e) => updateOperatingHour(hour.day_of_week, 'open_time', e.target.value + ':00')}
                            className="input-field"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <label className="text-sm font-medium">Đóng cửa:</label>
                          <input
                            type="time"
                            value={formatTime(hour.close_time)}
                            onChange={(e) => updateOperatingHour(hour.day_of_week, 'close_time', e.target.value + ':00')}
                            className="input-field"
                          />
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <button
                  onClick={updateOperatingHours}
                  disabled={saving}
                  className="btn-primary flex items-center px-6 py-3"
                >
                  {saving ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <FaSave className="mr-2" />
                      Lưu giờ hoạt động
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Notifications Tab - Placeholder */}
          {activeTab === 'notifications' && (
            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Thông báo đặc biệt</h2>
                  <button
                    onClick={handleAddNotification}
                    className="btn-primary flex items-center px-4 py-2"
                  >
                    <FaPlus className="mr-2" />
                    Thêm thông báo
                  </button>
                </div>
                <p className="text-gray-600">
                  Quản lý thông báo đặc biệt như nghỉ lễ, maintenance, sự kiện đặc biệt
                </p>
              </div>

              {notifications.length > 0 ? (
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <div key={notification.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <h3 className="font-semibold text-gray-800 mr-3">
                              {notification.title}
                            </h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              notification.is_active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {notification.is_active ? 'Hoạt động' : 'Không hoạt động'}
                            </span>
                            {notification.show_overlay && (
                              <span className="ml-2 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Hiển thị overlay
                              </span>
                            )}
                          </div>
                          
                          <p className="text-gray-600 mb-3">{notification.message}</p>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                            <div>
                              <span className="font-medium">Bắt đầu:</span> {new Date(notification.start_date).toLocaleString('vi-VN')}
                            </div>
                            <div>
                              <span className="font-medium">Kết thúc:</span> {new Date(notification.end_date).toLocaleString('vi-VN')}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => handleEditNotification(notification)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                            title="Chỉnh sửa"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDeleteNotification(notification.id)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded transition-colors"
                            title="Xóa"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <FaBell className="text-4xl mx-auto mb-4 text-gray-300" />
                  <p>Chưa có thông báo đặc biệt nào</p>
                  <p className="text-sm mt-2">Tạo thông báo đầu tiên để thông báo cho khách hàng</p>
                </div>
              )}
            </div>
          )}

          {/* Email Subscribers Tab */}
          {activeTab === 'subscribers' && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2">Email Subscribers</h2>
                <p className="text-gray-600">
                  Danh sách khách hàng đăng ký nhận thông báo khi cửa hàng mở lại
                </p>
              </div>

              {emailSubscribers.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left font-medium text-gray-900">Email</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-900">Trạng thái</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-900">Ngày đăng ký</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-900">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {emailSubscribers.map((subscriber) => (
                        <tr key={subscriber.id}>
                          <td className="px-4 py-3">{subscriber.email}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              subscriber.is_active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {subscriber.is_active ? 'Hoạt động' : 'Không hoạt động'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {new Date(subscriber.created_at).toLocaleDateString('vi-VN')}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleToggleSubscriberStatus(subscriber)}
                                className={`px-3 py-1 rounded text-xs font-medium ${
                                  subscriber.is_active
                                    ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                }`}
                                title={subscriber.is_active ? 'Vô hiệu hóa' : 'Kích hoạt'}
                              >
                                {subscriber.is_active ? 'Vô hiệu' : 'Kích hoạt'}
                              </button>
                              <button
                                onClick={() => handleDeleteSubscriber(subscriber.id)}
                                className="px-3 py-1 rounded text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200"
                                title="Xóa"
                              >
                                Xóa
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <FaBell className="text-4xl mx-auto mb-4 text-gray-300" />
                  <p>Chưa có ai đăng ký nhận thông báo</p>
                </div>
              )}
            </div>
          )}

          {/* Push Notifications Tab */}
          {activeTab === 'push' && (
            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Push Notifications</h2>
                  <button
                    onClick={() => setShowPushModal(true)}
                    className="btn-primary flex items-center px-4 py-2"
                  >
                    <FaPlus className="mr-2" />
                    Gửi thông báo
                  </button>
                </div>
                <p className="text-gray-600">
                  Quản lý và gửi thông báo push đến người dùng đã đăng ký
                </p>
              </div>

              {/* Push Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <FaBell className="text-2xl text-blue-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Tổng subscribers</p>
                      <p className="text-2xl font-bold text-blue-600">{pushSubscriptions.length}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <FaCheck className="text-2xl text-green-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Active subscriptions</p>
                      <p className="text-2xl font-bold text-green-600">
                        {pushSubscriptions.filter(sub => sub.is_active).length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <FaSpinner className="text-2xl text-purple-600 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Sent today</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {pushStats.filter(stat => 
                          stat.date === new Date().toISOString().split('T')[0] && 
                          stat.status === 'sent'
                        ).reduce((sum, stat) => sum + stat.count, 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Push Subscriptions List */}
              {pushSubscriptions.length > 0 ? (
                <div className="bg-white border rounded-lg overflow-hidden">
                  <div className="px-6 py-4 border-b bg-gray-50">
                    <h3 className="text-lg font-medium">Push Subscriptions ({pushSubscriptions.length})</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            User
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Browser
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Registered
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {pushSubscriptions.map((subscription) => (
                          <tr key={subscription.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {subscription.user_email || subscription.user_name || 'Anonymous'}
                              </div>
                              {subscription.user_email && (
                                <div className="text-sm text-gray-500">{subscription.user_email}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {subscription.browser_info ? 
                                  JSON.parse(subscription.browser_info).name + ' ' + 
                                  JSON.parse(subscription.browser_info).version 
                                  : 'Unknown'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {subscription.browser_info ? 
                                  JSON.parse(subscription.browser_info).platform 
                                  : 'Unknown platform'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(subscription.created_at).toLocaleDateString('vi-VN')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                subscription.is_active
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {subscription.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => handleDeletePushSubscription(subscription.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Xóa subscription"
                              >
                                <FaTrash />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <FaBell className="text-4xl mx-auto mb-4 text-gray-300" />
                  <p>Chưa có push subscriptions</p>
                  <p className="text-sm mt-2">Khuyến khích người dùng bật thông báo push trên trang web</p>
                </div>
              )}
            </div>
          )}

          {/* Force Status Tab */}
          {activeTab === 'force' && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-2 text-red-600">
                  <FaExclamationTriangle className="inline mr-2" />
                  Đóng cửa khẩn cấp
                </h2>
                <p className="text-gray-600">
                  Tính năng này cho phép bạn ghi đè tự động hệ thống giờ hoạt động để đóng cửa khẩn cấp hoặc mở cửa trong trường hợp đặc biệt.
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <FaExclamationTriangle className="text-amber-500 mr-2 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-amber-800">Cảnh báo quan trọng</h3>
                    <p className="text-amber-700 text-sm mt-1">
                      Tính năng này sẽ ghi đè hoàn toàn hệ thống giờ hoạt động tự động. 
                      Khi được kích hoạt, trạng thái này sẽ có độ ưu tiên cao nhất.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {/* Status Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Chọn trạng thái cửa hàng
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="status-auto"
                        value="auto"
                        checked={forceStatus === 'auto'}
                        onChange={(e) => setForceStatus(e.target.value as 'auto')}
                        className="mr-3"
                      />
                      <label htmlFor="status-auto" className="flex items-center">
                        <FaClock className="text-blue-500 mr-2" />
                        <span className="font-medium">Tự động theo giờ hoạt động</span>
                        <span className="text-gray-500 text-sm ml-2">(Mặc định)</span>
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="status-open"
                        value="open"
                        checked={forceStatus === 'open'}
                        onChange={(e) => setForceStatus(e.target.value as 'open')}
                        className="mr-3"
                      />
                      <label htmlFor="status-open" className="flex items-center">
                        <FaStore className="text-green-500 mr-2" />
                        <span className="font-medium text-green-600">Buộc mở cửa</span>
                        <span className="text-gray-500 text-sm ml-2">(Bỏ qua giờ hoạt động)</span>
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="status-closed"
                        value="closed"
                        checked={forceStatus === 'closed'}
                        onChange={(e) => setForceStatus(e.target.value as 'closed')}
                        className="mr-3"
                      />
                      <label htmlFor="status-closed" className="flex items-center">
                        <FaExclamationTriangle className="text-red-500 mr-2" />
                        <span className="font-medium text-red-600">Đóng cửa khẩn cấp</span>
                        <span className="text-gray-500 text-sm ml-2">(Đóng cửa ngay lập tức)</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Custom Message */}
                {(forceStatus === 'open' || forceStatus === 'closed') && (
                  <div>
                    <label htmlFor="force-message" className="block text-sm font-medium text-gray-700 mb-2">
                      Thông báo tùy chỉnh {forceStatus === 'closed' ? '(hiển thị khi đóng cửa)' : '(hiển thị khi mở cửa đặc biệt)'}
                    </label>
                    <textarea
                      id="force-message"
                      value={forceMessage}
                      onChange={(e) => setForceMessage(e.target.value)}
                      placeholder={forceStatus === 'closed' ? 
                        "VD: Cửa hàng tạm nghỉ do có việc đột xuất. Xin lỗi quý khách vì sự bất tiện này." :
                        "VD: Cửa hàng đang mở cửa đặc biệt cho sự kiện khuyến mãi."
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                )}

                {/* Save Button */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-gray-500">
                    {forceStatus === 'auto' && 'Hệ thống sẽ hoạt động theo giờ hoạt động đã cấu hình'}
                    {forceStatus === 'open' && 'Cửa hàng sẽ luôn hiển thị là MỞ CỬA'}
                    {forceStatus === 'closed' && 'Cửa hàng sẽ hiển thị ĐÓNG CỬA và thông báo tùy chỉnh'}
                  </div>
                  
                  <button
                    onClick={updateForceStatus}
                    disabled={forceLoading}
                    className={`px-6 py-2 rounded-md font-medium flex items-center ${
                      forceStatus === 'closed' 
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : forceStatus === 'open'
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    } ${forceLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {forceLoading ? (
                      <FaSpinner className="animate-spin mr-2" />
                    ) : (
                      <FaSave className="mr-2" />
                    )}
                    {forceStatus === 'closed' ? 'Đóng cửa ngay' : 
                     forceStatus === 'open' ? 'Buộc mở cửa' : 'Lưu cài đặt'}
                  </button>
                </div>

                {/* Current Status Display */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-2">Trạng thái hiện tại:</h4>
                  <div className="flex items-center">
                    {forceStatus === 'auto' && (
                      <>
                        <FaClock className="text-blue-500 mr-2" />
                        <span className="text-blue-600 font-medium">Tự động theo giờ hoạt động</span>
                      </>
                    )}
                    {forceStatus === 'open' && (
                      <>
                        <FaStore className="text-green-500 mr-2" />
                        <span className="text-green-600 font-medium">Buộc mở cửa</span>
                      </>
                    )}
                    {forceStatus === 'closed' && (
                      <>
                        <FaExclamationTriangle className="text-red-500 mr-2" />
                        <span className="text-red-600 font-medium">Đóng cửa khẩn cấp</span>
                      </>
                    )}
                  </div>
                  {forceMessage && (forceStatus === 'open' || forceStatus === 'closed') && (
                    <div className="mt-2 text-sm text-gray-600">
                      <strong>Thông báo:</strong> {forceMessage}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notification Modal */}
      {showNotificationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-800">
                {editingNotification ? 'Chỉnh sửa thông báo' : 'Thêm thông báo mới'}
              </h3>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tiêu đề thông báo *
                  </label>
                  <input
                    type="text"
                    value={notificationForm.title}
                    onChange={(e) => setNotificationForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="VD: Nghỉ lễ Tết Nguyên Đán"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nội dung thông báo *
                  </label>
                  <textarea
                    value={notificationForm.message}
                    onChange={(e) => setNotificationForm(prev => ({ ...prev, message: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="VD: Cửa hàng sẽ nghỉ từ ngày 20/01 đến 25/01 để đón Tết. Xin lỗi quý khách vì sự bất tiện này."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Thời gian bắt đầu *
                    </label>
                    <input
                      type="datetime-local"
                      value={notificationForm.start_date}
                      onChange={(e) => setNotificationForm(prev => ({ ...prev, start_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Thời gian kết thúc *
                    </label>
                    <input
                      type="datetime-local"
                      value={notificationForm.end_date}
                      onChange={(e) => setNotificationForm(prev => ({ ...prev, end_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="show_overlay"
                      checked={notificationForm.show_overlay}
                      onChange={(e) => setNotificationForm(prev => ({ ...prev, show_overlay: e.target.checked }))}
                      className="mr-2"
                    />
                    <label htmlFor="show_overlay" className="text-sm font-medium text-gray-700">
                      Hiển thị overlay toàn màn hình
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={notificationForm.is_active}
                      onChange={(e) => setNotificationForm(prev => ({ ...prev, is_active: e.target.checked }))}
                      className="mr-2"
                    />
                    <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                      Kích hoạt ngay
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowNotificationModal(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveNotification}
                className="btn-primary px-6 py-2"
              >
                {editingNotification ? 'Cập nhật' : 'Tạo thông báo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Push Notification Modal */}
      {showPushModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Gửi Push Notification</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tiêu đề *
                </label>
                <input
                  type="text"
                  value={pushForm.title}
                  onChange={(e) => setPushForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Nhập tiêu đề thông báo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nội dung *
                </label>
                <textarea
                  value={pushForm.message}
                  onChange={(e) => setPushForm(prev => ({ ...prev, message: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Nhập nội dung thông báo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loại thông báo
                </label>
                <select
                  value={pushForm.type}
                  onChange={(e) => setPushForm(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="special_announcement">Thông báo đặc biệt</option>
                  <option value="shop_status">Trạng thái cửa hàng</option>
                  <option value="marketing">Marketing</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL (tùy chọn)
                </label>
                <input
                  type="text"
                  value={pushForm.url}
                  onChange={(e) => setPushForm(prev => ({ ...prev, url: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="https://example.com"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowPushModal(false)}
                disabled={pushSending}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSendPushNotification}
                disabled={pushSending}
                className="btn-primary px-6 py-2 flex items-center"
              >
                {pushSending ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <FaBell className="mr-2" />
                    Gửi thông báo
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminShopStatus;
