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
import { LogOut, Package, Users, Settings, Upload, Eye, Edit, Plus, Trash2 } from 'lucide-react';
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
  const [siteSettings, setSiteSettings] = useState<SiteSetting[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ordersRes, productsRes, settingsRes] = await Promise.all([
        supabase.from('orders').select('*').order('created_at', { ascending: false }),
        supabase.from('products').select('*').order('name'),
        supabase.from('site_settings').select('*')
      ]);

      if (ordersRes.data) setOrders(ordersRes.data as Order[]);
      if (productsRes.data) setProducts(productsRes.data as Product[]);
      if (settingsRes.data) setSiteSettings(settingsRes.data as SiteSetting[]);
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

  const updateSiteSetting = async (key: string, value: string) => {
    try {
      const { error } = await supabase
        .from('site_settings')
        .upsert({ setting_key: key, setting_value: value }, { onConflict: 'setting_key' });

      if (error) throw error;

      setSiteSettings(prev => {
        const existing = prev.find(s => s.setting_key === key);
        if (existing) {
          return prev.map(s => s.setting_key === key ? { ...s, setting_value: value } : s);
        } else {
          return [...prev, { id: Date.now().toString(), setting_key: key, setting_value: value }];
        }
      });
      
      toast({
        title: "Settings Updated",
        description: "Site settings have been updated successfully",
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        title: "Error",
        description: "Failed to update settings",
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
        await updateSiteSetting('hero_image_url', imageUrl);
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

  const getSetting = (key: string) => {
    return siteSettings.find(s => s.setting_key === key)?.setting_value || '';
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Hero Image</CardTitle>
                  <CardDescription>Update the main hero image on the homepage</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Current Hero Image</Label>
                    {getSetting('hero_image_url') && (
                      <div className="mt-2">
                        <img src={getSetting('hero_image_url')} alt="Hero" className="w-full max-w-md rounded-lg" />
                      </div>
                    )}
                  </div>
                  <div>
                    <Label>Upload New Hero Image</Label>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'hero')}
                      className="mt-2"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Site Settings</CardTitle>
                  <CardDescription>Configure general site settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Business Phone</Label>
                    <Input 
                      value={getSetting('business_phone')} 
                      onChange={(e) => setSiteSettings(prev => {
                        const existing = prev.find(s => s.setting_key === 'business_phone');
                        if (existing) {
                          return prev.map(s => s.setting_key === 'business_phone' ? { ...s, setting_value: e.target.value } : s);
                        } else {
                          return [...prev, { id: Date.now().toString(), setting_key: 'business_phone', setting_value: e.target.value }];
                        }
                      })}
                    />
                  </div>
                  <div>
                    <Label>Business Address</Label>
                    <Input 
                      value={getSetting('business_address')} 
                      onChange={(e) => setSiteSettings(prev => {
                        const existing = prev.find(s => s.setting_key === 'business_address');
                        if (existing) {
                          return prev.map(s => s.setting_key === 'business_address' ? { ...s, setting_value: e.target.value } : s);
                        } else {
                          return [...prev, { id: Date.now().toString(), setting_key: 'business_address', setting_value: e.target.value }];
                        }
                      })}
                    />
                  </div>
                  <div>
                    <Label>Delivery Hours</Label>
                    <Input 
                      value={getSetting('delivery_hours')} 
                      onChange={(e) => setSiteSettings(prev => {
                        const existing = prev.find(s => s.setting_key === 'delivery_hours');
                        if (existing) {
                          return prev.map(s => s.setting_key === 'delivery_hours' ? { ...s, setting_value: e.target.value } : s);
                        } else {
                          return [...prev, { id: Date.now().toString(), setting_key: 'delivery_hours', setting_value: e.target.value }];
                        }
                      })}
                    />
                  </div>
                  <Button 
                    onClick={() => {
                      const phoneValue = getSetting('business_phone');
                      const addressValue = getSetting('business_address');
                      const hoursValue = getSetting('delivery_hours');
                      
                      Promise.all([
                        phoneValue && updateSiteSetting('business_phone', phoneValue),
                        addressValue && updateSiteSetting('business_address', addressValue),
                        hoursValue && updateSiteSetting('delivery_hours', hoursValue)
                      ]).then(() => {
                        toast({
                          title: "Settings Saved",
                          description: "All site settings have been updated successfully",
                        });
                      });
                    }}
                    className="w-full mt-4"
                  >
                    Save Settings
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}