import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Package, MapPin, Phone } from 'lucide-react';
import { useContactInfo } from '@/hooks/useContactInfo';

export function OrderConfirmation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { contactInfo } = useContactInfo();
  
  const orderData = {
    orderNumber: searchParams.get('orderNumber') || 'AQ1234567890',
    customerName: searchParams.get('customerName') || 'Customer',
    total: searchParams.get('total') || '0.00',
    items: searchParams.get('items') || 'Water Bottles',
    deliveryAddress: searchParams.get('deliveryAddress') || 'Road Town, Tortola',
    customerPhone: searchParams.get('customerPhone') || '1-499-4611'
  };

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-subtle py-12">
      <div className="container mx-auto px-6">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-elegant">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-3xl font-heading text-foreground">
                Order Confirmed!
              </CardTitle>
              <CardDescription className="text-lg">
                Thank you for your order. We'll have your fresh water delivered soon.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Order Details */}
              <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                <h3 className="font-heading font-semibold text-lg">Order Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Order Number</p>
                    <p className="font-semibold">{orderData.orderNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Customer</p>
                    <p className="font-semibold">{orderData.customerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Items</p>
                    <p className="font-semibold">{orderData.items}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="font-semibold text-primary">${orderData.total}</p>
                  </div>
                </div>
              </div>

              {/* Delivery Information */}
              <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                <h3 className="font-heading font-semibold text-lg">Delivery Information</h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Delivery Address</p>
                      <p className="font-medium">{orderData.deliveryAddress}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Phone className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Contact Number</p>
                      <p className="font-medium">{orderData.customerPhone}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Package className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Estimated Delivery</p>
                      <p className="font-medium">{contactInfo.deliveryHours}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                <h3 className="font-heading font-semibold text-lg">Payment</h3>
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                  <span className="font-medium">Cash on Delivery</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Please have exact change ready for our delivery team.
                </p>
              </div>

              {/* What's Next */}
              <div className="text-center space-y-4">
                <h3 className="font-heading font-semibold text-lg">What's Next?</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2 font-bold">1</div>
                    <p>Order Processing</p>
                  </div>
                  <div className="text-center">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2 font-bold">2</div>
                    <p>Out for Delivery</p>
                  </div>
                  <div className="text-center">
                    <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-2 font-bold">3</div>
                    <p>Delivered</p>
                  </div>
                </div>
              </div>

              {/* Contact Support */}
              <div className="text-center pt-6 border-t border-border">
                <p className="text-sm text-muted-foreground mb-4">
                  Questions about your order? Contact us at:
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-6">
                  <a href={`tel:${contactInfo.phone}`} className="flex items-center space-x-2 text-primary hover:underline">
                    <Phone className="w-4 h-4" />
                    <span>{contactInfo.phone}</span>
                  </a>
                  <a href={`https://wa.me/${contactInfo.phone.replace(/[^0-9]/g, '')}`} className="flex items-center space-x-2 text-primary hover:underline">
                    <span>📱</span>
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-6">
                <Button onClick={() => navigate('/')} className="flex-1">
                  Continue Shopping
                </Button>
                <Button variant="outline" onClick={() => window.print()} className="flex-1">
                  Print Order
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}