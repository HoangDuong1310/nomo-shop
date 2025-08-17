import { useState, useEffect } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import { 
  FaArrowLeft, 
  FaSave, 
  FaSpinner
} from 'react-icons/fa';
import AdminLayout from '../../../components/Layout/AdminLayout';
import ImageUpload from '../../../components/ImageUpload';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
}

const AddProductPage: NextPage = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    sale_price: '',
    image: '',
    category_id: '',
    stock_quantity: '0',
    is_featured: false,
    is_active: true
  });

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
          
          // Nếu có danh mục, set mặc định cho category_id
          if (data.length > 0) {
            setFormData(prev => ({ ...prev, category_id: data[0].id }));
          }
        } else {
          toast.error('Không thể tải danh mục sản phẩm');
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('Đã xảy ra lỗi khi tải danh mục sản phẩm');
      }
    };

    fetchCategories();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  // Xử lý submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
    if (!formData.name) {
      toast.error('Vui lòng nhập tên sản phẩm');
      return;
    }

    if (!formData.price || isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      toast.error('Giá sản phẩm phải là số và lớn hơn 0');
      return;
    }

    if (formData.sale_price && (isNaN(Number(formData.sale_price)) || Number(formData.sale_price) <= 0)) {
      toast.error('Giá khuyến mãi phải là số và lớn hơn 0');
      return;
    }

    if (formData.sale_price && Number(formData.sale_price) >= Number(formData.price)) {
      toast.error('Giá khuyến mãi phải nhỏ hơn giá gốc');
      return;
    }

    if (!formData.category_id) {
      toast.error('Vui lòng chọn danh mục sản phẩm');
      return;
    }

    if (isNaN(Number(formData.stock_quantity)) || Number(formData.stock_quantity) < 0) {
      toast.error('Số lượng tồn kho phải là số và không âm');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/products/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          price: Number(formData.price),
          sale_price: formData.sale_price ? Number(formData.sale_price) : null,
          image: formData.image,
          category_id: formData.category_id,
          stock_quantity: Number(formData.stock_quantity),
          is_featured: formData.is_featured,
          is_active: formData.is_active
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Thêm sản phẩm thành công. Tiếp tục cấu hình variants.');
        if (data?.product_id) {
          router.push(`/admin/products/variants/${data.product_id}`);
        } else {
          router.push('/admin/products');
        }
      } else {
        throw new Error(data.message || 'Không thể thêm sản phẩm');
      }
    } catch (error: any) {
      toast.error(error.message || 'Đã xảy ra lỗi khi thêm sản phẩm');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout title="Thêm sản phẩm mới">
      <Head>
        <title>Thêm sản phẩm mới - Cloud Shop Admin</title>
        <meta name="description" content="Thêm sản phẩm mới - Cloud Shop Admin" />
      </Head>

      <div className="mb-6">
        <Link href="/admin/products" className="inline-flex items-center text-primary-600 hover:underline">
          <FaArrowLeft className="mr-1" /> Danh sách sản phẩm
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Thông tin sản phẩm</h2>
          <p className="text-sm text-gray-500">Nhập thông tin chi tiết về sản phẩm</p>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tên sản phẩm */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Tên sản phẩm <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="input-field w-full"
                required
              />
            </div>
            
            {/* Danh mục */}
            <div>
              <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-1">
                Danh mục <span className="text-red-600">*</span>
              </label>
              <select
                id="category_id"
                name="category_id"
                value={formData.category_id}
                onChange={handleInputChange}
                className="input-field w-full"
                required
              >
                <option value="">-- Chọn danh mục --</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
            
            {/* Giá */}
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                Giá bán (VND) <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                className="input-field w-full"
                min="0"
                step="1000"
                required
              />
            </div>
            
            {/* Giá khuyến mãi */}
            <div>
              <label htmlFor="sale_price" className="block text-sm font-medium text-gray-700 mb-1">
                Giá khuyến mãi (VND)
              </label>
              <input
                type="number"
                id="sale_price"
                name="sale_price"
                value={formData.sale_price}
                onChange={handleInputChange}
                className="input-field w-full"
                min="0"
                step="1000"
              />
            </div>
            
            {/* Hình ảnh */}
            <div className="col-span-1 md:col-span-2">
              <ImageUpload
                currentImage={formData.image}
                onImageChange={(imageUrl) => setFormData(prev => ({ ...prev, image: imageUrl }))}
                label="Hình ảnh sản phẩm"
              />
            </div>
            
            {/* Số lượng tồn kho */}
            <div>
              <label htmlFor="stock_quantity" className="block text-sm font-medium text-gray-700 mb-1">
                Số lượng tồn kho
              </label>
              <input
                type="number"
                id="stock_quantity"
                name="stock_quantity"
                value={formData.stock_quantity}
                onChange={handleInputChange}
                className="input-field w-full"
                min="0"
              />
            </div>
          </div>
          
          {/* Mô tả */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả sản phẩm
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleInputChange}
              className="input-field w-full"
            ></textarea>
          </div>
          
          {/* Trạng thái */}
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_featured"
                name="is_featured"
                checked={formData.is_featured}
                onChange={handleCheckboxChange}
                className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
              />
              <label htmlFor="is_featured" className="ml-2 text-sm font-medium text-gray-700">
                Sản phẩm nổi bật
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={formData.is_active}
                onChange={handleCheckboxChange}
                className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
              />
              <label htmlFor="is_active" className="ml-2 text-sm font-medium text-gray-700">
                Sản phẩm còn bán
              </label>
            </div>
          </div>
          
          {/* Hướng dẫn quản lý variants */}
          <div className="border-t pt-6">
            <div className="rounded-md bg-blue-50 p-4 text-sm text-blue-800">
              Sau khi lưu sản phẩm, bạn sẽ được chuyển tới trang "Quản lý Variants" để cấu hình Size/Màu sắc/Topping và giá bổ sung.
            </div>
          </div>
        </div>
        
        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
          <Link href="/admin/products" className="btn-outline mr-3">
            Hủy
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary flex items-center"
          >
            {isSubmitting ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                Đang xử lý...
              </>
            ) : (
              <>
                <FaSave className="mr-2" />
                Lưu sản phẩm
              </>
            )}
          </button>
        </div>
      </form>
    </AdminLayout>
  );
};

export default AddProductPage;