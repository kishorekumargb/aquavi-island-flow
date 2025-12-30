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
  description: string | null;
  image_url: string | null;
  stock: number | null;
  is_active: boolean;
}

export function OrderModal({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [ordersEnabled, setOrdersEnabled] = useState<boolean | null>(null);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    fetchProducts();
    checkOrdersEnabled();
  }, []);

  const checkOrdersEnabled = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('setting_value')
        .eq('setting_key', 'receive_orders')
        .single();
      
      if (error) {
        console.error('Error checking orders status:', error);
        setOrdersEnabled(true); // Default to enabled if error
        return;
      }
      
      setOrdersEnabled(data?.setting_value === 'true');
    } catch (error) {
      console.error('Error checking orders status:', error);
      setOrdersEnabled(true);
    }
  };

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
    time: '11:00-14:30',
    items: [],
    marketingConsent: false,
    autoRenew: false
  });

  const [quantities, setQuantities] = useState({});

  const handleQuantityChange = (productId: string, quantity: string) => {
    const product = products.find(p => p.id === productId);
    const stock = product?.stock;
    
    // If stock is null/undefined, treat as unlimited
    // If stock is 0, it's out of stock
    if (stock !== null && stock !== undefined && stock <= 0) return;
    
    let parsedQuantity = parseInt(quantity) || 0;
    
    // Only limit if stock is set (not null/undefined)
    if (stock !== null && stock !== undefined) {
      parsedQuantity = Math.min(parsedQuantity, stock);
    }
    
    setQuantities(prev => ({
      ...prev,
      [productId]: parsedQuantity
    }));
  };
  
  // Out of stock only when stock is explicitly 0
  const isOutOfStock = (product: Product) => {
    return product.stock !== null && product.stock !== undefined && product.stock <= 0;
  };
  
  // Check if stock is limited (has a number set)
  const hasLimitedStock = (product: Product) => {
    return product.stock !== null && product.stock !== undefined;
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
      <DialogContent className="max-w-2xl h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0 pb-2">
          <DialogTitle className="font-heading text-xl">Order Aqua VI Water</DialogTitle>
          <DialogDescription className="text-sm">
            Complete your order in a few simple steps
          </DialogDescription>
        </DialogHeader>

        {/* Orders Disabled Message */}
        {ordersEnabled === false && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center">
            <h3 className="text-base font-heading font-semibold text-destructive mb-1">
              Orders Currently Unavailable
            </h3>
            <p className="text-sm text-muted-foreground">
              We're temporarily not accepting new orders.
            </p>
          </div>
        )}

        {/* Loading state */}
        {ordersEnabled === null && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Main content - only show when orders are enabled */}
        {ordersEnabled === true && (
          <div className="flex flex-col flex-1 min-h-0">
            {/* Progress Indicator - Compact */}
            <div className="flex items-center justify-center gap-2 pb-3 flex-shrink-0">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                    currentStep >= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    {step}
                  </div>
                  {step < 4 && (
                    <div className={`h-0.5 w-8 ml-1 ${
                      currentStep > step ? 'bg-primary' : 'bg-muted'
                    }`}></div>
                  )}
                </div>
              ))}
            </div>

            {/* Step Content - Scrollable area */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              {currentStep === 1 && (
                <div className="space-y-3 pr-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-heading font-semibold">Select Products</h3>
                    {getOrderItems().length > 0 && (
                      <div className="text-sm font-semibold text-primary">
                        Total: ${calculateTotal().toFixed(2)}
                      </div>
                    )}
                  </div>
                  
                  {/* Compact List View */}
                  <div className="space-y-2">
                    {products.map((product) => {
                      const outOfStock = isOutOfStock(product);
                      const limited = hasLimitedStock(product);
                      const lowStock = limited && product.stock! > 0 && product.stock! <= 5;
                      const quantity = quantities[product.id] || 0;
                      
                      return (
                        <div 
                          key={product.id} 
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                            quantity > 0 
                              ? 'border-primary bg-primary/5' 
                              : outOfStock 
                                ? 'opacity-50 bg-muted/30 border-muted' 
                                : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm truncate">{product.name}</span>
                              {outOfStock && (
                                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Out</Badge>
                              )}
                              {lowStock && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{product.stock} left</Badge>
                              )}
                              {!outOfStock && !lowStock && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">In Stock</Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">{product.size}</div>
                          </div>
                          <div className="text-sm font-bold text-primary whitespace-nowrap">
                            ${product.price.toFixed(2)}
                          </div>
                          <div className="w-16 flex-shrink-0">
                            <Input
                              type="number"
                              min="0"
                              max={limited ? product.stock! : 999}
                              placeholder="0"
                              value={quantities[product.id] || ''}
                              onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                              disabled={outOfStock}
                              className={`h-8 text-center text-sm ${outOfStock ? 'cursor-not-allowed' : ''}`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Compact Order Summary */}
                  {getOrderItems().length > 0 && (
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mt-3">
                      <div className="text-xs font-medium text-muted-foreground mb-2">Selected Items:</div>
                      <div className="space-y-1">
                        {getOrderItems().map(({ product, quantity }) => (
                          <div key={product?.id} className="flex justify-between items-center text-sm">
                            <span className="truncate">{product?.name} × {quantity}</span>
                            <span className="font-medium">${((product?.price || 0) * quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4 pr-2">
                  <h3 className="text-base font-heading font-semibold">Customer & Delivery Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-sm font-medium">Full Name *</Label>
                      <Input
                        placeholder="Enter your full name"
                        value={customerInfo.name}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                        className="mt-1 h-9"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Phone *</Label>
                      <Input
                        type="tel"
                        placeholder="Enter your phone"
                        value={customerInfo.phone}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                        className="mt-1 h-9"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Email</Label>
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        value={customerInfo.email}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                        className="mt-1 h-9"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm font-medium">Delivery Type</Label>
                      <Select value={orderData.deliveryType} onValueChange={(value) => 
                        setOrderData(prev => ({ 
                          ...prev, 
                          deliveryType: value,
                          time: value === 'delivery' ? '11:00-14:30' : '09:00-18:30'
                        }))}>
                        <SelectTrigger className="mt-1 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="delivery">
                            <div className="flex items-center space-x-2">
                              <Truck className="w-3 h-3" />
                              <span>Delivery</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="pickup">
                            <div className="flex items-center space-x-2">
                              <Package className="w-3 h-3" />
                              <span>Pickup</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Frequency</Label>
                      <Select value={orderData.frequency} onValueChange={(value) =>
                        setOrderData(prev => ({ ...prev, frequency: value }))}>
                        <SelectTrigger className="mt-1 h-9">
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
                      <Label className="text-sm font-medium">Delivery Address *</Label>
                      <Input
                        placeholder="Enter your full address in BVI"
                        value={orderData.address}
                        onChange={(e) => setOrderData(prev => ({ ...prev, address: e.target.value }))}
                        className="mt-1 h-9"
                        required
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm font-medium">Preferred Date *</Label>
                      <Input
                        type="date"
                        value={orderData.date}
                        onChange={(e) => setOrderData(prev => ({ ...prev, date: e.target.value }))}
                        className="mt-1 h-9"
                        required
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Preferred Time</Label>
                      <Select value={orderData.time} onValueChange={(value) =>
                        setOrderData(prev => ({ ...prev, time: value }))}>
                        <SelectTrigger className="mt-1 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {orderData.deliveryType === 'delivery' ? (
                            <SelectItem value="11:00-14:30">11:00 AM - 2:30 PM</SelectItem>
                          ) : (
                            <SelectItem value="09:00-18:30">9:00 AM - 6:30 PM</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4 pr-2">
                  <h3 className="text-base font-heading font-semibold">Payment Method</h3>
                  
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg border-2 border-primary">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-primary rounded-full"></div>
                        <div>
                          <div className="font-semibold text-sm text-primary">Pay by Cash on Delivery</div>
                          <div className="text-xs text-muted-foreground">Pay when your order arrives</div>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg border border-muted bg-muted/30">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-muted rounded-full"></div>
                        <div>
                          <div className="font-semibold text-sm text-muted-foreground">Pay by Card</div>
                          <div className="text-xs text-muted-foreground">Coming Soon</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-4 pr-2">
                  <h3 className="text-base font-heading font-semibold">Review & Confirm</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Order Summary */}
                    <div className="border rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-3">
                        <Package className="w-4 h-4" />
                        <span className="font-medium text-sm">Order Summary</span>
                      </div>
                      <div className="space-y-2">
                        {getOrderItems().map(({ product, quantity }) => (
                          <div key={product?.id} className="flex justify-between text-sm">
                            <span className="truncate">{product?.name} × {quantity}</span>
                            <span>${((product?.price || 0) * quantity).toFixed(2)}</span>
                          </div>
                        ))}
                        <Separator className="my-2" />
                        <div className="flex justify-between text-sm">
                          <span>Subtotal</span>
                          <span>${calculateTotal().toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Delivery</span>
                          <span>Free</span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between font-bold">
                          <span>Total</span>
                          <span className="text-primary">${calculateTotal().toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Delivery Info */}
                    <div className="border rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-3">
                        <MapPin className="w-4 h-4" />
                        <span className="font-medium text-sm">Delivery Info</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Type</span>
                          <span className="capitalize">{orderData.deliveryType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Frequency</span>
                          <span>{orderData.frequency === 'once' ? 'One-time' : 'Twice/month'}</span>
                        </div>
                        {orderData.address && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Address</span>
                            <span className="text-right max-w-[150px] truncate">{orderData.address}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Date</span>
                          <span>{orderData.date}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button 
                    variant="hero" 
                    size="default" 
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
            </div>

            {/* Navigation Buttons - Fixed at bottom */}
            <div className="flex justify-between pt-3 border-t border-border flex-shrink-0">
              <Button 
                variant="outline" 
                size="sm"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                Previous
              </Button>
              {currentStep < 4 && (
                <Button 
                  variant="premium" 
                  size="sm"
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
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}