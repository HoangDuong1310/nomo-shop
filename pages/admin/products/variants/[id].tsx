import { useState, useEffect } from 'react';
import { NextPage, GetServerSideProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { 
  FaArrowLeft, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaSave,
  FaSpinner,
  FaExclamationTriangle,
  FaMagic
} from 'react-icons/fa';
import AdminLayout from '../../../../components/Layout/AdminLayout';
import VariantWizard from '../../../../components/VariantWizard';
import { executeQuery } from '../../../../lib/db';
import { verifyToken } from '../../../../lib/auth';

interface Product {
  id: string;
  name: string;
  price: number;
  options: any;
}

interface ProductVariant {
  id: string;
  variant_name: string;
  variant_value: string;
  price_adjustment: number;
  stock_quantity: number;
  is_active: boolean;
}

interface VariantGroup {
  name: string;
  variants: ProductVariant[];
}

interface ProductVariantsPageProps {
  product: Product | null;
  error?: string;
}

const ProductVariantsPage: NextPage<ProductVariantsPageProps> = ({ product, error }) => {
  const router = useRouter();
  const { id } = router.query;
  
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [variantGroups, setVariantGroups] = useState<VariantGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    variant_name: '',
    variant_value: '',
    price_adjustment: '0',
    stock_quantity: '0',
    is_active: true
  });

  useEffect(() => {
    if (id) {
      fetchVariants();
    }
  }, [id]);

  const fetchVariants = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/products/variants-unified?productId=${id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setVariants(data.data.variants || []);
          groupVariants(data.data.variants || []);
        } else {
          toast.error(data.message || 'Không thể tải danh sách variants');
        }
      } else {
        toast.error('Không thể tải danh sách variants');
      }
    } catch (error) {
      console.error('Error fetching variants:', error);
      toast.error('Đã xảy ra lỗi khi tải variants');
    } finally {
      setIsLoading(false);
    }
  };

  const groupVariants = (variantList: ProductVariant[]) => {
    const groups: { [key: string]: ProductVariant[] } = {};
    
    variantList.forEach(variant => {
      if (!groups[variant.variant_name]) {
        groups[variant.variant_name] = [];
      }
      groups[variant.variant_name].push(variant);
    });

    const groupedVariants = Object.keys(groups).map(name => ({
      name,
      variants: groups[name]
    }));

    setVariantGroups(groupedVariants);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const resetForm = () => {
    setFormData({
      variant_name: '',
      variant_value: '',
      price_adjustment: '0',
      stock_quantity: '0',
      is_active: true
    });
  };

  const handleAddVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/products/variants-unified', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: id,
          variantName: formData.variant_name,
          variantValue: formData.variant_value,
          priceAdjustment: Number(formData.price_adjustment),
          stockQuantity: Number(formData.stock_quantity),
          isActive: formData.is_active
        }),
      });

      if (response.ok) {
        toast.success('Thêm variant thành công');
        setShowAddModal(false);
        resetForm();
        fetchVariants();
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Không thể thêm variant');
      }
    } catch (error: any) {
      toast.error(error.message || 'Đã xảy ra lỗi khi thêm variant');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditVariant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariant) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/products/variants-unified', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          variantId: selectedVariant.id,
          priceAdjustment: Number(formData.price_adjustment),
          stockQuantity: Number(formData.stock_quantity),
          isActive: formData.is_active
        }),
      });

      if (response.ok) {
        toast.success('Cập nhật variant thành công');
        setShowEditModal(false);
        setSelectedVariant(null);
        resetForm();
        fetchVariants();
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Không thể cập nhật variant');
      }
    } catch (error: any) {
      toast.error(error.message || 'Đã xảy ra lỗi khi cập nhật variant');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteVariant = async () => {
    if (!selectedVariant) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/products/variants-unified', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          variantId: selectedVariant.id
        }),
      });

      if (response.ok) {
        toast.success('Xóa variant thành công');
        setShowDeleteModal(false);
        setSelectedVariant(null);
        fetchVariants();
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Không thể xóa variant');
      }
    } catch (error: any) {
      toast.error(error.message || 'Đã xảy ra lỗi khi xóa variant');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    setFormData({
      variant_name: variant.variant_name,
      variant_value: variant.variant_value,
      price_adjustment: variant.price_adjustment.toString(),
      stock_quantity: variant.stock_quantity.toString(),
      is_active: variant.is_active
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    setShowDeleteModal(true);
  };

  if (error || !product) {
    return (
      <AdminLayout title="Lỗi">
        <div className="text-center py-12">
          <p className="text-red-600 text-lg">{error || 'Không tìm thấy sản phẩm'}</p>
          <Link href="/admin/products" className="btn-primary mt-4 inline-block">
            Quay lại danh sách sản phẩm
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={`Quản lý Variants - ${product.name}`}>
      <Head>
        <title>Quản lý Variants - {product.name} - Cloud Shop Admin</title>
      </Head>

      <div className="mb-6">
        <Link href="/admin/products" className="inline-flex items-center text-primary-600 hover:underline">
          <FaArrowLeft className="mr-1" /> Danh sách sản phẩm
        </Link>
      </div>

      {/* Product Info */}
      <div className="bg-white rounded-lg shadow mb-6 p-6">
        <h2 className="text-xl font-semibold mb-2">{product.name}</h2>
        <p className="text-gray-600">Giá gốc: <span className="font-medium">{product.price.toLocaleString('vi-VN')}đ</span></p>
      </div>

      {/* Variants Management */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">Product Variants</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowWizard(true)}
              className="btn-primary flex items-center"
            >
              <FaMagic className="mr-2" /> 🎯 Wizard Tạo Variants
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-outline flex items-center"
            >
              <FaPlus className="mr-2" /> Thêm 1 Variant
            </button>
          </div>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <FaSpinner className="animate-spin text-primary-600 text-2xl" />
            </div>
          ) : variantGroups.length > 0 ? (
            <div className="space-y-6">
              {variantGroups.map((group) => (
                <div key={group.name} className="border rounded-lg p-4">
                  <h4 className="font-medium text-lg mb-3">{group.name}</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Giá trị</th>
                          <th className="px-4 py-2 text-center text-sm font-medium text-gray-500">Giá bổ sung</th>
                          <th className="px-4 py-2 text-center text-sm font-medium text-gray-500">Tồn kho</th>
                          <th className="px-4 py-2 text-center text-sm font-medium text-gray-500">Trạng thái</th>
                          <th className="px-4 py-2 text-center text-sm font-medium text-gray-500">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {group.variants.map((variant) => (
                          <tr key={variant.id}>
                            <td className="px-4 py-2 font-medium">{variant.variant_value}</td>
                            <td className="px-4 py-2 text-center">
                              {variant.price_adjustment > 0 ? (
                                <span className="text-green-600">+{variant.price_adjustment.toLocaleString('vi-VN')}đ</span>
                              ) : variant.price_adjustment < 0 ? (
                                <span className="text-red-600">{variant.price_adjustment.toLocaleString('vi-VN')}đ</span>
                              ) : (
                                <span className="text-gray-500">Miễn phí</span>
                              )}
                            </td>
                            <td className="px-4 py-2 text-center">{variant.stock_quantity}</td>
                            <td className="px-4 py-2 text-center">
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                variant.is_active 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {variant.is_active ? 'Hoạt động' : 'Tạm dừng'}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-center">
                              <div className="flex justify-center space-x-2">
                                <button
                                  onClick={() => openEditModal(variant)}
                                  className="text-indigo-600 hover:text-indigo-900"
                                  title="Sửa"
                                >
                                  <FaEdit />
                                </button>
                                <button
                                  onClick={() => openDeleteModal(variant)}
                                  className="text-red-600 hover:text-red-900"
                                  title="Xóa"
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Chưa có variant nào. Bấm "Thêm Variant" để tạo variant đầu tiên.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Variant Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleAddVariant}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Thêm Variant Mới</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tên nhóm variant <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        name="variant_name"
                        value={formData.variant_name}
                        onChange={handleInputChange}
                        className="input-field w-full"
                        placeholder="VD: Size, Topping, Nhiệt độ"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Giá trị variant <span className="text-red-600">*</span>
                      </label>
                      <input
                        type="text"
                        name="variant_value"
                        value={formData.variant_value}
                        onChange={handleInputChange}
                        className="input-field w-full"
                        placeholder="VD: Size L, Thêm trứng, Nóng"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Giá bổ sung (VND)
                      </label>
                      <input
                        type="number"
                        name="price_adjustment"
                        value={formData.price_adjustment}
                        onChange={handleInputChange}
                        className="input-field w-full"
                        step="1000"
                      />
                      <p className="text-xs text-gray-500 mt-1">Nhập số âm để giảm giá, 0 để miễn phí</p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Số lượng tồn kho
                      </label>
                      <input
                        type="number"
                        name="stock_quantity"
                        value={formData.stock_quantity}
                        onChange={handleInputChange}
                        className="input-field w-full"
                        min="0"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary w-full sm:ml-3 sm:w-auto"
                  >
                    {isSubmitting ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        Đang thêm...
                      </>
                    ) : (
                      <>
                        <FaSave className="mr-2" />
                        Thêm Variant
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full sm:mt-0 sm:w-auto btn-outline"
                    onClick={() => {
                      setShowAddModal(false);
                      resetForm();
                    }}
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Variant Modal */}
      {showEditModal && selectedVariant && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleEditVariant}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    Sửa Variant: {selectedVariant.variant_name} - {selectedVariant.variant_value}
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Giá bổ sung (VND)
                      </label>
                      <input
                        type="number"
                        name="price_adjustment"
                        value={formData.price_adjustment}
                        onChange={handleInputChange}
                        className="input-field w-full"
                        step="1000"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Số lượng tồn kho
                      </label>
                      <input
                        type="number"
                        name="stock_quantity"
                        value={formData.stock_quantity}
                        onChange={handleInputChange}
                        className="input-field w-full"
                        min="0"
                      />
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={formData.is_active}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-primary-600 rounded border-gray-300"
                      />
                      <label className="ml-2 text-sm font-medium text-gray-700">
                        Variant đang hoạt động
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary w-full sm:ml-3 sm:w-auto"
                  >
                    {isSubmitting ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        Đang cập nhật...
                      </>
                    ) : (
                      <>
                        <FaSave className="mr-2" />
                        Cập nhật
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="mt-3 w-full sm:mt-0 sm:w-auto btn-outline"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedVariant(null);
                      resetForm();
                    }}
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedVariant && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <FaExclamationTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Xóa Variant</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Bạn chắc chắn muốn xóa variant "{selectedVariant.variant_name} - {selectedVariant.variant_value}"? 
                        Thao tác này không thể hoàn tác.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="btn-danger w-full sm:ml-3 sm:w-auto"
                  onClick={handleDeleteVariant}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Đang xóa...' : 'Xóa'}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full sm:mt-0 sm:w-auto btn-outline"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedVariant(null);
                  }}
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Variant Wizard */}
      <VariantWizard
        productId={String(id)}
        productName={product.name}
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        onSuccess={() => {
          setShowWizard(false);
          fetchVariants();
        }}
      />
    </AdminLayout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params || {};
  const token = context.req.cookies.auth_token;

  // Kiểm tra authentication
  if (!token) {
    return {
      redirect: {
        destination: '/auth/login?returnUrl=/admin/products',
        permanent: false,
      },
    };
  }

  try {
    // Verify token và kiểm tra quyền admin
    const { verifyToken } = await import('../../../../lib/auth');
    const decodedToken = verifyToken(token);
    
    if (!decodedToken || !decodedToken.id) {
      return {
        redirect: {
          destination: '/auth/login?returnUrl=/admin/products',
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
          destination: '/auth/login?returnUrl=/admin/products',
          permanent: false,
        },
      };
    }

    // Lấy thông tin sản phẩm
    const result = await executeQuery({
      query: 'SELECT id, name, price, options FROM products WHERE id = ?',
      values: [id],
    });

    if (!(result as any[]).length) {
      return {
        props: {
          product: null,
          error: 'Không tìm thấy sản phẩm'
        },
      };
    }

    const product = (result as any[])[0];
    
    // Parse options nếu có
    let parsedOptions = null;
    if (product.options) {
      try {
        parsedOptions = JSON.parse(product.options);
      } catch (error) {
        console.error('Error parsing product options:', error);
      }
    }

    const productWithOptions = {
      ...product,
      options: parsedOptions
    };

    return {
      props: {
        product: JSON.parse(JSON.stringify(productWithOptions)),
      },
    };
  } catch (error) {
    console.error('Failed to fetch product:', error);
    return {
      props: {
        product: null,
        error: 'Đã xảy ra lỗi khi tải thông tin sản phẩm'
      },
    };
  }
};

export default ProductVariantsPage;