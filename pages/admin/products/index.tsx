import { useState, useEffect, useCallback } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaSearch, 
  FaFilter, 
  FaSpinner,
  FaChevronLeft, 
  FaChevronRight,
  FaStar,
  FaEye,
  FaExclamationTriangle,
  FaCog,
  FaToggleOn,
  FaToggleOff
} from 'react-icons/fa';
import AdminLayout from '../../../components/Layout/AdminLayout';
import { toast } from 'react-toastify';
import { formatPrice, hasDiscount, getDisplayPrice, getDiscountPercent } from '../../../lib/price-utils';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  sale_price: number | null;
  image: string;
  category_id: string;
  category_name: string;
  stock_quantity: number;
  is_featured: boolean;
  is_active: boolean;
}

interface Category {
  id: string;
  name: string;
}

const ProductsAdminPage: NextPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const itemsPerPage = 10;

  // Fetch products and categories
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      let url = `/api/admin/products?page=${currentPage}&limit=${itemsPerPage}`;
      
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }
      
      if (categoryFilter) {
        url += `&category=${encodeURIComponent(categoryFilter)}`;
      }
      
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products);
        setTotalItems(data.total);
        setTotalPages(Math.ceil(data.total / itemsPerPage));
      } else {
        toast.error('Không thể tải danh sách sản phẩm');
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Đã xảy ra lỗi khi tải danh sách sản phẩm');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchTerm, categoryFilter]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Fetch data on initial load and when dependencies change
  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, [fetchProducts]);

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProducts();
  };

  // Handle category filter change
  const handleCategoryFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategoryFilter(e.target.value);
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle delete confirmation
  const confirmDelete = (product: Product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  // Handle delete product (legacy)
  const handleToggleActive = async (product: Product) => {
    setToggling(product.id);
    try {
      const res = await fetch('/api/admin/products/toggle-active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: product.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Toggle failed');
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_active: data.is_active } : p));
      toast.success(`${product.name} → ${data.is_active ? 'Đang bán' : 'Ngừng bán'}`);
    } catch (e: any) {
      toast.error(e.message || 'Không thể đổi trạng thái');
    } finally {
      setToggling(null);
    }
  };
  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    
    setIsDeleting(productToDelete.id);
    try {
      const response = await fetch(`/api/admin/products/${productToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        toast.success(`Đã xóa sản phẩm ${productToDelete.name}`);
        fetchProducts();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Không thể xóa sản phẩm');
      }
    } catch (error: any) {
      toast.error(error.message || 'Đã xảy ra lỗi khi xóa sản phẩm');
    } finally {
      setIsDeleting(null);
      setShowDeleteModal(false);
      setProductToDelete(null);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return formatPrice(amount);
  };

  return (
    <AdminLayout title="Quản lý sản phẩm">
      <Head>
        <title>Quản lý sản phẩm - Cloud Shop Admin</title>
        <meta name="description" content="Quản lý sản phẩm - Cloud Shop Admin" />
      </Head>

      {/* Search, Filter, and Add button */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <form onSubmit={handleSearch} className="flex w-full md:w-auto">
          <div className="relative flex-grow">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm sản phẩm..."
              className="input-field pr-10"
            />
            <button 
              type="submit" 
              className="absolute right-0 top-0 h-full px-3 text-gray-500 hover:text-primary-600"
            >
              <FaSearch />
            </button>
          </div>
        </form>
        
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="flex items-center w-full md:w-auto">
            <FaFilter className="text-gray-500 mr-2" />
            <select
              value={categoryFilter}
              onChange={handleCategoryFilterChange}
              className="input-field py-2"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          
          <Link href="/admin/products/add" className="btn-primary flex items-center">
            <FaPlus className="mr-2" /> Thêm sản phẩm
          </Link>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Danh sách sản phẩm</h2>
            <p className="text-sm text-gray-600">
              Tổng số: {totalItems} sản phẩm
            </p>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-16">
              <FaSpinner className="animate-spin text-primary-600 text-2xl" />
            </div>
          ) : products.length > 0 ? (
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sản phẩm
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Danh mục
                  </th>
                  <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giá
                  </th>
                  <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tồn kho
                  </th>
                  <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="py-3 px-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 relative bg-gray-100">
                          {(() => {
                            const img = product.image;
                            const resolved = (!img || img.includes('placeholder-drink') || img.includes('placeholder-food'))
                              ? '/images/placeholder.svg'
                              : img;
                            if (!resolved) {
                              return (
                                <div className="flex h-full w-full items-center justify-center text-gray-400">No image</div>
                              );
                            }
                            if (resolved.startsWith('/uploads/')) {
                              return (
                                <img
                                  src={resolved}
                                  alt={product.name}
                                  className="absolute inset-0 w-full h-full object-cover object-center"
                                  loading="lazy"
                                />
                              );
                            }
                            return (
                              <Image
                                src={resolved}
                                alt={product.name}
                                fill
                                sizes="56px"
                                className="object-cover object-center"
                              />
                            );
                          })()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 flex items-center">
                            {product.name}
                            {product.is_featured ? (
                              <FaStar className="ml-1 text-yellow-400" title="Sản phẩm nổi bật" />
                            ) : null}
                          </div>
                          <div className="text-sm text-gray-500 max-w-xs truncate">{product.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{product.category_name}</span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      {(() => {
                        const price = Number(product.price);
                        const sale = product.sale_price != null ? Number(product.sale_price) : null;
                        if (hasDiscount(price, sale)) {
                          const percent = getDiscountPercent(price, sale!);
                          return (
                            <div className="space-y-1">
                              <div className="text-xs text-gray-400 line-through">
                                {formatCurrency(price)}
                              </div>
                              <div className="text-sm font-bold text-red-600 flex items-center justify-center gap-1">
                                {formatCurrency(getDisplayPrice(price, sale))}
                                <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium">-{percent}%</span>
                              </div>
                            </div>
                          );
                        }
                        return (
                          <div className="text-sm text-gray-900 font-medium">
                            {formatCurrency(price)}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                      <span className={`${product.stock_quantity <= 5 ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                        {product.stock_quantity}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          product.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {product.is_active ? 'Đang bán' : 'Ngừng bán'}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <Link
                          href={`/product/${product.id}`}
                          target="_blank"
                          className="text-blue-600 hover:text-blue-900"
                          title="Xem sản phẩm"
                        >
                          <FaEye className="w-5 h-5" />
                        </Link>
                        <Link
                          href={`/admin/products/edit/${product.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Sửa sản phẩm"
                        >
                          <FaEdit className="w-5 h-5" />
                        </Link>
                        <Link
                          href={`/admin/products/variants/${product.id}`}
                          className="text-purple-600 hover:text-purple-900"
                          title="Quản lý variants"
                        >
                          <FaCog className="w-5 h-5" />
                        </Link>
                        <button
                          onClick={() => handleToggleActive(product)}
                          className={product.is_active ? 'text-green-600 hover:text-green-800' : 'text-gray-500 hover:text-gray-700'}
                          disabled={toggling === product.id}
                          title="Chuyển trạng thái nhanh"
                        >
                          {toggling === product.id ? (
                            <FaSpinner className="w-5 h-5 animate-spin" />
                          ) : product.is_active ? (
                            <FaToggleOn className="w-6 h-6" />
                          ) : (
                            <FaToggleOff className="w-6 h-6" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex justify-center items-center py-16 text-gray-500">
              Không có sản phẩm nào
            </div>
          )}
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Hiển thị <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> đến <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalItems)}</span> của{' '}
                  <span className="font-medium">{totalItems}</span> kết quả
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border text-sm font-medium ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Previous</span>
                    <FaChevronLeft className="h-4 w-4" />
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageToShow = totalPages <= 5 ? i + 1 : 
                      currentPage <= 3 ? i + 1 : 
                      currentPage >= totalPages - 2 ? totalPages - 4 + i : 
                      currentPage - 2 + i;
                    
                    return (
                      <button
                        key={pageToShow}
                        onClick={() => handlePageChange(pageToShow)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === pageToShow
                            ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageToShow}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border text-sm font-medium ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <span className="sr-only">Next</span>
                    <FaChevronRight className="h-4 w-4" />
                  </button>
                </nav>
              </div>
            </div>
            <div className="flex sm:hidden">
              <button
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Trước
              </button>
              <span className="mx-2 mt-1">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className={`ml-3 relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${
                  currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && productToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen"></span>&#8203;

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <FaExclamationTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Xóa sản phẩm</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Bạn chắc chắn muốn xóa sản phẩm "{productToDelete.name}"? Thao tác này không thể hoàn tác.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="btn-danger w-full sm:ml-3 sm:w-auto"
                  onClick={handleDeleteProduct}
                >
                  {isDeleting ? 'Đang xóa...' : 'Xóa'}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full sm:mt-0 sm:w-auto btn-outline"
                  onClick={() => setShowDeleteModal(false)}
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default ProductsAdminPage;