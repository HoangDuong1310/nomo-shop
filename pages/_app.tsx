import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { CartProvider } from '../lib/context/CartContext'
import { AuthProvider } from '../lib/context/AuthContext'
import { ShopStatusProvider, useShopStatus } from '../lib/context/ShopStatusContext'
import ShopStatusOverlay from '../components/ShopStatusOverlay'

const AppContent = ({ Component, pageProps }: AppProps) => {
  // Nội dung ứng dụng chính. Overlay được render độc lập trong provider.
  return <Component {...pageProps} />
}

const RootApp = (props: AppProps) => {
  return (
    <AuthProvider>
      <CartProvider>
        <ShopStatusProvider>
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
        </ShopStatusProvider>
      </CartProvider>
    </AuthProvider>
  )
}

function MyApp(props: AppProps) { return <RootApp {...props} /> }

export default MyApp 