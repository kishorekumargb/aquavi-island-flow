import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, MapPin, Clock, Phone } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface OrderDetails {
  orderNumber: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  deliveryAddress: string;
  deliveryDate: string;
  deliveryTime: string;
  paymentMethod: string;
}

export function OrderConfirmation() {
  const navigate = useNavigate();
  const location = useLocation();
  const orderDetails = location.state?.orderDetails as OrderDetails;

  if (!orderDetails) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-4">No order details found.</p>
            <Button onClick={() => navigate('/')}>Return Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-6 max-w-2xl">
        <Card className="shadow-elegant">
          <CardHeader className="text-center pb-6">
            <div className="w-16 h-16 bg-gradient-hero rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl font-heading text-primary">Order Confirmed!</CardTitle>
            <p className="text-muted-foreground">Thank you for choosing Aqua VI Water</p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Order Number */}
            <div className="text-center pb-4 border-b border-border">
              <p className="text-sm text-muted-foreground">Order Number</p>
              <p className="text-lg font-semibold text-primary">{orderDetails.orderNumber}</p>
            </div>

            {/* Order Items */}
            <div>
              <h3 className="font-semibold mb-3">Order Summary</h3>
              <div className="space-y-2">
                {orderDetails.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2">
                    <span>{item.name} x {item.quantity}</span>
                    <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t border-border pt-2 flex justify-between items-center font-semibold">
                  <span>Total</span>
                  <span className="text-primary">${orderDetails.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Delivery Details */}
            <div className="space-y-3">
              <h3 className="font-semibold">Delivery Information</h3>
              
              <div className="flex items-start space-x-3">
                <MapPin className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Delivery Address</p>
                  <p className="text-muted-foreground text-sm">{orderDetails.deliveryAddress}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Clock className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Delivery Time</p>
                  <p className="text-muted-foreground text-sm">
                    {orderDetails.deliveryDate} at {orderDetails.deliveryTime}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <h3 className="font-semibold mb-2">Payment Method</h3>
              <p className="text-muted-foreground">{orderDetails.paymentMethod}</p>
            </div>

            {/* Contact Information */}
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Need Help?</h3>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Phone className="w-4 h-4" />
                <span>Contact us: 1-499-4611</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button onClick={() => navigate('/')} className="flex-1">
                Continue Shopping
              </Button>
              <Button variant="outline" onClick={() => window.print()} className="flex-1">
                Print Receipt
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}