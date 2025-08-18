import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { FaArrowLeft, FaMinus, FaPlus, FaShoppingCart } from 'react-icons/fa';
import { useCart } from '../../lib/context/CartContext';
import { toast } from 'react-toastify';
import { executeQuery } from '../../lib/db';

interface ProductOptionValue {
  label: string;
  value: string;
  price?: number;
}

interface ProductOption {
  name: string;
  values: string[] | ProductOptionValue[];
}

interface ProductProps {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    description: string;
    options: ProductOption[] | string[] | null;
    category_id: string;
  };
}

const Product = ({ product }: ProductProps) => {
  const router = useRouter();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [finalPrice, setFinalPrice] = useState(product.price);
  
  // Multi-variant support: track selections for ALL option groups
  const [selectedOptions, setSelectedOptions] = useState<{ [groupName: string]: ProductOptionValue }>({});
  
  const productOptions = Array.isArray(product.options) ? product.options : [];
  
  // Initialize default selections when component mounts
  useEffect(() => {
    console.log("🚀 Initializing with product options:", product.options);
    
    if (productOptions.length > 0) {
      const initialSelections: { [groupName: string]: ProductOptionValue } = {};
      
      productOptions.forEach((optionGroup, index) => {
        console.log(`Processing group ${index}:`, optionGroup);
        
        if (typeof optionGroup === 'string') {
          // Legacy format
          initialSelections['options'] = { label: optionGroup, value: optionGroup, price: 0 };
          console.log('Set legacy option:', optionGroup);
        } else if (optionGroup.values && optionGroup.values.length > 0) {
          // Modern format
          const firstValue = optionGroup.values[0];
          const optionValue = typeof firstValue === 'string'
            ? { label: firstValue, value: firstValue, price: 0 }
            : firstValue as ProductOptionValue;
            
          initialSelections[optionGroup.name] = optionValue;
          console.log(`Set default for ${optionGroup.name}:`, optionValue);
        }
      });
      
      console.log("Setting initial selections:", initialSelections);
      setSelectedOptions(initialSelections);
    }
  }, []);
  
  // Update final price when selections change
  useEffect(() => {
    console.log("Recalculating price with selections:", selectedOptions);
    
    const basePrice = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
    const adjustment = Object.values(selectedOptions).reduce((total, option) => {
      return total + (option?.price || 0);
    }, 0);
    
    const newFinalPrice = basePrice + adjustment;
    console.log(`Price calculation: ${basePrice} + ${adjustment} = ${newFinalPrice}`);
    
    setFinalPrice(newFinalPrice);
  }, [selectedOptions, product.price]);

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = () => {
    const optionLabels = Object.values(selectedOptions)
      .filter(option => option && option.label)
      .map(option => option.label)
      .join(', ');
    
    addItem({
      productId: product.id,
      name: product.name,
      price: finalPrice,
      image: product.image,
      quantity,
      option: optionLabels
    });
    
    toast.success(`Đã thêm ${quantity} ${product.name} ${optionLabels ? `(${optionLabels})` : ''} vào giỏ hàng`);
  };

  const handleOptionChange = (groupName: string, option: ProductOptionValue) => {
    console.log(`Option changed: ${groupName} => ${option.label} (+${option.price}đ)`);
    
    setSelectedOptions(prev => ({
      ...prev,
      [groupName]: option
    }));
  };

  return (
    <Layout>
      <Head>
        <title>{`${product.name} - Cloud Shop`}</title>
        <meta name="description" content={product.description} />
      </Head>

      <div className="container-custom py-8">
        {/* Nút quay lại */}
        <button 
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-primary-600 mb-6 transition-colors"
        >
          <FaArrowLeft className="mr-2" />
          <span>Quay lại</span>
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Hình ảnh sản phẩm */}
          <div className="relative w-full pt-[100%] bg-gray-100 rounded-lg overflow-hidden">
            <Image
              src={product.image || '/images/placeholder.svg'}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 500px"
            />
          </div>

          {/* Thông tin sản phẩm */}
          <div>
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            <div className="mb-4">
              <p className="text-2xl text-primary-600 font-bold">
                {finalPrice.toLocaleString('vi-VN')}đ
              </p>
              {/* Hiển thị thông tin giá gốc và phụ phí nếu có */}
              {(() => {
                const totalAdjustment = Object.values(selectedOptions)
                  .filter(option => option && option.price)
                  .reduce((total, option) => total + (option.price || 0), 0);
                
                if (totalAdjustment > 0) {
                  return (
                    <div className="text-sm text-gray-600 mt-1">
                      <span className="line-through">{product.price.toLocaleString('vi-VN')}đ</span>
                      <span className="ml-2 text-green-600">+{totalAdjustment.toLocaleString('vi-VN')}đ</span>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700">{product.description}</p>
            </div>

            {/* Tùy chọn */}
            {productOptions.length > 0 && (
              <div className="mb-6">
                {productOptions.map((optionGroup, groupIndex) => {
                  if (typeof optionGroup === 'string') {
                    // Legacy format
                    const optionValue = { label: optionGroup, value: optionGroup, price: 0 };
                    const isSelected = selectedOptions['options']?.value === optionGroup;
                    
                    return (
                      <div key={groupIndex} className="mb-4">
                        <h3 className="font-medium mb-2">Tùy chọn:</h3>
                        <div className="flex flex-wrap gap-2">
                          <button
                            className={`px-4 py-2 border rounded-md transition-colors ${
                              isSelected
                                ? 'bg-primary-600 text-white border-primary-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                            onClick={() => handleOptionChange('options', optionValue)}
                          >
                            {optionGroup}
                          </button>
                        </div>
                      </div>
                    );
                  }
                  
                  // Modern format with name and values
                  if (!optionGroup.values || optionGroup.values.length === 0) {
                    return null;
                  }
                  
                  return (
                    <div key={groupIndex} className="mb-4">
                      <h3 className="font-medium mb-2">{optionGroup.name}:</h3>
                      <div className="flex flex-wrap gap-2">
                        {optionGroup.values.map((value, valueIndex) => {
                          const optionValue = typeof value === 'string' 
                            ? { label: value, value: value, price: 0 }
                            : value as ProductOptionValue;
                          
                          const isSelected = selectedOptions[optionGroup.name]?.value === optionValue.value;
                          
                          return (
                            <button
                              key={valueIndex}
                              className={`px-4 py-2 border rounded-md transition-colors ${
                                isSelected
                                  ? 'bg-primary-600 text-white border-primary-600'
                                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                              }`}
                              onClick={() => handleOptionChange(optionGroup.name, optionValue)}
                            >
                              <div className="text-center">
                                <div>{optionValue.label}</div>
                                {optionValue.price && optionValue.price > 0 && (
                                  <div className="text-xs text-green-600 mt-1">
                                    +{optionValue.price.toLocaleString('vi-VN')}đ
                                  </div>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Số lượng */}
            <div className="flex items-center mb-6">
              <span className="font-medium mr-4">Số lượng:</span>
              <div className="flex items-center border rounded-md">
                <button
                  onClick={() => handleQuantityChange(quantity - 1)}
                  className="p-2 hover:bg-gray-100 transition-colors"
                  disabled={quantity <= 1}
                >
                  <FaMinus className="text-sm" />
                </button>
                <span className="px-4 py-2 font-medium">{quantity}</span>
                <button
                  onClick={() => handleQuantityChange(quantity + 1)}
                  className="p-2 hover:bg-gray-100 transition-colors"
                >
                  <FaPlus className="text-sm" />
                </button>
              </div>
            </div>

            {/* Nút thêm vào giỏ hàng */}
            <button
              onClick={handleAddToCart}
              className="btn-primary w-full flex items-center justify-center space-x-2 py-3"
            >
              <FaShoppingCart />
              <span>Thêm vào giỏ hàng</span>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params || {};
  
  try {
    const result = await executeQuery({
      query: 'SELECT * FROM products WHERE id = ?',
      values: [id],
    });

    if (!(result as any[]).length) {
      return {
        notFound: true,
      };
    }

    const product = (result as any[])[0];
    
    // Parse options JSON if available
    let parsedOptions = null;
    if (product.options) {
      try {
        parsedOptions = JSON.parse(product.options);
      } catch (error) {
        console.error('Error parsing product options:', error);
        parsedOptions = null;
      }
    }
    
    const productWithOptions = {
      ...product,
      options: parsedOptions
    };

    // Chuyển đổi các trường Date thành chuỗi ISO
    const serializedProduct = JSON.parse(JSON.stringify(productWithOptions));

    return {
      props: {
        product: serializedProduct,
      },
    };
  } catch (error) {
    console.error('Failed to fetch product:', error);
    return {
      notFound: true,
    };
  }
};

export default Product;
