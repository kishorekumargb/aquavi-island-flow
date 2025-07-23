import { useState } from 'react';
import { AdminAuth } from './AdminAuth';
import { AdminDashboard } from './AdminDashboard';

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <AdminAuth onLogin={handleLogin} />;
  }

  return <AdminDashboard onLogout={handleLogout} />;
}