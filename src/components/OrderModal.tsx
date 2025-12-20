import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Clock, MapPin, Truck, Package, CreditCard } from 'lucide-react';

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

export function OrderModal({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('price');

      if (error) throw error;
      
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };
  const [orderData, setOrderData] = useState({
    deliveryType: 'delivery',
    frequency: 'once',
    address: '',
    date: '',
    time: '15:30',
    items: [],
    marketingConsent: false,
    autoRenew: false
  });

  const [quantities, setQuantities] = useState({});

  const handleQuantityChange = (productId: string, quantity: string) => {
    const product = products.find(p => p.id === productId);
    const stock = product?.stock ?? 0;
    
    // Don't allow any quantity for out-of-stock products
    if (stock <= 0) return;
    
    let parsedQuantity = parseInt(quantity) || 0;
    // Limit to available stock
    parsedQuantity = Math.min(parsedQuantity, stock);
    
    setQuantities(prev => ({
      ...prev,
      [productId]: parsedQuantity
    }));
  };
  
  const isOutOfStock = (product: Product) => {
    return (product.stock ?? 0) <= 0;
  };

  const calculateTotal = () => {
    return Object.entries(quantities).reduce((total, [productId, quantity]) => {
      const product = products.find(p => p.id === productId);
      return total + (product ? product.price * (quantity as number) : 0);
    }, 0);
  };

  const getOrderItems = () => {
    return Object.entries(quantities)
      .filter(([_, quantity]) => (quantity as number) > 0)
      .map(([productId, quantity]) => {
        const product = products.find(p => p.id === productId);
        return { product, quantity: quantity as number };
      });
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">Order Aqua VI Water</DialogTitle>
          <DialogDescription>
            Complete your order in a few simple steps for same-day delivery
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                currentStep >= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {step}
              </div>
              {step < 4 && (
                <div className={`h-1 w-16 ml-2 ${
                  currentStep > step ? 'bg-primary' : 'bg-muted'
                }`}></div>
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h3 className="text-xl font-heading font-semibold">Select Products</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {products.map((product) => {
                const outOfStock = isOutOfStock(product);
                const lowStock = (product.stock ?? 0) > 0 && (product.stock ?? 0) <= 5;
                
                return (
                  <Card key={product.id} className={`p-4 ${outOfStock ? 'opacity-60 bg-muted/50' : ''}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="font-semibold">{product.name}</div>
                        <div className="text-sm text-muted-foreground">{product.size}</div>
                        <div className="text-lg font-bold text-primary">${product.price}</div>
                        {outOfStock && (
                          <Badge variant="destructive" className="mt-1">Out of Stock</Badge>
                        )}
                        {lowStock && (
                          <Badge variant="secondary" className="mt-1">Only {product.stock} left</Badge>
                        )}
                      </div>
                      <div className="w-20">
                        <Input
                          type="number"
                          min="0"
                          max={product.stock ?? 0}
                          placeholder="0"
                          value={quantities[product.id] || ''}
                          onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                          disabled={outOfStock}
                          className={outOfStock ? 'cursor-not-allowed' : ''}
                        />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
            
            {getOrderItems().length > 0 && (
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg">Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  {getOrderItems().map(({ product, quantity }) => (
                    <div key={product?.id} className="flex justify-between items-center py-2">
                      <span>{product?.name} × {quantity}</span>
                      <span className="font-semibold">${((product?.price || 0) * quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <Separator className="my-3" />
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">${calculateTotal().toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <h3 className="text-xl font-heading font-semibold">Customer & Delivery Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-base font-medium">Full Name *</Label>
                <Input
                  placeholder="Enter your full name"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-2"
                  required
                />
              </div>
              <div>
                <Label className="text-base font-medium">Phone *</Label>
                <Input
                  type="tel"
                  placeholder="Enter your phone"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                  className="mt-2"
                  required
                />
              </div>
              <div>
                <Label className="text-base font-medium">Email</Label>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                  className="mt-2"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-base font-medium">Delivery Type</Label>
                <Select value={orderData.deliveryType} onValueChange={(value) => 
                  setOrderData(prev => ({ ...prev, deliveryType: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="delivery">
                      <div className="flex items-center space-x-2">
                        <Truck className="w-4 h-4" />
                        <span>Delivery</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="pickup">
                      <div className="flex items-center space-x-2">
                        <Package className="w-4 h-4" />
                        <span>Pickup</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-base font-medium">Frequency</Label>
                <Select value={orderData.frequency} onValueChange={(value) =>
                  setOrderData(prev => ({ ...prev, frequency: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">One-time Order</SelectItem>
                    <SelectItem value="twice">Twice per Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {orderData.deliveryType === 'delivery' && (
              <div>
                <Label className="text-base font-medium">Delivery Address *</Label>
                <Input
                  placeholder="Enter your full address in BVI"
                  value={orderData.address}
                  onChange={(e) => setOrderData(prev => ({ ...prev, address: e.target.value }))}
                  className="mt-2"
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  We'll use Google Places to verify and optimize your address
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-base font-medium">Preferred Date *</Label>
                <Input
                  type="date"
                  value={orderData.date}
                  onChange={(e) => setOrderData(prev => ({ ...prev, date: e.target.value }))}
                  className="mt-2"
                  required
                />
              </div>

              <div>
                <Label className="text-base font-medium">Preferred Time</Label>
                <Select value={orderData.time} onValueChange={(value) =>
                  setOrderData(prev => ({ ...prev, time: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15:30">3:30 PM - 5:30 PM</SelectItem>
                    <SelectItem value="morning">Morning (9:00 AM - 12:00 PM)</SelectItem>
                    <SelectItem value="evening">Evening (5:30 PM - 7:00 PM)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <h3 className="text-xl font-heading font-semibold">Payment Method</h3>
            
            <div className="space-y-4">
              <Card className="p-4 border-2 border-primary">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-primary rounded-full"></div>
                  <div>
                    <div className="font-semibold text-primary">Pay by Cash on Delivery</div>
                    <div className="text-sm text-muted-foreground">Pay when your order arrives</div>
                  </div>
                </div>
              </Card>

              <Card className="p-4 border border-muted bg-muted/30">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-muted rounded-full"></div>
                  <div>
                    <div className="font-semibold text-muted-foreground">Pay by Card</div>
                    <div className="text-sm text-muted-foreground">Coming Soon</div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6">
            <h3 className="text-xl font-heading font-semibold">Review & Payment</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Package className="w-5 h-5" />
                    <span>Order Summary</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {getOrderItems().map(({ product, quantity }) => (
                    <div key={product?.id} className="flex justify-between">
                      <span>{product?.name} × {quantity}</span>
                      <span>${((product?.price || 0) * quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>${calculateTotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery</span>
                      <span>Free</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-primary">${calculateTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MapPin className="w-5 h-5" />
                    <span>Delivery Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="font-medium">Type</div>
                    <div className="text-muted-foreground capitalize">{orderData.deliveryType}</div>
                  </div>
                  <div>
                    <div className="font-medium">Frequency</div>
                    <div className="text-muted-foreground">
                      {orderData.frequency === 'once' ? 'One-time order' : 'Twice per month'}
                    </div>
                  </div>
                  {orderData.address && (
                    <div>
                      <div className="font-medium">Address</div>
                      <div className="text-muted-foreground">{orderData.address}</div>
                    </div>
                  )}
                  <div>
                    <div className="font-medium">Scheduled</div>
                    <div className="text-muted-foreground">{orderData.date} at {orderData.time}</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Button 
              variant="hero" 
              size="lg" 
              className="w-full"
              disabled={isSubmitting}
              onClick={async () => {
                // Validation
                if (!customerInfo.name.trim()) {
                  toast({
                    title: "Missing Information",
                    description: "Please enter your full name",
                    variant: "destructive",
                  });
                  return;
                }

                if (!customerInfo.phone.trim()) {
                  toast({
                    title: "Missing Information", 
                    description: "Please enter your phone number",
                    variant: "destructive",
                  });
                  return;
                }

                if (orderData.deliveryType === 'delivery' && !orderData.address.trim()) {
                  toast({
                    title: "Missing Information",
                    description: "Please enter your delivery address",
                    variant: "destructive",
                  });
                  return;
                }

                if (!orderData.date.trim()) {
                  toast({
                    title: "Missing Information",
                    description: "Please select a preferred date",
                    variant: "destructive",
                  });
                  return;
                }
                
                setIsSubmitting(true);
                
                try {
                  // Use server-side validated order creation
                  const orderItems = getOrderItems().map(item => ({
                    product_id: item.product?.id,
                    quantity: item.quantity
                  }));
                  
                  const { data: rpcResult, error } = await supabase.rpc('create_validated_order', {
                    p_customer_name: customerInfo.name,
                    p_customer_email: customerInfo.email || null,
                    p_customer_phone: customerInfo.phone,
                    p_delivery_address: orderData.address || '',
                    p_delivery_type: orderData.deliveryType,
                    p_items: orderItems,
                    p_payment_method: 'cash'
                  });
                  
                  if (error) {
                    // Handle specific validation errors
                    if (error.message.includes('not being accepted')) {
                      toast({
                        title: "Orders Currently Unavailable",
                        description: "We're temporarily not accepting new orders. Please try again later.",
                        variant: "destructive",
                      });
                    } else {
                      throw error;
                    }
                    setIsSubmitting(false);
                    return;
                  }
                  
                  // Cast result to expected shape
                  const orderResult = rpcResult as {
                    success: boolean;
                    order_id: string;
                    order_number: string;
                    total_amount: number;
                    items: Array<{ name: string; price: number; quantity: number }>;
                  };
                  
                  console.log('Order created successfully:', orderResult);
                  
                  // Send email notifications
                  try {
                    const emailData = {
                      orderNumber: orderResult.order_number,
                      customerName: customerInfo.name,
                      customerEmail: customerInfo.email,
                      customerPhone: customerInfo.phone,
                      deliveryAddress: orderData.address,
                      items: orderResult.items.map((item) => ({
                        id: '',
                        name: item.name,
                        size: '1L',
                        price: item.price,
                        quantity: item.quantity
                      })),
                      totalAmount: orderResult.total_amount,
                      paymentMethod: 'cash',
                      deliveryType: orderData.deliveryType
                    };
                    
                    await supabase.functions.invoke('send-order-confirmation', {
                      body: emailData
                    });
                    
                    console.log('Order confirmation emails sent successfully');
                  } catch (emailError) {
                    console.error('Failed to send confirmation emails:', emailError);
                    // Don't block order completion if email fails
                  }
                  
                  // Navigate to order confirmation page
                  const orderParams = new URLSearchParams({
                    orderNumber: orderResult.order_number,
                    customerName: customerInfo.name,
                    total: orderResult.total_amount.toString(),
                    items: orderResult.items.map((item) => `${item.name} x${item.quantity}`).join(', '),
                    deliveryAddress: orderData.address || '',
                    customerPhone: customerInfo.phone || ''
                  });
                  
                  navigate(`/order-confirmation?${orderParams.toString()}`);
                  
                  // Reset form and close modal
                  setCurrentStep(1);
                  setQuantities({});
                  setCustomerInfo({ name: '', email: '', phone: '' });
                  setOrderData({
                    deliveryType: 'delivery',
                    frequency: 'once',
                    address: '',
                    date: '',
                    time: '15:30',
                    items: [],
                    marketingConsent: false,
                    autoRenew: false
                  });
                  
                } catch (error: any) {
                  console.error('Error placing order:', error);
                  toast({
                    title: "Error",
                    description: error.message || "Failed to place order. Please try again.",
                    variant: "destructive",
                  });
                } finally {
                  setIsSubmitting(false);
                }
              }}
            >
              {isSubmitting ? 'Placing Order...' : 'Confirm Order (Cash on Delivery)'}
            </Button>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6 border-t border-border">
          <Button 
            variant="outline" 
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            Previous
          </Button>
          {currentStep < 4 && (
            <Button 
              variant="premium" 
              onClick={nextStep}
              disabled={
                (currentStep === 1 && getOrderItems().length === 0) ||
                (currentStep === 2 && !customerInfo.name.trim())
              }
            >
              Next Step
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}