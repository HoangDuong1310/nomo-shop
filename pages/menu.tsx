import { useState, useEffect } from 'react';
import type { NextPage, GetServerSideProps } from 'next';
import Head from 'next/head';
import Layout from '../components/Layout';
import ProductCard from '../components/ProductCard';
import CategoryFilter from '../components/CategoryFilter';
import { FaSearch } from 'react-icons/fa';
import { executeQuery } from '../lib/db';
import { getProductVariants, variantsToOptions } from '../lib/variants';

type Category = {
  id: string;
  name: string;
};

type Product = {
  id: string;
  name: string;
  price: number;
  sale_price?: number | null;
  image: string | null;
  description: string;
  category_id: string;
  options: string[] | null;
};

interface MenuProps {
  initialCategories: Category[];
  initialProducts: Product[];
}

const Menu: NextPage<MenuProps> = ({ initialCategories, initialProducts }) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(initialProducts);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isLoading, setIsLoading] = useState(false);

  // Lọc sản phẩm dựa trên danh mục đã chọn và tìm kiếm
  useEffect(() => {
    let result = products;

    // Lọc theo danh mục
    if (activeCategory) {
      result = result.filter((product) => product.category_id === activeCategory);
    }

    // Lọc theo từ khóa tìm kiếm
    if (searchQuery.trim()) {
      const lowerCaseQuery = searchQuery.toLowerCase().trim();
      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(lowerCaseQuery) ||
          (product.description && product.description.toLowerCase().includes(lowerCaseQuery))
      );
    }

    setFilteredProducts(result);
  }, [activeCategory, searchQuery, products]);

  // Xử lý khi chọn danh mục
  const handleSelectCategory = async (categoryId: string | null) => {
    setActiveCategory(categoryId);
  };

  return (
    <Layout>
      <Head>
        <title>Thực đơn - Cloud Shop</title>
        <meta name="description" content="Thực đơn các món ăn và đồ uống tại Cloud Shop" />
      </Head>

      <div className="container-custom py-8">
        {/* Tiêu đề trang */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Thực đơn</h1>
          <p className="text-gray-600 mt-2">Chọn món ngon, đặt hàng dễ dàng</p>
        </div>

        {/* Thanh tìm kiếm */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm món ăn, đồ uống..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <FaSearch />
            </div>
          </div>
        </div>

        {/* Bộ lọc danh mục */}
        <CategoryFilter
          categories={categories}
          activeCategory={activeCategory}
          onSelectCategory={handleSelectCategory}
        />

        {/* Danh sách sản phẩm */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                price={product.price}
                sale_price={product.sale_price}
                image={product.image}
                description={product.description}
              />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-xl text-gray-600">Không tìm thấy sản phẩm phù hợp</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveCategory(null);
              }}
              className="mt-4 text-primary-600 font-medium"
            >
              Xem tất cả sản phẩm
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    // Lấy danh sách danh mục
    const categories = await executeQuery({
      query: 'SELECT * FROM categories ORDER BY name',
    });

    // Lấy danh sách sản phẩm
    const products = await executeQuery({
      query: 'SELECT id, name, description, price, sale_price, image, category_id, stock_quantity, is_featured, is_active, created_at, updated_at FROM products ORDER BY is_featured DESC, created_at DESC',
    });

    // Hàm xử lý để chuyển đổi các trường Date thành chuỗi ISO
    const serializeData = (data: any) => {
      return JSON.parse(JSON.stringify(data));
    };

    // Chuẩn hóa: chuyển variants thành options cho FE
    const normalizedProducts = await Promise.all((products as any[]).map(async (product) => {
      try {
        const variants = await getProductVariants(product.id);
        const options = variantsToOptions(variants);
        return { ...product, options };
      } catch (error) {
        return { ...product, options: [] };
      }
    }));

    const formattedProducts = serializeData(normalizedProducts);

    return {
      props: {
        initialCategories: serializeData(categories),
        initialProducts: formattedProducts,
      },
    };
  } catch (error) {
    console.error('Failed to fetch data:', error);
    return {
      props: {
        initialCategories: [],
        initialProducts: [],
      },
    };
  }
};

export default Menu; 