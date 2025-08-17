import { useState, useEffect } from 'react';
import { NextPage, GetServerSideProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';
import { 
  FaArrowLeft, 
  FaSave, 
  FaSpinner
} from 'react-icons/fa';
import AdminLayout from '../../../../components/Layout/AdminLayout';
import ImageUpload from '../../../../components/ImageUpload';
import Link from 'next/link';
import { executeQuery } from '../../../../lib/db';
import { verifyToken } from '../../../../lib/auth';

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  sale_price: number | null;
  image: string | null;
  category_id: string;
  category_name: string;
  stock_quantity: number;
  is_featured: boolean;
  is_active: boolean;
  options: any;
}

interface EditProductPageProps {
  product: Product | null;
  error?: string;
}

const EditProductPage: NextPage<EditProductPageProps> = ({ product, error }) => {
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

  // Fetch categories on component mount and set form data
  useEffect(() => {
    // Hiển thị lỗi nếu có
    if (error) {
      toast.error(error);
      return;
    }

    // Kiểm tra xem có dữ liệu sản phẩm không
    if (!product) {
      toast.error('Không tìm thấy thông tin sản phẩm');
      router.push('/admin/products');
      return;
    }

    // Đổ dữ liệu sản phẩm vào form
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      sale_price: product.sale_price?.toString() || '',
      image: product.image || '',
      category_id: product.category_id,
      stock_quantity: product.stock_quantity.toString(),
      is_featured: product.is_featured,
      is_active: product.is_active
    });

    // Lấy danh sách danh mục
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        } else {
          toast.error('Không thể tải danh mục sản phẩm');
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('Đã xảy ra lỗi khi tải danh mục sản phẩm');
      }
    };

    fetchCategories();
  }, [product, error, router]);

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
    
    if (!product) return;

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
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          price: Number(formData.price),
          sale_price: formData.sale_price ? Number(formData.sale_price) : null,
          image: formData.image || null,
          category_id: formData.category_id,
          stock_quantity: Number(formData.stock_quantity),
          is_featured: formData.is_featured,
          is_active: formData.is_active
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Cập nhật sản phẩm thành công');
        router.push('/admin/products');
      } else {
        throw new Error(data.message || 'Không thể cập nhật sản phẩm');
      }
    } catch (error: any) {
      toast.error(error.message || 'Đã xảy ra lỗi khi cập nhật sản phẩm');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!product) {
    return (
      <AdminLayout title="Chỉnh sửa sản phẩm">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Đang tải dữ liệu...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Chỉnh sửa sản phẩm">
      <Head>
        <title>Chỉnh sửa sản phẩm - Cloud Shop Admin</title>
        <meta name="description" content="Chỉnh sửa sản phẩm - Cloud Shop Admin" />
      </Head>

      <div className="mb-6">
        <Link href="/admin/products" className="inline-flex items-center text-primary-600 hover:underline">
          <FaArrowLeft className="mr-1" /> Danh sách sản phẩm
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Chỉnh sửa thông tin sản phẩm</h2>
          <p className="text-sm text-gray-500">Chỉnh sửa thông tin chi tiết về sản phẩm</p>
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
              Vui lòng quản lý Size/Màu sắc/Topping và giá bổ sung tại mục "Quản lý Variants" của sản phẩm.
            </div>
            <div className="mt-3">
              <Link href={`/admin/products/variants/${product?.id}`} className="btn-primary inline-block">Quản lý Variants</Link>
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
                Lưu thay đổi
              </>
            )}
          </button>
        </div>
      </form>
    </AdminLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const { id } = context.params || {};
    
    // Lấy token từ cookie
    const token = context.req.cookies.auth_token;
    
    if (!token) {
      return {
        redirect: {
          destination: '/auth/login?returnUrl=' + encodeURIComponent(context.resolvedUrl),
          permanent: false,
        },
      };
    }
    
    // Verify token
    const decodedToken = verifyToken(token);
    
    if (!decodedToken || !decodedToken.id) {
      return {
        redirect: {
          destination: '/auth/login?returnUrl=' + encodeURIComponent(context.resolvedUrl),
          permanent: false,
        },
      };
    }

    // Kiểm tra quyền admin
    const userResult = await executeQuery({
      query: 'SELECT role FROM users WHERE id = ?',
      values: [decodedToken.id],
    });

    if ((userResult as any[]).length === 0 || (userResult as any[])[0].role !== 'admin') {
      return {
        redirect: {
          destination: '/',
          permanent: false,
        },
      };
    }
    
    // Lấy thông tin sản phẩm
    const productResult = await executeQuery({
      query: `
        SELECT p.*, c.name AS category_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id = ?
      `,
      values: [id],
    });
    
    if ((productResult as any[]).length === 0) {
      return {
        props: {
          product: null,
          error: 'Không tìm thấy sản phẩm',
        },
      };
    }
    
    const product = (productResult as any[])[0];
    
    // Xử lý options nếu có
    if (product.options && typeof product.options === 'string') {
      try {
        product.options = JSON.parse(product.options);
      } catch (error) {
        console.error('Error parsing product options:', error);
        product.options = null;
      }
    }
    
    // Xử lý dữ liệu để tránh lỗi serialize Date
    const serializedProduct = JSON.parse(JSON.stringify(product));
    
    return {
      props: {
        product: serializedProduct,
      },
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      props: {
        product: null,
        error: 'Có lỗi xảy ra khi tải thông tin sản phẩm',
      },
    };
  }
};

export default EditProductPage;