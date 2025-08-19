import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { toast } from 'react-toastify';
import { FaSync, FaPlus, FaSave, FaEdit, FaLink, FaGlobe, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import AdminLayout from '../../../components/Layout/AdminLayout';
import { useAuth } from '../../../lib/context/AuthContext';

interface RedirectItem { id: number; slug: string; target_url: string; is_active: number; hit_count: number; last_hit_at?: string; }

const AdminQrPage: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<RedirectItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [form, setForm] = useState({ slug: '', target_url: '', is_active: true });
  const [refreshing, setRefreshing] = useState(false);

  const loadList = async () => {
    setRefreshing(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch('/api/admin/qr/list', { headers: { Authorization: token ? `Bearer ${token}` : '' }});
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch {/* ignore */} finally { setRefreshing(false); }
  };

  useEffect(() => { loadList(); }, []);

  const resetForm = () => {
    setForm({ slug: '', target_url: '', is_active: true });
    setEditingSlug(null);
  };

  const startEdit = (r: RedirectItem) => {
    setForm({ slug: r.slug, target_url: r.target_url, is_active: r.is_active === 1 });
    setEditingSlug(r.slug);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.slug.trim() || !form.target_url.trim()) { toast.error('Điền đầy đủ slug & URL'); return; }
    setSaving(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch('/api/admin/qr/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Lỗi');
      toast.success(editingSlug ? 'Đã cập nhật' : 'Đã tạo');
      await loadList();
      if (!editingSlug) resetForm();
    } catch (err: any) {
      toast.error(err.message);
    } finally { setSaving(false); }
  };

  const toggleActive = async (r: RedirectItem) => {
    setLoading(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch('/api/admin/qr/update', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
        body: JSON.stringify({ slug: r.slug, target_url: r.target_url, is_active: !(r.is_active === 1) })
      });
      if (res.ok) {
        await loadList();
      }
    } catch { /* */ } finally { setLoading(false); }
  };

  if (!user || user.role !== 'admin') {
    return <AdminLayout title="QR Redirects"><div className="p-6">Bạn không có quyền.</div></AdminLayout>;
  }

  const baseDomain = typeof window !== 'undefined' ? window.location.origin : 'https://domain';

  return (
    <AdminLayout title="QR Redirects">
      <Head><title>QR Redirects - Cloud Shop Admin</title></Head>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold flex items-center"><FaLink className="mr-2 text-primary-600" /> Quản lý QR Redirects</h1>
            <p className="text-sm text-gray-600 mt-1">Tạo nhiều slug động. Mã QR in cố định dùng dạng: <code className="bg-gray-100 px-1 rounded">{baseDomain}/r/&lt;slug&gt;</code></p>
          </div>
          <div className="flex gap-2">
            <button onClick={resetForm} className="btn-primary flex items-center px-4 py-2 text-sm"><FaPlus className="mr-2" /> Mới</button>
            <button onClick={loadList} disabled={refreshing} className="border px-4 py-2 rounded flex items-center text-sm hover:bg-gray-50 disabled:opacity-50"><FaSync className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} /> Làm mới</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List */}
          <div className="lg:col-span-2 bg-white rounded shadow border overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h2 className="font-medium">Danh sách</h2>
              {loading && <span className="text-xs text-gray-500">Đang cập nhật...</span>}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                  <tr>
                    <th className="px-4 py-2 text-left">Slug</th>
                    <th className="px-4 py-2 text-left">Đích</th>
                    <th className="px-4 py-2">Lượt</th>
                    <th className="px-4 py-2">Trạng thái</th>
                    <th className="px-4 py-2">Sửa</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">Chưa có redirect</td></tr>
                  )}
                  {items.map(r => (
                    <tr key={r.slug} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2 font-mono text-primary-600">{r.slug}</td>
                      <td className="px-4 py-2 max-w-xs truncate" title={r.target_url}>{r.target_url}</td>
                      <td className="px-4 py-2 text-center">{r.hit_count}</td>
                      <td className="px-4 py-2 text-center">
                        <button onClick={() => toggleActive(r)} className="inline-flex items-center text-sm focus:outline-none">
                          {r.is_active === 1 ? <><FaToggleOn className="text-green-600 mr-1" /> <span className="text-green-700">Bật</span></> : <><FaToggleOff className="text-gray-400 mr-1" /> <span className="text-gray-500">Tắt</span></>}
                        </button>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button onClick={() => startEdit(r)} className="text-primary-600 hover:text-primary-700 flex items-center mx-auto"><FaEdit className="mr-1" />Sửa</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2 text-xs text-gray-500 border-t">Hiện {items.length} slug</div>
          </div>

          {/* Form */}
          <div className="bg-white rounded shadow border p-5 h-fit">
            <h2 className="font-medium mb-4 flex items-center">{editingSlug ? <>Chỉnh sửa: <span className="ml-1 font-mono text-primary-600">{editingSlug}</span></> : <>Tạo mới slug</>}</h2>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Slug</label>
                <input name="slug" value={form.slug} onChange={handleChange} disabled={!!editingSlug} className="input-field w-full" placeholder="vd: card" />
                <p className="text-xs text-gray-500 mt-1">URL quét: <code>{baseDomain}/r/{form.slug || '...'}</code></p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 flex items-center"><FaGlobe className="mr-1" /> Target URL</label>
                <input name="target_url" value={form.target_url} onChange={handleChange} className="input-field w-full" placeholder="https://..." />
              </div>
              <div className="flex items-center space-x-2">
                <input id="is_active" type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} className="h-4 w-4" />
                <label htmlFor="is_active" className="text-sm">Kích hoạt</label>
              </div>
              <div className="flex gap-2">
                <button disabled={saving} type="submit" className="btn-primary flex items-center px-4 py-2 text-sm disabled:opacity-50">{saving ? <><FaSave className="mr-2 animate-pulse" />Đang lưu...</> : <><FaSave className="mr-2" /> Lưu</>}</button>
                {editingSlug && <button type="button" onClick={resetForm} className="border px-4 py-2 rounded text-sm hover:bg-gray-50">Hủy</button>}
              </div>
            </form>
            <div className="mt-6 text-xs text-gray-500 space-y-1">
              <p>- Slug chỉ gồm a-z, 0-9, dấu gạch ngang hoặc gạch dưới.</p>
              <p>- Không dùng URL nội bộ vòng lặp (không trỏ lại /r/slug).</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded shadow p-5 border">
          <h3 className="font-medium mb-3">Hướng dẫn & Ghi chú</h3>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
              <li>Tạo slug một lần, in QR cố định; đổi đích bằng cách sửa target URL.</li>
              <li>Có thể dùng slug khác nhau cho chiến dịch marketing.</li>
              <li>Hit count tăng mỗi lần redirect thành công.</li>
            </ul>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminQrPage;
