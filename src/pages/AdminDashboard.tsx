import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useAuth } from '@/components/auth/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { CreateUserModal } from '@/components/CreateUserModal';
import { EditUserModal } from '@/components/EditUserModal';
import { CreateProductModal } from '@/components/CreateProductModal';
import { EditProductModal } from '@/components/EditProductModal';
import { CreateTestimonialModal } from '@/components/CreateTestimonialModal';
import { EditTestimonialModal } from '@/components/EditTestimonialModal';
import { OrderDetailsModal } from '@/components/OrderDetailsModal';
import { ViewMessageModal } from "@/components/ViewMessageModal";
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
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Edit,
  Trash2,
  Plus,
  Package,
  Users,
  MessageSquare,
  BarChart3,
  DollarSign,
  ShoppingBag,
  Clock,
  Star,
  UserX,
  Key,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';

// Types
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

interface Product {
  id: string;
  name: string;
  size: string;
  price: number;
  stock: number;
  description: string;
  image_url: string;
  is_active: boolean;
  created_at: string;
}

interface Testimonial {
  id: string;
  name: string;
  location: string;
  review: string;
  rating: number;
  verified: boolean;
  is_active: boolean;
  avatar: string;
  order_type: string;
  created_at: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  total_orders: number;
  total_spent: number;
  created_at: string;
}

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  status: string;
  created_at: string;
}

interface AuthUser {
  id: string;
  email: string;
  display_name?: string;
  created_at: string;
  email_confirmed_at?: string;
  last_sign_in_at?: string;
  roles?: string[];
}

interface UserRole {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
}

const AdminDashboard = () => {
  const { user, userRole, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [updatingUser, setUpdatingUser] = useState(false);
  const [editingUser, setEditingUser] = useState<AuthUser | null>(null);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [showCreateTestimonial, setShowCreateTestimonial] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showViewMessage, setShowViewMessage] = useState(false);
  const [adminLoginForm, setAdminLoginForm] = useState({ email: '', password: '' });
  const [userLoginForm, setUserLoginForm] = useState({ email: '', password: '' });
  const [showUserLogin, setShowUserLogin] = useState(true); // Start with user login as default
  const [showAdminLogin, setShowAdminLogin] = useState(true); // Always start with login required
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentAccessLevel, setCurrentAccessLevel] = useState<'user' | 'admin' | null>(null); // Track login method
  const [receiveOrders, setReceiveOrders] = useState(true);
  const [siteSettings, setSiteSettings] = useState({
    phone: '',
    email: '',
    address: '',
    delivery_hours: '',
    business_hours_monday_friday: '',
    business_hours_saturday: '',
    business_hours_sunday: '',
    logo_url: ''
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const { toast } = useToast();

  // Initial setup - always require login
  useEffect(() => {
    // Clear any existing session when accessing admin dashboard
    setIsAuthenticated(false);
    setCurrentAccessLevel(null);
    setShowAdminLogin(true);
  }, []);

  // Authentication check - only allow access after explicit verification
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        // No user logged in - show login modal
        setShowAdminLogin(true);
        setIsAuthenticated(false);
        setCurrentAccessLevel(null);
      } else if (user && currentAccessLevel === 'admin') {
        // User logged in through admin portal - grant full access
        setShowAdminLogin(false);
        setIsAuthenticated(true);
        setActiveTab('orders'); 
        fetchOrders();
        fetchProducts();  
        fetchTestimonials();
        fetchMessages();
        fetchUsers();
        fetchReceiveOrdersSetting();
        fetchSiteSettings();
      } else if (user && currentAccessLevel === 'user') {
        // User logged in through user portal - grant limited access
        setShowAdminLogin(false);
        setIsAuthenticated(true);
        setActiveTab('orders'); // Only orders tab for regular users
        fetchOrders(); // Only fetch orders for regular users
      } else if (user && currentAccessLevel === null) {
        // User is authenticated but access level not set - keep login modal open
        setShowAdminLogin(true);
        setIsAuthenticated(false);
      }
    }
  }, [user, userRole, authLoading, navigate, toast]);

  // Status icon helper functions
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

  // Fetch functions
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
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

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTestimonials(data || []);
    } catch (error) {
      console.error('Error fetching testimonials:', error);
      toast({
        title: "Error",
        description: "Failed to load testimonials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('Fetching users with roles...');
      
      const { data, error } = await supabase.rpc('get_users_with_roles');
      
      if (error) {
        console.error('Error fetching users:', error);
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      console.log('Raw user data:', data);
      
      // Group users by ID to avoid duplicates and collect all roles
      const userMap = new Map<string, any>();
      const allRoles: UserRole[] = [];
      
      data?.forEach((item: any) => {
        const userId = item.id;
        
        // Create or update user entry
        if (!userMap.has(userId)) {
          userMap.set(userId, {
            id: userId,
            email: item.email || 'No email',
            display_name: item.display_name || 'No name',
            created_at: item.created_at,
            email_confirmed_at: null,
            last_sign_in_at: item.last_sign_in_at,
            roles: [] // Store roles array for this user
          });
        }
        
        // Add role to user's roles array
        const user = userMap.get(userId);
        if (!user.roles.includes(item.role)) {
          user.roles.push(item.role);
        }
        
        // Add to roles list for management
        allRoles.push({
          id: `${userId}-${item.role}`,
          user_id: userId,
          role: item.role,
          created_at: item.created_at,
        });
      });
      
      const users = Array.from(userMap.values());
      console.log('Processed users:', users);
      console.log('All roles:', allRoles);
      
      setUsers(users);
      setUserRoles(allRoles);
      
    } catch (error) {
      console.error('Fetch users error:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchReceiveOrdersSetting = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('setting_value')
        .eq('setting_key', 'receive_orders')
        .single();

      if (error) {
        console.error('Error fetching receive orders setting:', error);
        return;
      }

      setReceiveOrders(data?.setting_value === 'true');
    } catch (error) {
      console.error('Error fetching receive orders setting:', error);
    }
  };

  const updateReceiveOrdersSetting = async (enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({
          setting_key: 'receive_orders',
          setting_value: enabled.toString()
        }, {
          onConflict: 'setting_key'
        });

      if (error) throw error;

      setReceiveOrders(enabled);
      toast({
        title: "Success",
        description: `Order receiving ${enabled ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      console.error('Error updating receive orders setting:', error);
      toast({
        title: "Error",
        description: "Failed to update setting",
        variant: "destructive",
      });
    }
  };

  const fetchSiteSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('public_site_config')
        .select('setting_key, setting_value')
        .in('setting_key', [
          'phone',
          'email',
          'address',
          'delivery_hours',
          'business_hours_monday_friday',
          'business_hours_saturday',
          'business_hours_sunday',
          'logo_url'
        ]);

      if (error) {
        console.error('Error fetching site settings:', error);
        return;
      }

      if (data) {
        const settings = data.reduce((acc, setting) => {
          acc[setting.setting_key] = setting.setting_value || '';
          return acc;
        }, {} as Record<string, string>);

        setSiteSettings({
          phone: settings.phone || '',
          email: settings.email || '',
          address: settings.address || '',
          delivery_hours: settings.delivery_hours || '',
          business_hours_monday_friday: settings.business_hours_monday_friday || '',
          business_hours_saturday: settings.business_hours_saturday || '',
          business_hours_sunday: settings.business_hours_sunday || '',
          logo_url: settings.logo_url || ''
        });
      }
    } catch (error) {
      console.error('Error fetching site settings:', error);
    }
  };

  const updateSiteSettings = async () => {
    setSettingsLoading(true);
    try {
      const settingsToUpdate = Object.entries(siteSettings).map(([key, value]) => ({
        setting_key: key,
        setting_value: value
      }));

      const { error } = await supabase
        .from('public_site_config')
        .upsert(settingsToUpdate, {
          onConflict: 'setting_key'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Settings updated successfully",
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoginLoading(true);
    
    try {
      console.log('Attempting admin login with email:', adminLoginForm.email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: adminLoginForm.email,
        password: adminLoginForm.password,
      });
      
      console.log('Login response:', { data, error });
      
      if (error) {
        console.error('Login error details:', error);
        throw error;
      }
      
      // Set admin access level
      setCurrentAccessLevel('admin');
      
      // Show success
      toast({
        title: "Success",
        description: "Logged in successfully as admin",
      });
      
      // Clear form
      setAdminLoginForm({ email: '', password: '' });
      
    } catch (error: any) {
      console.error('Caught login error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to log in",
        variant: "destructive",
      });
    } finally {
      setIsLoginLoading(false);
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
      
      // Set user access level
      setCurrentAccessLevel('user');
      
      toast({
        title: "Success",
        description: "Logged in successfully",
      });
      
      // Clear form
      setUserLoginForm({ email: '', password: '' });
      
      // Modal will close automatically when auth state updates
      
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
      setCurrentAccessLevel(null);
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

  // Load data only when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
      fetchProducts();
      fetchTestimonials();
      fetchMessages();
      fetchUsers();
    }
  }, [isAuthenticated]);

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      // Optimistic update
      setOrders(prev =>
        prev.map(o => (o.id === orderId ? { ...o, status: newStatus } as Order : o))
      );

      const allowed = ['pending', 'processing', 'delivered', 'cancelled'];
      const status = allowed.includes(newStatus) ? newStatus : 'pending';

      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);

      if (error) throw error;

      toast({ title: "Success", description: "Order status updated" });
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
      // Revert to server state
      fetchOrders();
    }
  };

  const handleToggleProductStatus = async (productId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !isActive })
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product status updated successfully",
      });

      fetchProducts();
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: "Error",
        description: "Failed to update product status",
        variant: "destructive",
      });
    }
  };

  const handleToggleTestimonialStatus = async (testimonialId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('testimonials')
        .update({ is_active: !isActive })
        .eq('id', testimonialId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Testimonial status updated successfully",
      });

      fetchTestimonials();
    } catch (error) {
      console.error('Error updating testimonial:', error);
      toast({
        title: "Error",
        description: "Failed to update testimonial status",
        variant: "destructive",
      });
    }
  };

  const handleUpdateMessageStatus = async (messageId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('contact_messages')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', messageId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Message status updated successfully",
      });

      fetchMessages();
    } catch (error) {
      console.error('Error updating message:', error);
      toast({
        title: "Error",
        description: "Failed to update message status",
        variant: "destructive",
      });
    }
  };

  const handleViewMessage = (message: any) => {
    setSelectedMessage(message);
    setShowViewMessage(true);
  };

  const handleCreateProduct = async (productData: Omit<Product, 'id' | 'created_at'>) => {
    try {
      const { error } = await supabase.from('products').insert({
        name: productData.name,
        size: productData.size,
        price: productData.price,
        stock: productData.stock ?? 0,
        description: productData.description ?? '',
        image_url: productData.image_url ?? '',
        is_active: productData.is_active ?? true,
      });
      if (error) throw error;
      toast({ title: 'Success', description: 'Product created' });
      setShowCreateProduct(false);
      fetchProducts();
    } catch (error) {
      console.error('Error creating product:', error);
      toast({ title: 'Error', description: 'Failed to create product', variant: 'destructive' });
    }
  };

  const handleUpdateProduct = async (product: Product) => {
    try {
      const { error } = await supabase.from('products').update({
        name: product.name,
        size: product.size,
        price: product.price,
        stock: product.stock,
        description: product.description,
        image_url: product.image_url,
        is_active: product.is_active,
      }).eq('id', product.id);
      if (error) throw error;
      toast({ title: 'Success', description: 'Product updated' });
      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      console.error('Error updating product:', error);
      toast({ title: 'Error', description: 'Failed to update product', variant: 'destructive' });
    }
  };

  const handleCreateTestimonial = async (t: Omit<Testimonial, 'id' | 'created_at'>) => {
    try {
      const { error } = await supabase.from('testimonials').insert({
        name: t.name,
        location: t.location,
        review: t.review,
        rating: t.rating ?? 5,
        verified: t.verified ?? true,
        is_active: t.is_active ?? true,
        avatar: t.avatar ?? '',
        order_type: t.order_type ?? null,
      });
      if (error) throw error;
      toast({ title: 'Success', description: 'Testimonial created' });
      setShowCreateTestimonial(false);
      fetchTestimonials();
    } catch (error) {
      console.error('Error creating testimonial:', error);
      toast({ title: 'Error', description: 'Failed to create testimonial', variant: 'destructive' });
    }
  };

  const handleUpdateTestimonial = async (t: Testimonial) => {
    try {
      const { error } = await supabase.from('testimonials').update({
        name: t.name,
        location: t.location,
        review: t.review,
        rating: t.rating,
        verified: t.verified,
        is_active: t.is_active,
        avatar: t.avatar,
        order_type: t.order_type,
      }).eq('id', t.id);
      if (error) throw error;
      toast({ title: 'Success', description: 'Testimonial updated' });
      setEditingTestimonial(null);
      fetchTestimonials();
    } catch (error) {
      console.error('Error updating testimonial:', error);
      toast({ title: 'Error', description: 'Failed to update testimonial', variant: 'destructive' });
    }
  };

  const exportOrdersCSV = () => {
    const headers = ['order_number','customer_name','customer_email','customer_phone','delivery_type','delivery_address','items','total_amount','status','created_at'];
    const rows = orders.map(o => [
      o.order_number,
      o.customer_name,
      o.customer_email,
      o.customer_phone,
      o.delivery_type,
      o.delivery_address,
      typeof o.items === 'string' ? o.items : JSON.stringify(o.items),
      o.total_amount,
      o.status,
      o.created_at,
    ]);
    const escape = (v: any) => '"' + String(v ?? '').replace(/"/g,'""') + '"';
    const csv = [headers.join(','), ...rows.map(r => r.map(escape).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_export_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };


  // User management functions
  const handleResetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      
      if (error) throw error;
      
      toast({
        title: "Success", 
        description: `Password reset email sent to ${email}`,
      });
    } catch (error) {
      console.error('Error sending reset email:', error);
      toast({
        title: "Error",
        description: "Failed to send password reset email",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    
    try {
      // Delete from profiles and user_roles tables first
      const { error: profileError } = await supabase.from('profiles').delete().eq('user_id', userId);
      if (profileError) throw profileError;
      
      const { error: roleError } = await supabase.from('user_roles').delete().eq('user_id', userId);
      if (roleError) throw roleError;
      
      // Delete from auth.users using admin client
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      if (authError) throw authError;
      
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      
      // Refresh the users list
      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const handleCreateUser = async (userData: {
    email: string;
    password: string;
    display_name: string;
    role: string;
  }) => {
    try {
      setCreatingUser(true);
      
      // Sign up the user
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            display_name: userData.display_name,
          }
        }
      });

      if (error) throw error;
      
      if (data.user) {
        // Create profile entry  
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: data.user.id,
            display_name: userData.display_name,
            email: userData.email,
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
        }

        // Set user role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: data.user.id,
            role: userData.role,
          });

        if (roleError) {
          console.error('Role assignment error:', roleError);
        }

        toast({
          title: "Success",
          description: `User ${userData.email} created successfully`,
        });

        setShowCreateUser(false);
        fetchUsers();
      }
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    } finally {
      setCreatingUser(false);
    }
  };


  const handleUpdateUser = async (updatedUser: any) => {
    try {
      setUpdatingUser(true);
      
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          display_name: updatedUser.display_name,
          email: updatedUser.email,
        })
        .eq('user_id', updatedUser.id);

      if (profileError) throw profileError;

      // Update roles if changed
      if (updatedUser.roles && updatedUser.roles.length > 0) {
        // Delete existing roles
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', updatedUser.id);
        
        // Insert new roles
        const roleInserts = updatedUser.roles.map((role: string) => ({
          user_id: updatedUser.id,
          role: role,
        }));
        
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert(roleInserts);
          
        if (roleError) throw roleError;
      }

      toast({
        title: "Success",
        description: "User updated successfully",
      });

      setEditingUser(null);
      fetchUsers();
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    } finally {
      setUpdatingUser(false);
    }
  };

  // Render functions for all tabs
  const renderOrders = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Orders Management</h3>
          <p className="text-sm text-muted-foreground">Manage customer orders</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportOrdersCSV}>Export CSV</Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-center">Loading orders...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.order_number}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.customer_name}</div>
                          <div className="text-sm text-muted-foreground">{order.customer_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {Array.isArray(order.items) ? order.items.length : 1} item(s)
                      </TableCell>
                      <TableCell>${order.total_amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(order.status)}
                          <Badge className={`${getStatusColor(order.status)} capitalize`}>
                            {order.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>{format(new Date(order.created_at), 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowOrderDetails(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Select value={order.status} onValueChange={(value) => handleUpdateOrderStatus(order.id, value)}>
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="processing">Processing</SelectItem>
                              <SelectItem value="delivered">Delivered</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderProducts = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Products Management</h3>
          <p className="text-sm text-muted-foreground">Manage product catalog</p>
        </div>
        <Button onClick={() => setShowCreateProduct(true)}>
          <Plus className="h-4 w-4 mr-2" /> Create Product
        </Button>
      </div>

      {/* Modals */}
      <CreateProductModal
        isOpen={showCreateProduct}
        onClose={() => setShowCreateProduct(false)}
        onSuccess={fetchProducts}
      />
      {editingProduct && (
        <EditProductModal
          isOpen={!!editingProduct}
          onClose={() => setEditingProduct(null)}
          product={editingProduct}
          onSuccess={fetchProducts}
        />
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-center">Loading products...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No products found
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.size}</TableCell>
                      <TableCell>${product.price.toFixed(2)}</TableCell>
                      <TableCell>{product.stock}</TableCell>
                      <TableCell>
                        <Badge variant={product.is_active ? 'default' : 'secondary'}>
                          {product.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(new Date(product.created_at), 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" onClick={() => setEditingProduct(product)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleProductStatus(product.id, product.is_active)}
                          >
                            {product.is_active ? 'Deactivate' : 'Activate'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderTestimonials = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Testimonials Management</h3>
          <p className="text-sm text-muted-foreground">Manage customer testimonials</p>
        </div>
        <Button onClick={() => setShowCreateTestimonial(true)}>
          <Plus className="h-4 w-4 mr-2" /> Create Testimonial
        </Button>
      </div>

      {/* Modals */}
      <CreateTestimonialModal
        isOpen={showCreateTestimonial}
        onClose={() => setShowCreateTestimonial(false)}
        onSuccess={fetchTestimonials}
      />
      {editingTestimonial && (
        <EditTestimonialModal
          isOpen={!!editingTestimonial}
          onClose={() => setEditingTestimonial(null)}
          testimonial={editingTestimonial}
          onSuccess={fetchTestimonials}
        />
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-center">Loading testimonials...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Review</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {testimonials.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No testimonials found
                    </TableCell>
                  </TableRow>
                ) : (
                  testimonials.map((testimonial) => (
                    <TableRow key={testimonial.id}>
                      <TableCell className="font-medium">{testimonial.name}</TableCell>
                      <TableCell>{testimonial.location}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                          {testimonial.rating}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{testimonial.review}</TableCell>
                      <TableCell>
                        <Badge variant={testimonial.is_active ? 'default' : 'secondary'}>
                          {testimonial.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(new Date(testimonial.created_at), 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" onClick={() => setEditingTestimonial(testimonial)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleTestimonialStatus(testimonial.id, testimonial.is_active)}
                          >
                            {testimonial.is_active ? 'Deactivate' : 'Activate'}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderMessages = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Contact Messages</h3>
          <p className="text-sm text-muted-foreground">Manage customer inquiries</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-center">Loading messages...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No messages found
                    </TableCell>
                  </TableRow>
                ) : (
                  messages.map((message) => (
                    <TableRow key={message.id}>
                      <TableCell className="font-medium">{message.name}</TableCell>
                      <TableCell>{message.email}</TableCell>
                      <TableCell>{message.phone}</TableCell>
                      <TableCell className="max-w-xs truncate">{message.message}</TableCell>
                      <TableCell>
                        <Badge variant={message.status === 'responded' ? 'default' : 'secondary'}>
                          {message.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(new Date(message.created_at), 'MMM d, yyyy')}</TableCell>
                       <TableCell>
                         <div className="flex space-x-2">
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => handleViewMessage(message)}
                             className="flex items-center gap-1"
                           >
                             <Eye className="h-4 w-4" />
                             View
                           </Button>
                           <Select value={message.status} onValueChange={(value) => handleUpdateMessageStatus(message.id, value)}>
                             <SelectTrigger className="w-32">
                               <SelectValue />
                             </SelectTrigger>
                             <SelectContent>
                               <SelectItem value="unread">Unread</SelectItem>
                               <SelectItem value="responded">Responded</SelectItem>
                               <SelectItem value="resolved">Resolved</SelectItem>
                             </SelectContent>
                           </Select>
                         </div>
                       </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // Initialize data
  // Remove the useEffect that loads data immediately
  // Data will be loaded when user is authenticated

  const renderUserManagement = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">User Management</h3>
            <p className="text-sm text-muted-foreground">Control user accounts and roles</p>
          </div>
          <Button onClick={() => setShowCreateUser(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create User
          </Button>
        </div>

        <CreateUserModal
          isOpen={showCreateUser}
          onClose={() => setShowCreateUser(false)}
          onCreateUser={handleCreateUser}
          isCreating={creatingUser}
        />

        {editingUser && (
          <EditUserModal
            isOpen={!!editingUser}
            onClose={() => setEditingUser(null)}
            onUpdateUser={handleUpdateUser}
            user={editingUser}
            isUpdating={updatingUser}
          />
        )}


        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 text-center">Loading users...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => {
                      return (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.email}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {user.roles?.map((role: string) => (
                                <Badge 
                                  key={role}
                                  variant={role === 'admin' ? 'default' : 'secondary'}
                                >
                                  {role}
                                </Badge>
                              )) || (
                                <Badge variant="secondary">user</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{format(new Date(user.created_at), 'MMM d, yyyy')}</TableCell>
                          <TableCell>
                            {user.last_sign_in_at ? format(new Date(user.last_sign_in_at), 'MMM d, yyyy') : 'Never'}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingUser(user)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleResetPassword(user.email)}
                              >
                                Reset Password
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteUser(user.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Site Settings</h3>
        <p className="text-sm text-muted-foreground">Manage website contact information and business details</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={siteSettings.phone}
                onChange={(e) => setSiteSettings({ ...siteSettings, phone: e.target.value })}
                placeholder="e.g., 1-499-4611"
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={siteSettings.email}
                onChange={(e) => setSiteSettings({ ...siteSettings, email: e.target.value })}
                placeholder="e.g., info@aquavi.com"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="address">Business Address</Label>
            <Textarea
              id="address"
              value={siteSettings.address}
              onChange={(e) => setSiteSettings({ ...siteSettings, address: e.target.value })}
              placeholder="e.g., MoneyGram, Flemming Street, Road Town, Tortola"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="logo_url">Logo URL</Label>
            <Input
              id="logo_url"
              value={siteSettings.logo_url}
              onChange={(e) => setSiteSettings({ ...siteSettings, logo_url: e.target.value })}
              placeholder="e.g., /lovable-uploads/logo.png"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Business Hours</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="business_hours_monday_friday">Monday - Friday</Label>
            <Input
              id="business_hours_monday_friday"
              value={siteSettings.business_hours_monday_friday}
              onChange={(e) => setSiteSettings({ ...siteSettings, business_hours_monday_friday: e.target.value })}
              placeholder="e.g., 8:00 AM - 6:00 PM"
            />
          </div>
          
          <div>
            <Label htmlFor="business_hours_saturday">Saturday</Label>
            <Input
              id="business_hours_saturday"
              value={siteSettings.business_hours_saturday}
              onChange={(e) => setSiteSettings({ ...siteSettings, business_hours_saturday: e.target.value })}
              placeholder="e.g., 9:00 AM - 4:00 PM"
            />
          </div>
          
          <div>
            <Label htmlFor="business_hours_sunday">Sunday</Label>
            <Input
              id="business_hours_sunday"
              value={siteSettings.business_hours_sunday}
              onChange={(e) => setSiteSettings({ ...siteSettings, business_hours_sunday: e.target.value })}
              placeholder="e.g., Emergency Only"
            />
          </div>
          
          <div>
            <Label htmlFor="delivery_hours">Delivery Hours</Label>
            <Input
              id="delivery_hours"
              value={siteSettings.delivery_hours}
              onChange={(e) => setSiteSettings({ ...siteSettings, delivery_hours: e.target.value })}
              placeholder="e.g., 3:30 PM - 5:30 PM"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button 
          onClick={updateSiteSettings}
          disabled={settingsLoading}
        >
          {settingsLoading ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );

  // Statistics
  const totalRevenue = orders
    .filter(order => order.status === 'delivered')
    .reduce((sum, order) => sum + order.total_amount, 0);
  const pendingOrders = orders.filter(order => order.status === 'pending').length;

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Don't render main content until user is authenticated
  if (!isAuthenticated || showAdminLogin) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Admin Login Modal */}
        <Dialog open={showAdminLogin} onOpenChange={() => {}} modal={true}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center">Dashboard Access</DialogTitle>
              <DialogDescription className="text-center">
                Please sign in to access the dashboard
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="user" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="admin">Admin Login</TabsTrigger>
                <TabsTrigger value="user">User Login</TabsTrigger>
              </TabsList>
              
              <TabsContent value="admin" className="mt-4">
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="admin-email">Admin Email</Label>
                    <Input
                      id="admin-email"
                      type="email"
                      value={adminLoginForm.email}
                      onChange={(e) => setAdminLoginForm({ ...adminLoginForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="admin-password">Admin Password</Label>
                    <Input
                      id="admin-password"
                      type="password"
                      value={adminLoginForm.password}
                      onChange={(e) => setAdminLoginForm({ ...adminLoginForm, password: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoginLoading}>
                    {isLoginLoading ? 'Signing in...' : 'Sign In as Admin'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="user" className="mt-4">
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
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>

        <ForgotPasswordModal 
          isOpen={showForgotPassword}
          onClose={() => setShowForgotPassword(false)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Package className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Access Water 360</h1>
                <p className="text-sm text-gray-500">
                  {currentAccessLevel === 'admin' ? 'Admin Dashboard' : 'Order Management'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {currentAccessLevel === 'admin' && (
                <div className="flex items-center space-x-2">
                  <Label htmlFor="receive-orders" className="text-sm font-medium">
                    Receive Orders
                  </Label>
                  <Switch 
                    id="receive-orders"
                    checked={receiveOrders}
                    onCheckedChange={updateReceiveOrdersSetting}
                  />
                </div>
              )}
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orders.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingOrders}</div>
            </CardContent>
          </Card>

          {/* Admin-only statistics */}
          {currentAccessLevel === 'admin' && (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{products.length}</div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg border">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'orders', label: 'Orders', icon: ShoppingBag },
                ...(currentAccessLevel === 'admin' ? [
                  { id: 'products', label: 'Products', icon: Package },
                  { id: 'testimonials', label: 'Testimonials', icon: Star },
                  { id: 'customers', label: 'Customers', icon: Users },
                  { id: 'user-management', label: 'User Management', icon: Users },
                  { id: 'messages', label: 'Messages', icon: MessageSquare },
                  { id: 'settings', label: 'Settings', icon: Key },
                ] : []),
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'user-management' && currentAccessLevel === 'admin' && renderUserManagement()}
            {activeTab === 'orders' && renderOrders()}
            {activeTab === 'products' && currentAccessLevel === 'admin' && renderProducts()}
            {activeTab === 'testimonials' && currentAccessLevel === 'admin' && renderTestimonials()}
            {activeTab === 'messages' && currentAccessLevel === 'admin' && renderMessages()}
            {activeTab === 'settings' && currentAccessLevel === 'admin' && renderSettings()}
            {activeTab === 'customers' && currentAccessLevel === 'admin' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold">Customer Analytics</h3>
                  <p className="text-sm text-muted-foreground">Customer insights from order data</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {new Set(orders.map(order => order.customer_email)).size}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Repeat Customers</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {orders.reduce((acc, order) => {
                          const customerOrders = orders.filter(o => o.customer_email === order.customer_email);
                          return customerOrders.length > 1 ? acc + 1 : acc;
                        }, 0)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        ${orders.length ? (orders.reduce((sum, order) => sum + order.total_amount, 0) / orders.length).toFixed(2) : '0.00'}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Customer Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>Orders</TableHead>
                          <TableHead>Total Spent</TableHead>
                          <TableHead>Last Order</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Array.from(new Set(orders.map(order => order.customer_email)))
                          .map(email => {
                            const customerOrders = orders.filter(order => order.customer_email === email);
                            const lastOrder = customerOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
                            return {
                              name: lastOrder.customer_name,
                              email: email,
                              phone: lastOrder.customer_phone,
                              orderCount: customerOrders.length,
                              totalSpent: customerOrders.reduce((sum, order) => sum + order.total_amount, 0),
                              lastOrderDate: lastOrder.created_at
                            };
                          })
                          .map((customer, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{customer.name}</TableCell>
                              <TableCell>{customer.email}</TableCell>
                              <TableCell>{customer.phone}</TableCell>
                              <TableCell>{customer.orderCount}</TableCell>
                              <TableCell>${customer.totalSpent.toFixed(2)}</TableCell>
                              <TableCell>{format(new Date(customer.lastOrderDate), 'MMM d, yyyy')}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* Global Modals */}
        <OrderDetailsModal
          order={selectedOrder}
          isOpen={showOrderDetails}
          onClose={() => {
            setShowOrderDetails(false);
            setSelectedOrder(null);
          }}
          onUpdateStatus={handleUpdateOrderStatus}
          isUpdating={loading}
        />

        {/* View Message Modal */}
        <ViewMessageModal
          isOpen={showViewMessage}
          onClose={() => {
            setShowViewMessage(false);
            setSelectedMessage(null);
          }}
          message={selectedMessage}
          onUpdateStatus={handleUpdateMessageStatus}
        />

        {/* Keep only the ForgotPasswordModal here */}
        <ForgotPasswordModal 
          isOpen={showForgotPassword}
          onClose={() => setShowForgotPassword(false)}
        />
      </div>
    </div>
  );
};

export default AdminDashboard;
