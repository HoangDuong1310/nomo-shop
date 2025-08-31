import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { CartProvider } from '../lib/context/CartContext'
import { AuthProvider } from '../lib/context/AuthContext'
import { ShopStatusProvider, useShopStatus } from '../lib/context/ShopStatusContext'
import { PushNotificationProvider } from '../lib/context/PushNotificationContext'
import ShopStatusOverlay from '../components/ShopStatusOverlay'
import { StoreInfoProvider } from '../lib/context/StoreInfoContext'

const AppContent = ({ Component, pageProps }: AppProps) => {
  // Nội dung ứng dụng chính. Overlay được render độc lập trong provider.
  return <Component {...pageProps} />
}

const RootApp = (props: AppProps) => {
  return (
    <AuthProvider>
      <CartProvider>
        <ShopStatusProvider>
          <PushNotificationProvider>
            <StoreInfoProvider>
              <AppContent {...props} />
              <ShopStatusOverlay />
              <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
              />
            </StoreInfoProvider>
          </PushNotificationProvider>
        </ShopStatusProvider>
      </CartProvider>
    </AuthProvider>
  )
}

function MyApp(props: AppProps) { return <RootApp {...props} /> }

export default MyApp