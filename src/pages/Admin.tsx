import { useState, useEffect } from 'react';
import { AdminAuth } from './AdminAuth';
import { AdminDashboard } from './AdminDashboard';
import UserDashboard from './UserDashboard';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    // Check for admin authentication or user authentication
    if (user) {
      fetchUserRole();
    } else {
      // Check session storage for admin login
      const adminAuthenticated = sessionStorage.getItem('admin_authenticated');
      if (adminAuthenticated === 'true') {
        setIsAuthenticated(true);
        setUserRole('admin');
        setLoading(false);
      } else {
        setIsAuthenticated(false);
        setUserRole(null);
        setLoading(false);
      }
    }
  }, [user]);

  const fetchUserRole = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      setUserRole(data?.role || 'user');
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error fetching user role:', error);
      setUserRole('user');
      setIsAuthenticated(true);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
    setUserRole('admin');
    sessionStorage.setItem('admin_authenticated', 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole(null);
    sessionStorage.removeItem('admin_authenticated');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminAuth onLogin={handleLogin} />;
  }

  // Role-based dashboard rendering
  if (userRole === 'admin') {
    return <AdminDashboard onLogout={handleLogout} />;
  } else if (userRole === 'user') {
    return <UserDashboard />;
  } else {
    // Fallback for unknown roles
    return <UserDashboard />;
  }
}