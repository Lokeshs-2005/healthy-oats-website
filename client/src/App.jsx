import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import MenuPage from './pages/MenuPage'
import ProductDetailPage from './pages/ProductDetailPage'
import OurStoryPage from './pages/OurStoryPage'
import ContactPage from './pages/ContactPage'
import AdminLayout from './admin/components/AdminLayout'
import AdminLogin from './admin/pages/AdminLogin'
import AdminDashboard from './admin/pages/AdminDashboard'
import ProductsManagement from './admin/pages/ProductsManagement'
import CategoriesManagement from './admin/pages/CategoriesManagement'
import AddOnsManagement from './admin/pages/AddOnsManagement'
import SettingsManagement from './admin/pages/SettingsManagement'
import ProtectedRoute from './components/ProtectedRoute'
import NotFound from './pages/NotFound'

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="menu" element={<MenuPage />} />
            <Route path="menu/:slug" element={<ProductDetailPage />} />
            <Route path="our-story" element={<OurStoryPage />} />
            <Route path="contact" element={<ContactPage />} />
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
            <Route path="categories" element={<CategoriesManagement />} />
            <Route path="addons" element={<AddOnsManagement />} />
            <Route path="settings" element={<SettingsManagement />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}

export default App
