import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface RoleProtectedRouteProps {
  allowedRoles: ('customer' | 'seller' | 'admin')[];
}

const RoleProtectedRoute = ({ allowedRoles }: RoleProtectedRouteProps) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-light"></div>
      </div>
    );
  }

  // 1. Check if user is logged in at all
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 2. Check if user role is in the allowedRoles array
  if (!allowedRoles.includes(user.role as any)) {
    // If they are logged in but unauthorized, redirect them to home (or a 403 page)
    return <Navigate to="/" replace />;
  }

  // 3. Authorized
  return <Outlet />;
};

export default RoleProtectedRoute;
