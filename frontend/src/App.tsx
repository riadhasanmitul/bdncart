import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ProtectedRoute from './components/ProtectedRoute';
import RoleProtectedRoute from './components/RoleProtectedRoute';
import Navbar from './components/Navbar';
import ProductListPage from './pages/products/ProductListPage';
import ProductDetailPage from './pages/products/ProductDetailPage';
import CartPage from './pages/cart/CartPage';
import OrderSuccessPage from './pages/orders/OrderSuccessPage';

// Dashboards
import AdminDashboard from './pages/dashboards/AdminDashboard';
import SellerDashboard from './pages/dashboards/SellerDashboard';
import CustomerDashboard from './pages/dashboards/CustomerDashboard';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
          {/* Navbar is persistent across all pages */}
          <Navbar />
          
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<ProductListPage />} />
              <Route path="/product/:slug" element={<ProductDetailPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              
              {/* Standard Protected Routes (Any logged in user) */}
              <Route element={<ProtectedRoute />}>
                <Route path="/cart" element={<CartPage />} />
                <Route path="/order-success" element={<OrderSuccessPage />} />
                <Route path="/profile" element={<CustomerDashboard />} />
              </Route>

              {/* Role-Protected Routes */}
              <Route element={<RoleProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/admin" element={<AdminDashboard />} />
              </Route>
              
              <Route element={<RoleProtectedRoute allowedRoles={['seller', 'admin']} />}>
                <Route path="/seller" element={<SellerDashboard />} />
              </Route>
              
            </Routes>
          </main>
          </div>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
