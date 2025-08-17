import { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';
import { useRouter } from 'next/router';
import { useCart } from '../../lib/context/CartContext';
import { ShopStatusProvider } from '../../lib/context/ShopStatusContext';
import ShopStatusOverlay from '../ShopStatusOverlay';

type LayoutProps = {
  children: ReactNode;
};

const Layout = ({ children }: LayoutProps) => {
  const { itemsCount } = useCart();
  
  return (
    <ShopStatusProvider>
      <div className="flex flex-col min-h-screen">
        <Header cartItemsCount={itemsCount} />
        <main className="flex-grow">{children}</main>
        <Footer />
        <ShopStatusOverlay />
      </div>
    </ShopStatusProvider>
  );
};

export default Layout; 