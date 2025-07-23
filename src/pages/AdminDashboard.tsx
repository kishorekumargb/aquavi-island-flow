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
import { LogOut, Package, Users, Settings, Upload, Eye, Edit, Plus, Trash2, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ProductEditModal } from '@/components/ProductEditModal';

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

interface AdminDashboardProps {
  onLogout: () => void;
}

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSetting[]>([]);
  const [editableSettings, setEditableSettings] = useState<Record<string, string>>({});
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeTestimonial, setActiveTestimonial] = useState<Testimonial | null>(null);
  const [showTestimonialModal, setShowTestimonialModal] = useState(false);
  const [testimonialForm, setTestimonialForm] = useState({
    name: '',
    location: '',
    rating: 5,
    review: '',
    order_type: '',
    verified: true,
    is_active: true
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ordersRes, productsRes, testimonialsRes, settingsRes] = await Promise.all([
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('products').select('*').order('name'),
        supabase.from('testimonials').select('*').order('created_at', { ascending: false }),
        supabase.from('site_settings').select('*')
      ]);

      if (ordersRes.data) setOrders(ordersRes.data as Order[]);
      if (productsRes.data) setProducts(productsRes.data as Product[]);
      if (testimonialsRes.data) setTestimonials(testimonialsRes.data as Testimonial[]);
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
    try {
      if (activeTestimonial) {
        // Update existing testimonial
        const { error } = await supabase
          .from('testimonials')
          .update(testimonialForm)
          .eq('id', activeTestimonial.id);
        
        if (error) throw error;
        
        setTestimonials(prev => prev.map(t => 
          t.id === activeTestimonial.id ? { ...t, ...testimonialForm } : t
        ));
        
        toast({
          title: "Testimonial Updated",
          description: "Testimonial has been updated successfully.",
        });
      } else {
        // Add new testimonial
        const { data, error } = await supabase
          .from('testimonials')
          .insert([testimonialForm])
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'hero' | 'product', productId?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // For demo purposes, we'll just show a success message
    // In production, you'd upload to Supabase Storage
    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageUrl = e.target?.result as string;
      
      if (type === 'hero') {
        setEditableSettings(prev => ({ ...prev, hero_image: imageUrl }));
      } else if (type === 'product' && productId) {
        await updateProduct(productId, { image_url: imageUrl });
      }
    };
    reader.readAsDataURL(file);
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'in-transit': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
        is_active: testimonial.is_active
      });
    } else {
      setTestimonialForm({
        name: '',
        location: '',
        rating: 5,
        review: '',
        order_type: '',
        verified: true,
        is_active: true
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Management</CardTitle>
                <CardDescription>Track and manage customer orders</CardDescription>
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
              <CardHeader>
                <CardTitle>Product Management</CardTitle>
                <CardDescription>Manage your product catalog and inventory</CardDescription>
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
                            <ProductEditModal product={product} onSave={updateProduct} />
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => updateProduct(product.id, { is_active: !product.is_active })}
                              className={product.is_active ? "text-red-600" : "text-green-600"}
                            >
                              {product.is_active ? 'Deactivate' : 'Activate'}
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Orders</TableHead>
                      <TableHead>Total Spent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from(new Map(orders.map(order => [order.customer_email, order])).values()).map((order) => {
                      const customerOrders = orders.filter(o => o.customer_email === order.customer_email);
                      const totalSpent = customerOrders.reduce((sum, o) => sum + o.total_amount, 0);
                      
                      return (
                        <TableRow key={order.customer_email}>
                          <TableCell className="font-medium">{order.customer_name}</TableCell>
                          <TableCell>{order.customer_email}</TableCell>
                          <TableCell>{order.customer_phone}</TableCell>
                          <TableCell>{customerOrders.length}</TableCell>
                          <TableCell>${totalSpent.toFixed(2)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
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
                    <Label htmlFor="logo_url" className="text-sm font-medium">Logo URL</Label>
                    <Input
                      id="logo_url"
                      value={editableSettings.logo_url || ''}
                      onChange={(e) => setEditableSettings(prev => ({ ...prev, logo_url: e.target.value }))}
                      placeholder="https://example.com/logo.png"
                    />
                  </div>

                  {/* Hero Image URL */}
                  <div>
                    <Label htmlFor="hero_image" className="text-sm font-medium">Hero Image URL</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        id="hero_image"
                        value={editableSettings.hero_image || ''}
                        onChange={(e) => setEditableSettings(prev => ({ ...prev, hero_image: e.target.value }))}
                        placeholder="https://example.com/hero.jpg"
                      />
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'hero')}
                        className="w-24"
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
    </div>
  );
}