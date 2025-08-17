import { useState, useEffect } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { FaArrowLeft, FaMinus, FaPlus, FaShoppingCart, FaStar, FaHeart, FaShareAlt } from 'react-icons/fa';
import { useCart } from '../../lib/context/CartContext';
import { toast } from 'react-toastify';
import { executeQuery } from '../../lib/db';
import { getProductVariants, variantsToOptions, calculateFinalPrice } from '../../lib/variants';
import { formatPrice, getDisplayPrice, hasDiscount, getDiscountPercent } from '../../lib/price-utils';

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
    sale_price?: number | null;
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
  
  // Logic giá: ưu tiên sale_price, nếu không có thì dùng price
  const basePrice = getDisplayPrice(product.price, product.sale_price);
  const [finalPrice, setFinalPrice] = useState(basePrice);
  const isOnSale = hasDiscount(product.price, product.sale_price);
  const discountPercent = isOnSale ? getDiscountPercent(product.price, product.sale_price!) : 0;
  
  // Multi-variant support: track selections for ALL option groups
  const [selectedOptions, setSelectedOptions] = useState<{ [groupName: string]: ProductOptionValue }>({});
  const [refreshKey, setRefreshKey] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const productOptions = Array.isArray(product.options) ? product.options : [];
  
  // SIMPLIFIED: Direct initialization when component loads
  useEffect(() => {
    if (!isInitialized && productOptions.length > 0) {
      console.log("🚀 INITIALIZING with options:", productOptions);
      
      const initialSelections: { [groupName: string]: ProductOptionValue } = {};
      
      productOptions.forEach((optionGroup) => {
        if (typeof optionGroup === 'string') {
          initialSelections['options'] = { label: optionGroup, value: optionGroup, price: 0 };
        } else if (optionGroup.values && optionGroup.values.length > 0) {
          const firstValue = optionGroup.values[0];
          const optionValue = typeof firstValue === 'string'
            ? { label: firstValue, value: firstValue, price: 0 }
            : firstValue as ProductOptionValue;
          initialSelections[optionGroup.name] = optionValue;
        }
      });
      
      console.log("🎯 Setting initial selections:", initialSelections);
      setSelectedOptions(initialSelections);
      setIsInitialized(true);
      setRefreshKey(1);
    }
  }, [productOptions.length, isInitialized]);
  
  // Initialize selections immediately when component mounts
  useEffect(() => {
    if (productOptions.length > 0 && Object.keys(selectedOptions).length === 0) {
      const newSelections: { [groupName: string]: ProductOptionValue } = {};
      
      productOptions.forEach((optionGroup, index) => {
        if (typeof optionGroup === 'string') {
          const optionValue = { label: optionGroup, value: optionGroup, price: 0 };
          newSelections['options'] = optionValue;
          return;
        }
        
        if (!optionGroup.values || optionGroup.values.length === 0) {
          return;
        }
        
        const firstValue = optionGroup.values[0];
        const optionValue = typeof firstValue === 'string' 
          ? { label: firstValue, value: firstValue, price: 0 }
          : firstValue as ProductOptionValue;
        
        newSelections[optionGroup.name] = optionValue;
      });
      
      setSelectedOptions(newSelections);
      setRefreshKey(Date.now());
    }
  }, [productOptions.length]);
  
  // Calculate final price when selections change
  useEffect(() => {
    const validOptions = Object.values(selectedOptions).filter(option => option && option.price !== undefined);
    
    // Sử dụng giá hiển thị (đã tính khuyến mãi) làm base
    const currentBasePrice = getDisplayPrice(product.price, product.sale_price);
    const basePriceValue = typeof currentBasePrice === 'string' ? parseFloat(currentBasePrice) : currentBasePrice;
    const adjustment = validOptions.reduce((total, option) => total + (option.price || 0), 0);
    const newFinalPrice = basePriceValue + adjustment;
    
    setFinalPrice(newFinalPrice);
  }, [selectedOptions, refreshKey, product.price, product.sale_price]);

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = () => {
    // Tạo chuỗi mô tả các options đã chọn
    const optionLabels = Object.values(selectedOptions)
      .filter(option => option && option.label)
      .map(option => option.label)
      .join(', ');
    
    // Tạo unique variant key để phân biệt các combinations
    const variantKey = Object.entries(selectedOptions)
      .sort(([a], [b]) => a.localeCompare(b)) // Sort để consistent order
      .map(([groupName, option]) => `${groupName}:${option.value}`)
      .join('|');
    
    // Thêm sản phẩm vào giỏ hàng với giá đã tính variants
    addItem({
      productId: product.id,
      name: product.name,
      price: finalPrice,
      image: product.image,
      quantity,
      option: optionLabels, // For display
      variantKey: variantKey // For unique identification
    });
    
    // Hiển thị thông báo thành công với animation
    toast.success(
      `🎉 Đã thêm ${quantity} ${product.name} ${optionLabels ? `(${optionLabels})` : ''} vào giỏ hàng!`,
      {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      }
    );
  };

  const handleOptionChange = (groupName: string, option: ProductOptionValue) => {
    setSelectedOptions(prev => ({
      ...prev,
      [groupName]: option
    }));
    setRefreshKey(prev => prev + 1);
  };

  return (
    <Layout>
      <Head>
        <title>{`${product.name} - Cloud Shop`}</title>
        <meta name="description" content={product.description} />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <div className="container-custom py-6">
          {/* Breadcrumb & Back Button */}
          <div className="flex items-center justify-between mb-6">
            <button 
              onClick={() => router.back()}
              className="flex items-center text-gray-500 hover:text-primary-600 transition-all duration-200 group"
            >
              <FaArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Quay lại</span>
            </button>
            
            {/* Action buttons */}
            <div className="flex items-center space-x-3">
              <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                <FaHeart size={18} />
              </button>
              <button className="p-2 text-gray-400 hover:text-primary-600 transition-colors">
                <FaShareAlt size={18} />
              </button>
            </div>
          </div>

          {/* Product Content */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              {/* Product Image */}
              <div className="relative bg-gray-50">
                <div className="aspect-square relative overflow-hidden">
                  <Image
                    src={product.image || 'https://via.placeholder.com/600x600/f8f9fa/6c757d?text=Chưa+có+hình+ảnh'}
                    alt={product.name}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-700"
                    priority
                  />
                  {/* Image overlay with gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
                </div>
              </div>

              {/* Product Info */}
              <div className="p-8 lg:p-10">
                {/* Product Title & Price */}
                <div className="mb-6">
                  <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                    {product.name}
                  </h1>
                  
                  {/* Price Display */}
                  <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg p-6 border border-primary-200">
                    <div className="space-y-3">
                      {/* Giá cuối cùng (nổi bật nhất) */}
                      <div className="flex items-center justify-between">
                        <span className="text-4xl font-bold text-primary-600">
                          {formatPrice(finalPrice)}
                        </span>
                        {isOnSale && (
                          <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-bold">
                            GIẢM {discountPercent}%
                          </span>
                        )}
                      </div>
                      
                      {/* Breakdown giá */}
                      <div className="text-sm text-gray-600 space-y-1">
                        {isOnSale && (
                          <div className="flex justify-between items-center">
                            <span>Giá gốc:</span>
                            <span className="line-through">{formatPrice(product.price)}</span>
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center">
                          <span>Giá {isOnSale ? 'khuyến mãi' : 'bán'}:</span>
                          <span className="font-medium">{formatPrice(basePrice)}</span>
                        </div>
                        
                        {(() => {
                          const totalAdjustment = Object.values(selectedOptions)
                            .filter(option => option && option.price)
                            .reduce((total, option) => total + (option.price || 0), 0);
                          
                          if (totalAdjustment > 0) {
                            return (
                              <div className="flex justify-between items-center">
                                <span>Phụ phí variants:</span>
                                <span className="text-green-600 font-medium">+{formatPrice(totalAdjustment)}</span>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Product Description */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Mô tả sản phẩm</h3>
                  <p className="text-gray-600 leading-relaxed text-base">
                    {product.description || 'Chưa có mô tả cho sản phẩm này.'}
                  </p>
                </div>

                {/* Product Options */}
                {productOptions.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Tùy chọn sản phẩm</h3>
                    <div className="space-y-6">
                      {productOptions.map((optionGroup, groupIndex) => {
                        const groupName = typeof optionGroup === 'string' ? 'options' : optionGroup.name;
                        const groupValues = typeof optionGroup === 'string' ? [optionGroup] : optionGroup.values;
                        
                        if (typeof optionGroup === 'string') {
                          // Legacy format
                          const optionValue = { label: optionGroup, value: optionGroup, price: 0 };
                          const isSelected = selectedOptions['options']?.value === optionGroup;
                          
                          return (
                            <div key={groupIndex} className="space-y-3">
                              <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                Tùy chọn
                              </label>
                              <div className="flex flex-wrap gap-3">
                                <button
                                  className={`relative px-6 py-3 rounded-xl border-2 font-medium transition-all duration-200 transform hover:scale-105 ${
                                    isSelected
                                      ? 'bg-primary-600 text-white border-primary-600 shadow-lg'
                                      : 'bg-white text-gray-700 border-gray-200 hover:border-primary-300 hover:text-primary-600'
                                  }`}
                                  onClick={() => handleOptionChange('options', optionValue)}
                                >
                                  {optionGroup}
                                </button>
                              </div>
                            </div>
                          );
                        }
                        
                        // Object format with values
                        if (!optionGroup.values || optionGroup.values.length === 0) {
                          return null;
                        }
                        
                        return (
                          <div key={groupIndex} className="space-y-3">
                            <label className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                              {optionGroup.name}
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {optionGroup.values.map((value) => {
                                const optionValue = typeof value === 'string' 
                                  ? { label: value, value: value, price: 0 }
                                  : value as ProductOptionValue;
                                
                                const isSelected = selectedOptions[optionGroup.name]?.value === optionValue.value;
                                
                                return (
                                  <button
                                    key={optionValue.value}
                                    className={`relative p-4 rounded-xl border-2 font-medium transition-all duration-200 transform hover:scale-105 group ${
                                      isSelected
                                        ? 'bg-primary-600 text-white border-primary-600 shadow-lg'
                                        : 'bg-white text-gray-700 border-gray-200 hover:border-primary-300 hover:text-primary-600'
                                    }`}
                                    onClick={() => handleOptionChange(optionGroup.name, optionValue)}
                                  >
                                    <div className="text-center">
                                      <div className="font-semibold">{optionValue.label}</div>
                                      {optionValue.price && optionValue.price > 0 && (
                                        <div className={`text-sm mt-1 font-medium ${
                                          isSelected ? 'text-primary-100' : 'text-green-600 group-hover:text-green-500'
                                        }`}>
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
                  </div>
                )}

                {/* Quantity Selector */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Số lượng</h3>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden bg-white">
                      <button
                        onClick={() => handleQuantityChange(quantity - 1)}
                        disabled={quantity <= 1}
                        className={`px-4 py-3 transition-colors ${
                          quantity <= 1 
                            ? 'text-gray-400 cursor-not-allowed' 
                            : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                        }`}
                      >
                        <FaMinus size={14} />
                      </button>
                      <div className="px-6 py-3 font-bold text-lg min-w-[60px] text-center border-x-2 border-gray-200">
                        {quantity}
                      </div>
                      <button
                        onClick={() => handleQuantityChange(quantity + 1)}
                        className="px-4 py-3 text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                      >
                        <FaPlus size={14} />
                      </button>
                    </div>
                    
                    {/* Total Price */}
                    <div className="flex-1">
                      <div className="text-sm text-gray-500 mb-1">Tổng tiền</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {(finalPrice * quantity).toLocaleString('vi-VN')}đ
                      </div>
                    </div>
                  </div>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={handleAddToCart}
                  className="w-full bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg flex items-center justify-center space-x-3 group"
                >
                  <FaShoppingCart className="text-lg group-hover:animate-bounce" />
                  <span className="text-lg">Thêm vào giỏ hàng</span>
                </button>
              </div>
            </div>
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
    
    // Load variants từ database
    let parsedOptions = null;
    try {
      const variants = await getProductVariants(id as string);
      if (variants && variants.length > 0) {
        // Convert variants to options format
        parsedOptions = variantsToOptions(variants);
        console.log('✅ Loaded variants for product:', id, 'Count:', variants.length);
        console.log('📝 Converted options:', parsedOptions);
      } else {
        // Fallback to legacy options field
        if (product.options) {
          parsedOptions = JSON.parse(product.options);
        }
      }
    } catch (error) {
      console.error('Error loading variants:', error);
      // Fallback to legacy options
      if (product.options) {
        try {
          parsedOptions = JSON.parse(product.options);
        } catch (parseError) {
          console.error('Error parsing legacy options:', parseError);
        }
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