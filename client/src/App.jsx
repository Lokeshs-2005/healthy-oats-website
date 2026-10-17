import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import MenuPage from './pages/MenuPage'
import ProductDetailPage from './pages/ProductDetailPage'
import OurStoryPage from './pages/OurStoryPage'
import ContactPage from './pages/ContactPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import UpiPaymentPage from './pages/UpiPaymentPage'
import OrderSuccessPage from './pages/OrderSuccessPage'
import AdminLayout from './admin/components/AdminLayout'
import AdminLogin from './admin/pages/AdminLogin'
import AdminDashboard from './admin/pages/AdminDashboard'
import ProductsManagement from './admin/pages/ProductsManagement'
import SettingsManagement from './admin/pages/SettingsManagement'
import OrdersManagement from './admin/pages/OrdersManagement'
import ProtectedRoute from './components/ProtectedRoute'
import NotFound from './pages/NotFound'

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="menu" element={<MenuPage />} />
              <Route path="menu/:slug" element={<ProductDetailPage />} />
              <Route path="our-story" element={<OurStoryPage />} />
              <Route path="contact" element={<ContactPage />} />
              <Route path="cart" element={<CartPage />} />
              <Route path="checkout" element={<CheckoutPage />} />
              <Route path="payment/upi" element={<UpiPaymentPage />} />
              <Route path="order-success" element={<OrderSuccessPage />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="products" element={<ProductsManagement />} />
              <Route path="orders" element={<OrdersManagement />} />
              <Route path="settings" element={<SettingsManagement />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </Router>
  )
}

export default App
