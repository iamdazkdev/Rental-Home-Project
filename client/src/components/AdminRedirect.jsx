import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

/**
 * AdminRedirect Component
 * Redirects admin users to /admin/dashboard when they visit homepage
 */
const AdminRedirect = ({ children }) => {
  const user = useSelector((state) => state.user);
  const navigate = useNavigate();

  useEffect(() => {
    // If user is admin and on homepage, redirect to admin dashboard
    if (user && user.role === 'admin') {
      console.log('🔐 Admin detected - redirecting to dashboard');
      navigate('/admin/dashboard', { replace: true });
    }
  }, [user, navigate]);

  // Don't render HomePage for admin (redirect happens immediately)
  if (user && user.role === 'admin') {
    return null;
  }

  // Render children (HomePage) for regular users
  return children;
};

export default AdminRedirect;

