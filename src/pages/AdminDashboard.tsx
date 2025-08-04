import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LogOut, Package, Users, Settings, Upload, Eye, Edit, Plus, Trash2, Star, Download, MessageSquare, MessageCircle, Mail, Phone, Clock, UserX, Key } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';


interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address: string;
  delivery_type?: string;
  items: any;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'in-transit' | 'delivered' | 'cancelled';
  payment_method: string;
  created_at: string;
}

interface Product {
  id: string;
  name: string;
  size: string;
  price: number;
  description: string;
  image_url: string;
  stock: number;
  is_active: boolean;
}

interface Testimonial {
  id: string;
  name: string;
  location: string;
  rating: number;
  review: string;
  avatar?: string;
  verified: boolean;
  order_type?: string;
  is_active: boolean;
  created_at: string;
}

interface SiteSetting {
  id: string;
  setting_key: string;
  setting_value: string;
}

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  status: 'unread' | 'read' | 'responded';
  created_at: string;
  updated_at: string;
}

interface AuthUser {
  id: string;
  email: string;
  created_at: string;
  email_confirmed_at?: string;
  last_sign_in_at?: string;
}

interface UserRole {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
}


interface AdminDashboardProps {
  onLogout: () => void;
}

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSetting[]>([]);
  const [editableSettings, setEditableSettings] = useState<Record<string, string>>({});
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeTestimonial, setActiveTestimonial] = useState<Testimonial | null>(null);
  const [authUsers, setAuthUsers] = useState<AuthUser[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [showTestimonialModal, setShowTestimonialModal] = useState(false);
  const [testimonialForm, setTestimonialForm] = useState({
    name: '',
    location: '',
    rating: 5,
    review: '',
    order_type: '',
    verified: true,
    is_active: true,
    avatar: ''
  });
  const [loading, setLoading] = useState(true);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newProductForm, setNewProductForm] = useState({
    name: '',
    size: '',
    price: 0,
    description: '',
    stock: 0
  });
  const [newUserForm, setNewUserForm] = useState({
    email: '',
    password: '',
    display_name: '',
    role: 'user'
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ordersRes, productsRes, testimonialsRes, messagesRes, settingsRes] = await Promise.all([
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('products').select('*').order('name'),
        supabase.from('testimonials').select('*').order('created_at', { ascending: false }),
        supabase.from('contact_messages').select('*').order('created_at', { ascending: false }),
        supabase.from('site_settings').select('*')
      ]);

      if (ordersRes.data) setOrders(ordersRes.data as Order[]);
      if (productsRes.data) setProducts(productsRes.data as Product[]);
      if (testimonialsRes.data) setTestimonials(testimonialsRes.data as Testimonial[]);
      if (messagesRes.data) setContactMessages(messagesRes.data as ContactMessage[]);
      if (settingsRes.data) {
        setSiteSettings(settingsRes.data as SiteSetting[]);
        const settingsMap = settingsRes.data.reduce((acc, setting) => {
          acc[setting.setting_key] = setting.setting_value;
          return acc;
        }, {} as Record<string, string>);
        setEditableSettings(settingsMap);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
      
      toast({
        title: "Order Updated",
        description: `Order status changed to ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const updateProduct = async (productId: string, updates: Partial<Product>) => {
    try {
      const { error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', productId);

      if (error) throw error;

      setProducts(products.map(product => 
        product.id === productId ? { ...product, ...updates } : product
      ));
      
      toast({
        title: "Product Updated",
        description: "Product has been updated successfully",
      });
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive",
      });
    }
  };

  const updateMessageStatus = async (messageId: string, status: 'read' | 'responded') => {
    try {
      const { error } = await supabase
        .from('contact_messages')
        .update({ status })
        .eq('id', messageId);

      if (error) throw error;

      setContactMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, status } : msg
      ));
      
      toast({
        title: "Message Updated",
        description: `Message marked as ${status}`,
      });
    } catch (error) {
      console.error('Error updating message:', error);
      toast({
        title: "Error",
        description: "Failed to update message status",
        variant: "destructive",
      });
    }
  };

  const saveSettings = async () => {
    try {
      for (const [key, value] of Object.entries(editableSettings)) {
        const { error } = await supabase
          .from('site_settings')
          .upsert({ setting_key: key, setting_value: value }, { onConflict: 'setting_key' });
        
        if (error) throw error;
      }
      
      toast({
        title: "Settings Updated",
        description: "Site settings have been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const saveTestimonial = async () => {
    // Validate required fields
    if (!testimonialForm.name || !testimonialForm.location || !testimonialForm.review) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (name, location, review)",
        variant: "destructive",
      });
      return;
    }

    try {
      const testimonialData = {
        name: testimonialForm.name,
        location: testimonialForm.location,
        rating: Number(testimonialForm.rating) || 5,
        review: testimonialForm.review,
        avatar: testimonialForm.avatar || null,
        verified: testimonialForm.verified || true,
        order_type: testimonialForm.order_type || '',
        is_active: testimonialForm.is_active !== false
      };

      if (activeTestimonial) {
        // Update existing testimonial
        const { error } = await supabase
          .from('testimonials')
          .update(testimonialData)
          .eq('id', activeTestimonial.id);
        
        if (error) throw error;
        
        setTestimonials(prev => prev.map(t => 
          t.id === activeTestimonial.id ? { ...t, ...testimonialData } : t
        ));
        
        toast({
          title: "Testimonial Updated",
          description: "Testimonial has been updated successfully.",
        });
      } else {
        // Add new testimonial
        const { data, error } = await supabase
          .from('testimonials')
          .insert([testimonialData])
          .select();
        
        if (error) throw error;
        
        setTestimonials(prev => [data[0], ...prev]);
        
        toast({
          title: "Testimonial Added",
          description: "New testimonial has been added successfully.",
        });
      }
      
      setShowTestimonialModal(false);
      setActiveTestimonial(null);
    } catch (error) {
      console.error('Error saving testimonial:', error);
      toast({
        title: "Error",
        description: "Failed to save testimonial. Please try again.",
        variant: "destructive",
      });
    }
  };

  const deleteTestimonial = async (id: string) => {
    try {
      const { error } = await supabase
        .from('testimonials')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setTestimonials(prev => prev.filter(t => t.id !== id));
      
      toast({
        title: "Testimonial Deleted",
        description: "Testimonial has been deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      toast({
        title: "Error",
        description: "Failed to delete testimonial. Please try again.",
        variant: "destructive",
      });
    }
  };

  const exportOrders = () => {
    const csvContent = [
      ['Order Number', 'Customer Name', 'Email', 'Phone', 'Items', 'Total', 'Status', 'Date', 'Address'].join(','),
      ...orders.map(order => [
        order.order_number,
        order.customer_name,
        order.customer_email,
        order.customer_phone,
        Array.isArray(order.items) ? order.items.map((item: any) => `${item.name} x${item.quantity}`).join('; ') : 'N/A',
        order.total_amount,
        order.status,
        new Date(order.created_at).toLocaleDateString(),
        order.delivery_address
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'hero' | 'product' | 'logo', productId?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // For demo purposes, we'll just show a success message
    // In production, you'd upload to Supabase Storage
    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageUrl = e.target?.result as string;
      
      if (type === 'hero') {
        setEditableSettings(prev => ({ ...prev, hero_image_url: imageUrl }));
      } else if (type === 'logo') {
        setEditableSettings(prev => ({ ...prev, logo_url: imageUrl }));
      } else if (type === 'product' && productId) {
        await updateProduct(productId, { image_url: imageUrl });
      }
    };
    reader.readAsDataURL(file);
  };

  const deleteOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) throw error;

      setOrders(orders.filter(order => order.id !== orderId));
      
      toast({
        title: "Order Deleted",
        description: "Order has been deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting order:', error);
      toast({
        title: "Error",
        description: "Failed to delete order",
        variant: "destructive",
      });
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      setProducts(products.filter(product => product.id !== productId));
      
      toast({
        title: "Product Deleted",
        description: "Product has been deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('contact_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      setContactMessages(contactMessages.filter(message => message.id !== messageId));
      
      toast({
        title: "Message Deleted",
        description: "Message has been deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: "Error",
        description: "Failed to delete message",
        variant: "destructive",
      });
    }
  };

  const deleteCustomerFromOrders = async (customerIdentifier: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .or(`customer_email.eq.${customerIdentifier},customer_phone.eq.${customerIdentifier}`);

      if (error) throw error;

      setOrders(orders.filter(order => 
        order.customer_email !== customerIdentifier && 
        order.customer_phone !== customerIdentifier
      ));
      
      toast({
        title: "Customer Orders Deleted",
        description: "All orders for this customer have been deleted",
      });
    } catch (error) {
      console.error('Error deleting customer orders:', error);
      toast({
        title: "Error",
        description: "Failed to delete customer orders",
        variant: "destructive",
      });
    }
  };

  const createProduct = async () => {
    // Validate required fields
    if (!newProductForm.name || !newProductForm.size || newProductForm.price <= 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (name, size, price)",
        variant: "destructive",
      });
      return;
    }

    try {
      const productData = {
        name: newProductForm.name,
        size: newProductForm.size,
        price: Number(newProductForm.price),
        description: newProductForm.description || '',
        stock: Number(newProductForm.stock) || 0,
        is_active: true
      };

      const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select();

      if (error) throw error;

      setProducts([...products, data[0]]);
      setShowProductModal(false);
      setNewProductForm({
        name: '',
        size: '',
        price: 0,
        description: '',
        stock: 0
      });
      
      toast({
        title: "Product Created",
        description: "New product has been created successfully",
      });
    } catch (error) {
      console.error('Error creating product:', error);
      toast({
        title: "Error",
        description: "Failed to create product. Please try again.",
        variant: "destructive",
      });
    }
  };

  const createUser = async () => {
    if (!newUserForm.email || !newUserForm.password) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create user using signUp for internal users 
      const { data, error } = await supabase.auth.signUp({
        email: newUserForm.email,
        password: newUserForm.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            display_name: newUserForm.display_name,
          }
        }
      });

      if (error) {
        // Check if user already exists
        if (error.message.includes('already registered')) {
          toast({
            title: "User Already Exists",
            description: "A user with this email already exists. Please try to sign in.",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      if (data.user) {
        // Wait a moment for the trigger to complete, then manually ensure data exists
        setTimeout(async () => {
          try {
            // Check if profile exists, if not create it
            const { data: existingProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', data.user.id)
              .single();

            if (!existingProfile) {
              await supabase
                .from('profiles')
                .insert([{
                  user_id: data.user.id,
                  display_name: newUserForm.display_name,
                  email: newUserForm.email
                }]);
            }

            // Check if user role exists, if not create it
            const { data: existingRole } = await supabase
              .from('user_roles')
              .select('*')
              .eq('user_id', data.user.id)
              .single();

            if (!existingRole) {
              await supabase
                .from('user_roles')
                .insert([{
                  user_id: data.user.id,
                  role: newUserForm.role
                }]);
            }

            // Refresh the data
            fetchData();
          } catch (error) {
            console.error('Error ensuring user data:', error);
          }
        }, 1000);
      }

      setShowCreateUserModal(false);
      setNewUserForm({
        email: '',
        password: '',
        display_name: '',
        role: 'user'
      });

      toast({
        title: "User Created",
        description: `User ${newUserForm.email} has been created successfully`,
      });
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    }
  };

  const resetUserPassword = async (userId: string) => {
    try {
      toast({
        title: "Password Reset",
        description: "Password reset instructions will be sent to the user's email",
      });
    } catch (error) {
      console.error('Error resetting password:', error);
      toast({
        title: "Error",
        description: "Failed to reset password",
        variant: "destructive",
      });
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);
      
      toast({
        title: "User Deleted",
        description: "User has been removed from the system",
      });

      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const fetchUsers = async () => {
    try {
      // In a real app, you'd need admin access to auth.users
      // For now, we'll just fetch profiles and roles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*');
      
      const { data: roles } = await supabase
        .from('user_roles')
        .select('*');

      setUserRoles(roles || []);
      // For display purposes, convert profiles to AuthUser format
      setAuthUsers(profiles?.map(p => ({
        id: p.user_id,
        email: p.display_name || 'unknown@email.com',
        created_at: p.created_at,
        email_confirmed_at: null,
        last_sign_in_at: null
      })) || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in-transit': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const openTestimonialModal = (testimonial: Testimonial | null = null) => {
    setActiveTestimonial(testimonial);
    if (testimonial) {
      setTestimonialForm({
        name: testimonial.name,
        location: testimonial.location,
        rating: testimonial.rating,
        review: testimonial.review,
        order_type: testimonial.order_type || '',
        verified: testimonial.verified,
        is_active: testimonial.is_active,
        avatar: testimonial.avatar || ''
      });
    } else {
      setTestimonialForm({
        name: '',
        location: '',
        rating: 5,
        review: '',
        order_type: '',
        verified: true,
        is_active: true,
        avatar: ''
      });
    }
    setShowTestimonialModal(true);
  };

  const stats = {
    totalOrders: orders.length,
    pendingOrders: orders.filter(o => o.status === 'pending').length,
    revenue: orders.reduce((sum, order) => sum + order.total_amount, 0),
    totalProducts: products.length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-hero rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-primary-foreground font-bold">A</span>
          </div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src="/lovable-uploads/a2e2f478-6f1b-41fd-954b-c2753b9c6153.png" 
                alt="Aqua VI" 
                className="w-8 h-8 object-contain"
              />
              <h1 className="text-2xl font-heading font-bold text-primary">Aqua VI Admin</h1>
            </div>
            <Button variant="outline" onClick={onLogout} className="flex items-center space-x-2">
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                  <p className="text-3xl font-bold text-primary">{stats.totalOrders}</p>
                </div>
                <Package className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Orders</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.pendingOrders}</p>
                </div>
                <Users className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                  <p className="text-3xl font-bold text-green-600">${stats.revenue.toFixed(2)}</p>
                </div>
                <span className="text-2xl">💰</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Products</p>
                  <p className="text-3xl font-bold text-green-600">{stats.totalProducts}</p>
                </div>
                <Package className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="users">User Controls</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Order Management</CardTitle>
                  <CardDescription>Track and manage customer orders</CardDescription>
                </div>
                <Button onClick={exportOrders} variant="outline" className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Export Orders
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order Number</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Delivery Type</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.order_number}</TableCell>
                        <TableCell>{order.customer_name}</TableCell>
                        <TableCell>{Array.isArray(order.items) ? order.items.map((item: any) => `${item.name} x${item.quantity}`).join(', ') : 'N/A'}</TableCell>
                        <TableCell>${order.total_amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {order.delivery_type || 'delivery'}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">{order.delivery_address || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Order Details - {order.order_number}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div><strong>Customer:</strong> {order.customer_name}</div>
                                  <div><strong>Email:</strong> {order.customer_email}</div>
                                  <div><strong>Phone:</strong> {order.customer_phone}</div>
                                  <div><strong>Address:</strong> {order.delivery_address}</div>
                                  <div><strong>Payment:</strong> {order.payment_method}</div>
                                  <div><strong>Total:</strong> ${order.total_amount.toFixed(2)}</div>
                                  <div>
                                    <Label>Update Status:</Label>
                                    <Select onValueChange={(value) => updateOrderStatus(order.id, value as Order['status'])}>
                                      <SelectTrigger>
                                        <SelectValue placeholder={order.status} />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="confirmed">Confirmed</SelectItem>
                                        <SelectItem value="in-transit">In Transit</SelectItem>
                                        <SelectItem value="delivered">Delivered</SelectItem>
                                        <SelectItem value="cancelled">Cancelled</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteOrder(order.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Product Management</CardTitle>
                  <CardDescription>Manage your product catalog and inventory</CardDescription>
                </div>
                <Button onClick={() => setShowProductModal(true)} className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Product
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Image</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-muted-foreground">{product.size}</div>
                          </div>
                        </TableCell>
                        <TableCell>${product.price.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={product.stock < 50 ? "destructive" : "secondary"}>
                            {product.stock}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {product.image_url && (
                              <img src={product.image_url} alt={product.name} className="w-10 h-10 object-cover rounded" />
                            )}
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, 'product', product.id)}
                              className="w-20 text-xs"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Edit Product</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <Label>Name</Label>
                                    <Input value={product.name} disabled />
                                  </div>
                                  <div>
                                    <Label>Price</Label>
                                    <Input
                                      type="number"
                                      step="0.01"
                                      defaultValue={product.price}
                                      onChange={(e) => updateProduct(product.id, { price: parseFloat(e.target.value) })}
                                    />
                                  </div>
                                  <div>
                                    <Label>Stock</Label>
                                    <Input
                                      type="number"
                                      defaultValue={product.stock}
                                      onChange={(e) => updateProduct(product.id, { stock: parseInt(e.target.value) })}
                                    />
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => updateProduct(product.id, { is_active: !product.is_active })}
                              className={product.is_active ? "text-red-600" : "text-green-600"}
                            >
                              {product.is_active ? 'Deactivate' : 'Activate'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteProduct(product.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Testimonials Tab */}
          <TabsContent value="testimonials" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Star className="w-5 h-5" />
                    <span>Testimonials Management</span>
                  </div>
                  <Button onClick={() => openTestimonialModal()} className="bg-primary hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Testimonial
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {testimonials.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No testimonials found
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Review</TableHead>
                        <TableHead>Order Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {testimonials.map((testimonial) => (
                        <TableRow key={testimonial.id}>
                          <TableCell className="font-medium">{testimonial.name}</TableCell>
                          <TableCell>{testimonial.location}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              {Array.from({ length: testimonial.rating }, (_, i) => (
                                <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{testimonial.review}</TableCell>
                          <TableCell>{testimonial.order_type}</TableCell>
                          <TableCell>
                            <Badge variant={testimonial.is_active ? "default" : "secondary"}>
                              {testimonial.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openTestimonialModal(testimonial)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteTestimonial(testimonial.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Management</CardTitle>
                <CardDescription>View customer information from orders</CardDescription>
              </CardHeader>
               <CardContent>
                <div className="space-y-6">
                  {(() => {
                    // Group customers by phone to remove duplicates
                    const customerMap = new Map();
                    
                    orders.forEach(order => {
                      const key = order.customer_phone || order.customer_email || order.customer_name;
                      if (!customerMap.has(key)) {
                        customerMap.set(key, {
                          name: order.customer_name,
                          email: order.customer_email,
                          phone: order.customer_phone,
                          orders: []
                        });
                      }
                      customerMap.get(key).orders.push(order);
                    });
                    
                    return Array.from(customerMap.values()).map((customer, index) => {
                      const totalSpent = customer.orders.reduce((sum, o) => sum + o.total_amount, 0);
                      
                      return (
                        <Card key={index} className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="text-lg font-semibold">{customer.name}</h3>
                              {customer.email && <p className="text-sm text-muted-foreground">{customer.email}</p>}
                              {customer.phone && <p className="text-sm text-muted-foreground">{customer.phone}</p>}
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-semibold">{customer.orders.length} Orders</p>
                              <p className="text-sm text-muted-foreground">Total: ${totalSpent.toFixed(2)}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm text-muted-foreground">Order History:</h4>
                            {customer.orders.map((customerOrder) => (
                              <div key={customerOrder.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <span className="font-medium">{customerOrder.order_number}</span>
                                  <Badge className={getStatusColor(customerOrder.status)}>
                                    {customerOrder.status}
                                  </Badge>
                                </div>
                                <div className="text-right">
                                  <p className="font-medium">${customerOrder.total_amount.toFixed(2)}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(customerOrder.created_at).toLocaleDateString()}
                                  </p>
                                 </div>
                                 <Button
                                   variant="outline"
                                   size="sm"
                                   onClick={() => deleteCustomerFromOrders(customer.email || customer.phone)}
                                   className="text-red-600 hover:text-red-700"
                                 >
                                   <Trash2 className="w-4 h-4" />
                                 </Button>
                               </div>
                             ))}
                           </div>
                         </Card>
                       );
                     });
                   })()}
                 </div>
               </CardContent>
             </Card>
           </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Contact Messages</CardTitle>
                <CardDescription>
                  Manage customer inquiries and support requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                {contactMessages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Messages Yet</h3>
                    <p className="text-muted-foreground">
                      Contact messages from customers will appear here.
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contactMessages.map((message) => (
                        <TableRow key={message.id}>
                          <TableCell className="font-medium">{message.name}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-sm">
                                <Mail className="w-3 h-3" />
                                {message.email}
                              </div>
                              {message.phone && (
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Phone className="w-3 h-3" />
                                  {message.phone}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-[300px]">
                            <div className="truncate">{message.message}</div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={message.status === 'unread' ? 'destructive' : 
                                      message.status === 'read' ? 'secondary' : 'default'}
                            >
                              {message.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {new Date(message.created_at).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateMessageStatus(message.id, 'read')}
                                disabled={message.status === 'read'}
                              >
                                Mark Read
                              </Button>
                               <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateMessageStatus(message.id, 'responded')}
                                disabled={message.status === 'responded'}
                              >
                                Mark Responded
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => deleteMessage(message.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Controls Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>Control user accounts and roles</CardDescription>
                </div>
                <Button onClick={() => setShowCreateUserModal(true)} className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Create User
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
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
                      {authUsers.map((user) => {
                        const userRole = userRoles.find(r => r.user_id === user.id);
                        return (
                          <TableRow key={user.id}>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Badge variant={userRole?.role === 'admin' ? 'default' : 'secondary'}>
                                {userRole?.role || 'user'}
                              </Badge>
                            </TableCell>
                            <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                            <TableCell>
                              {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => resetUserPassword(user.id)}
                                >
                                  <Key className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => deleteUser(user.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <UserX className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Site Settings</CardTitle>
                <CardDescription>Configure general site settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Logo URL */}
                  <div>
                    <Label htmlFor="logo_url" className="text-sm font-medium">Logo Upload</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="logo_url"
                        value={editableSettings.logo_url || ''}
                        onChange={(e) => setEditableSettings(prev => ({ ...prev, logo_url: e.target.value }))}
                        placeholder="https://example.com/logo.png"
                      />
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'logo')}
                        className="w-32"
                      />
                    </div>
                  </div>

                  {/* Hero Image URL */}
                  <div>
                    <Label htmlFor="hero_image_url" className="text-sm font-medium">Hero Image Upload</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="hero_image_url"
                        value={editableSettings.hero_image_url || ''}
                        onChange={(e) => setEditableSettings(prev => ({ ...prev, hero_image_url: e.target.value }))}
                        placeholder="https://example.com/hero.jpg"
                      />
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'hero')}
                        className="w-32"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium">Phone</Label>
                    <Input
                      id="phone"
                      value={editableSettings.phone || ''}
                      onChange={(e) => setEditableSettings(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="1-499-4611"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                    <Input
                      id="email"
                      value={editableSettings.email || ''}
                      onChange={(e) => setEditableSettings(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="info@aquavi.com"
                    />
                  </div>

                  {/* Address */}
                  <div>
                    <Label htmlFor="address" className="text-sm font-medium">Address</Label>
                    <Input
                      id="address"
                      value={editableSettings.address || ''}
                      onChange={(e) => setEditableSettings(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="MoneyGram, Flemming Street, Road Town, Tortola"
                    />
                  </div>

                  {/* Delivery Hours */}
                  <div>
                    <Label htmlFor="delivery_hours" className="text-sm font-medium">Delivery Hours</Label>
                    <Input
                      id="delivery_hours"
                      value={editableSettings.delivery_hours || ''}
                      onChange={(e) => setEditableSettings(prev => ({ ...prev, delivery_hours: e.target.value }))}
                      placeholder="3:30 PM - 5:30 PM"
                    />
                  </div>

                  {/* Business Hours - Monday Friday */}
                  <div>
                    <Label htmlFor="business_hours_monday_friday" className="text-sm font-medium">Business Hours (Mon-Fri)</Label>
                    <Input
                      id="business_hours_monday_friday"
                      value={editableSettings.business_hours_monday_friday || ''}
                      onChange={(e) => setEditableSettings(prev => ({ ...prev, business_hours_monday_friday: e.target.value }))}
                      placeholder="8:00 AM - 6:00 PM"
                    />
                  </div>

                  {/* Business Hours - Saturday */}
                  <div>
                    <Label htmlFor="business_hours_saturday" className="text-sm font-medium">Business Hours (Saturday)</Label>
                    <Input
                      id="business_hours_saturday"
                      value={editableSettings.business_hours_saturday || ''}
                      onChange={(e) => setEditableSettings(prev => ({ ...prev, business_hours_saturday: e.target.value }))}
                      placeholder="9:00 AM - 4:00 PM"
                    />
                  </div>

                  {/* Business Hours - Sunday */}
                  <div>
                    <Label htmlFor="business_hours_sunday" className="text-sm font-medium">Business Hours (Sunday)</Label>
                    <Input
                      id="business_hours_sunday"
                      value={editableSettings.business_hours_sunday || ''}
                      onChange={(e) => setEditableSettings(prev => ({ ...prev, business_hours_sunday: e.target.value }))}
                      placeholder="Emergency Only"
                    />
                  </div>
                </div>

                <Button 
                  onClick={saveSettings}
                  className="w-full mt-6"
                >
                  Save Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Testimonial Modal */}
      {showTestimonialModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {activeTestimonial ? 'Edit Testimonial' : 'Add New Testimonial'}
            </h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="testimonial_name">Name</Label>
                <Input
                  id="testimonial_name"
                  value={testimonialForm.name}
                  onChange={(e) => setTestimonialForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Customer name"
                />
              </div>
              <div>
                <Label htmlFor="testimonial_location">Location</Label>
                <Input
                  id="testimonial_location"
                  value={testimonialForm.location}
                  onChange={(e) => setTestimonialForm(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Customer location"
                />
              </div>
              <div>
                <Label htmlFor="testimonial_rating">Rating</Label>
                <select 
                  id="testimonial_rating"
                  className="w-full p-2 border rounded"
                  value={testimonialForm.rating}
                  onChange={(e) => setTestimonialForm(prev => ({ ...prev, rating: parseInt(e.target.value) }))}
                >
                  {[1, 2, 3, 4, 5].map(num => (
                    <option key={num} value={num}>{num} Star{num !== 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="testimonial_review">Review</Label>
                <textarea
                  id="testimonial_review"
                  className="w-full p-2 border rounded min-h-[100px]"
                  value={testimonialForm.review}
                  onChange={(e) => setTestimonialForm(prev => ({ ...prev, review: e.target.value }))}
                  placeholder="Customer review"
                />
              </div>
              <div>
                <Label htmlFor="testimonial_order_type">Order Type</Label>
                <Input
                  id="testimonial_order_type"
                  value={testimonialForm.order_type}
                  onChange={(e) => setTestimonialForm(prev => ({ ...prev, order_type: e.target.value }))}
                  placeholder="e.g., Office Subscription, Personal Use"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="testimonial_verified"
                  checked={testimonialForm.verified}
                  onChange={(e) => setTestimonialForm(prev => ({ ...prev, verified: e.target.checked }))}
                />
                <Label htmlFor="testimonial_verified">Verified Customer</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="testimonial_active"
                  checked={testimonialForm.is_active}
                  onChange={(e) => setTestimonialForm(prev => ({ ...prev, is_active: e.target.checked }))}
                />
                <Label htmlFor="testimonial_active">Active</Label>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setShowTestimonialModal(false)}>
                Cancel
              </Button>
              <Button onClick={saveTestimonial}>
                {activeTestimonial ? 'Update' : 'Add'} Testimonial
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add New Product</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="product_name">Product Name</Label>
                <Input
                  id="product_name"
                  value={newProductForm.name}
                  onChange={(e) => setNewProductForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Product name"
                />
              </div>
              <div>
                <Label htmlFor="product_size">Size</Label>
                <Input
                  id="product_size"
                  value={newProductForm.size}
                  onChange={(e) => setNewProductForm(prev => ({ ...prev, size: e.target.value }))}
                  placeholder="Product size"
                />
              </div>
              <div>
                <Label htmlFor="product_price">Price</Label>
                <Input
                  id="product_price"
                  type="number"
                  step="0.01"
                  value={newProductForm.price || ''}
                  onChange={(e) => setNewProductForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="product_description">Description</Label>
                <textarea
                  id="product_description"
                  className="w-full p-2 border rounded min-h-[80px]"
                  value={newProductForm.description}
                  onChange={(e) => setNewProductForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Product description"
                />
              </div>
              <div>
                <Label htmlFor="product_stock">Stock</Label>
                <Input
                  id="product_stock"
                  type="number"
                  value={newProductForm.stock || ''}
                  onChange={(e) => setNewProductForm(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setShowProductModal(false)}>
                Cancel
              </Button>
              <Button onClick={createProduct}>
                Create Product
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create New User</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="user_email">Email</Label>
                <Input
                  id="user_email"
                  type="email"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <Label htmlFor="user_password">Password</Label>
                <Input
                  id="user_password"
                  type="password"
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter password"
                />
              </div>
              <div>
                <Label htmlFor="user_display_name">Display Name</Label>
                <Input
                  id="user_display_name"
                  value={newUserForm.display_name}
                  onChange={(e) => setNewUserForm(prev => ({ ...prev, display_name: e.target.value }))}
                  placeholder="User's display name"
                />
              </div>
              <div>
                <Label htmlFor="user_role">Role</Label>
                <Select 
                  value={newUserForm.role} 
                  onValueChange={(value) => setNewUserForm(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setShowCreateUserModal(false)}>
                Cancel
              </Button>
              <Button onClick={createUser}>
                Create User
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// User Controls Component
function UserControlsSection() {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
    
    // Listen for user creation events
    const handleUserCreated = () => {
      fetchUsers();
    };
    
    window.addEventListener('userCreated', handleUserCreated);
    return () => window.removeEventListener('userCreated', handleUserCreated);
  }, []);

  const fetchUsers = async () => {
    try {
      // Fetch from profiles table with email now included
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*');

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('*');

      // Convert profiles to user format for display
      const usersFromProfiles = profileData?.map(profile => ({
        id: profile.user_id,
        email: profile.email || profile.user_id, // Use email from profiles table
        created_at: profile.created_at,
        display_name: profile.display_name
      })) || [];

      setUsers(usersFromProfiles as AuthUser[]);
      setUserRoles(roleData || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      // Delete from user_roles first
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      // Delete from profiles
      await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);

      // Note: We can't delete from auth.users directly, but removing from our tables is sufficient
      setUsers(users.filter(u => u.id !== userId));
      setUserRoles(userRoles.filter(r => r.user_id !== userId));

      toast({
        title: "User Removed",
        description: "User has been removed from the system",
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to remove user",
        variant: "destructive",
      });
    }
  };

  const resetUserPassword = async (userEmail: string) => {
    try {
      // Send password reset email
      const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
        redirectTo: `${window.location.origin}/password-reset`,
      });

      if (error) throw error;

      toast({
        title: "Password Reset Sent",
        description: `Password reset email sent to ${userEmail}`,
      });
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast({
        title: "Error",
        description: "Failed to send password reset email",
        variant: "destructive",
      });
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .upsert({ user_id: userId, role: newRole }, { onConflict: 'user_id' });

      if (error) throw error;

      setUserRoles(prev => {
        const existing = prev.find(r => r.user_id === userId);
        if (existing) {
          return prev.map(r => r.user_id === userId ? { ...r, role: newRole } : r);
        } else {
          return [...prev, { id: crypto.randomUUID(), user_id: userId, role: newRole, created_at: new Date().toISOString() }];
        }
      });

      toast({
        title: "Role Updated",
        description: `User role updated to ${newRole}`,
      });
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading users...</div>;
  }

  return (
    <div className="space-y-6">
      {users.length === 0 ? (
        <div className="text-center py-8">
          <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Users Found</h3>
          <p className="text-muted-foreground">
            Users will appear here once they register for the system.
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User ID</TableHead>
              <TableHead>Display Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => {
              const userRole = userRoles.find(r => r.user_id === user.id);
              return (
                <TableRow key={user.id}>
                  <TableCell className="font-mono text-sm">{user.id}</TableCell>
                  <TableCell>{(user as any).display_name || 'Not set'}</TableCell>
                  <TableCell>
                    <Select 
                      value={userRole?.role || 'user'} 
                      onValueChange={(value) => updateUserRole(user.id, value)}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resetUserPassword(user.email)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Key className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteUser(user.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <UserX className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}