import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useAuth } from '@/components/auth/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { OrderDetailsModal } from '@/components/OrderDetailsModal';
import { ForgotPasswordModal } from '@/components/auth/ForgotPasswordModal';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  ShoppingBag,
  LogOut,
} from 'lucide-react';

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  delivery_address: string;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  total_amount: number;
  status: string;
  payment_method: string;
  delivery_type: string;
  created_at: string;
  updated_at: string;
}

const UserDashboard = () => {
  const { user, userRole, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [userLoginForm, setUserLoginForm] = useState({ email: '', password: '' });
  const [showUserLogin, setShowUserLogin] = useState(true); // Always start with login required
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userSessionVerified, setUserSessionVerified] = useState(false);
  const { toast } = useToast();

  // Initial setup - always require user login
  useEffect(() => {
    setIsAuthenticated(false);
    setUserSessionVerified(false);
    setShowUserLogin(true);
  }, []);

  // Authentication check
  useEffect(() => {
    if (!authLoading && userSessionVerified) {
      if (!user) {
        setShowUserLogin(true);
        setIsAuthenticated(false);
      } else if (user && userRole === 'user') {
        setShowUserLogin(false);
        setIsAuthenticated(true);
        fetchOrders();
      } else if (user && userRole === null) {
        setShowUserLogin(true);
        setIsAuthenticated(false);
      } else if (user && userRole === 'admin') {
        // Admin accessing user dashboard - redirect to admin dashboard
        navigate('/access-water-360');
      }
    }
  }, [user, userRole, authLoading, userSessionVerified, navigate]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'processing':
        return <AlertCircle className="w-4 h-4 text-blue-500" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // For users, we'll fetch orders based on their email or user info
      // Since orders table doesn't have user_id, we'll match by email
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_email', user?.email)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders((data || []).map(order => ({
        ...order,
        items: Array.isArray(order.items) ? order.items : []
      })) as Order[]);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUserLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoginLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: userLoginForm.email,
        password: userLoginForm.password,
      });
      
      if (error) throw error;
      
      // Mark user session as verified after successful login
      setUserSessionVerified(true);
      
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
      
      // Clear form
      setUserLoginForm({ email: '', password: '' });
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to log in",
        variant: "destructive",
      });
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* User Login Modal */}
      <Dialog open={showUserLogin} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" onOpenAutoFocus={() => {}}>
          <DialogHeader>
            <DialogTitle>User Access - Aqua VI</DialogTitle>
            <DialogDescription>
              Sign in to access your orders and account information
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleUserLogin} className="space-y-4">
            <div>
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email"
                type="email"
                value={userLoginForm.email}
                onChange={(e) => setUserLoginForm({ ...userLoginForm, email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="user-password">Password</Label>
              <Input
                id="user-password"
                type="password"
                value={userLoginForm.password}
                onChange={(e) => setUserLoginForm({ ...userLoginForm, password: e.target.value })}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoginLoading}>
              {isLoginLoading ? 'Signing in...' : 'Sign In'}
            </Button>
            <Button
              type="button"
              variant="link"
              className="w-full text-sm"
              onClick={() => setShowForgotPassword(true)}
            >
              Forgot your password?
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal 
        isOpen={showForgotPassword} 
        onClose={() => setShowForgotPassword(false)} 
      />

      {/* Main Dashboard */}
      {isAuthenticated && (
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">My Orders</h1>
              <p className="text-muted-foreground">Welcome back, {user?.email}</p>
            </div>
            <Button onClick={handleLogout} variant="outline">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>

          {/* Orders Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ShoppingBag className="w-5 h-5" />
                <span>Your Orders</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading orders...</div>
              ) : orders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No orders found.</p>
                  <p className="text-sm">Your orders will appear here once you place them.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono">{order.order_number}</TableCell>
                        <TableCell>{format(new Date(order.created_at), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>
                          {order.items.map((item, index) => (
                            <div key={index} className="text-sm">
                              {item.name} × {item.quantity}
                            </div>
                          ))}
                        </TableCell>
                        <TableCell className="font-semibold">${order.total_amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(order.status)} flex items-center space-x-1 w-fit`}>
                            {getStatusIcon(order.status)}
                            <span className="capitalize">{order.status}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewOrder(order)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Order Details Modal */}
      <OrderDetailsModal 
        isOpen={showOrderDetails}
        onClose={() => setShowOrderDetails(false)}
        order={selectedOrder}
        onUpdateStatus={() => {}} // Read-only for users
        isUpdating={false}
      />
    </div>
  );
};

export default UserDashboard;