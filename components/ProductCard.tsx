import Image from 'next/image';
import Link from 'next/link';
import { FaPlus } from 'react-icons/fa';
import { useCart } from '../lib/context/CartContext';
import { toast } from 'react-toastify';
import { formatPrice, getDisplayPrice, hasDiscount, getDiscountPercent } from '../lib/price-utils';

type ProductCardProps = {
  id: string;
  name: string;
  price: number;
  sale_price?: number | null;
  image: string | null;
  description?: string;
};

const ProductCard = ({ id, name, price, sale_price, image, description }: ProductCardProps) => {
  const { addItem } = useCart();
  
  // Tính giá hiển thị (ưu tiên giá khuyến mãi)
  const displayPrice = getDisplayPrice(price, sale_price);
  const isOnSale = hasDiscount(price, sale_price);
  const discountPercent = isOnSale ? getDiscountPercent(price, sale_price!) : 0;
  
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Thêm sản phẩm vào giỏ hàng với giá hiển thị (đã tính khuyến mãi)
    addItem({
      productId: id,
      name,
      price: displayPrice,
      image,
      quantity: 1
    });
    
    // Hiển thị thông báo
    toast.success(`Đã thêm ${name} vào giỏ hàng`);
  };

  return (
    <Link href={`/product/${id}`} className="block h-full">
      <div className="card h-full flex flex-col">
        <div className="relative pt-[75%] overflow-hidden">
          <Image
            src={image || '/images/placeholder.svg'}
            alt={name}
            fill
            className="object-cover transition-transform duration-300 hover:scale-105"
            sizes="(max-width: 768px) 100vw, 400px"
          />
        </div>
        <div className="p-4 flex flex-col flex-grow">
          <h3 className="font-medium text-lg mb-1 line-clamp-1">{name}</h3>
          {description && (
            <p className="text-gray-500 text-sm mb-3 line-clamp-2">{description}</p>
          )}
          <div className="mt-auto">
            <div className="flex flex-col mb-3">
              {isOnSale ? (
                <>
                  {/* Giá gốc bị gạch ngang */}
                  <span className="text-gray-400 text-sm line-through">
                    {formatPrice(price)}
                  </span>
                  {/* Giá khuyến mãi */}
                  <div className="flex items-center gap-2">
                    <span className="text-primary-600 font-bold text-lg">
                      {formatPrice(displayPrice)}
                    </span>
                    <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full font-medium">
                      -{discountPercent}%
                    </span>
                  </div>
                </>
              ) : (
                /* Giá bình thường */
                <span className="text-primary-600 font-bold text-lg">
                  {formatPrice(displayPrice)}
                </span>
              )}
            </div>
            
            <button
              onClick={handleAddToCart}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white p-2 rounded-full transition-colors flex items-center justify-center gap-2"
              aria-label="Thêm vào giỏ hàng"
            >
              <FaPlus />
              <span className="text-sm">Thêm</span>
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard; 