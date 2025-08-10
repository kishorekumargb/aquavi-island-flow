import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MapPin, Phone, Mail, Calendar, CreditCard, Package, Truck, CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";

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

interface OrderDetailsModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (orderId: string, status: string) => void;
  isUpdating: boolean;
}

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

export function OrderDetailsModal({ 
  order, 
  isOpen, 
  onClose, 
  onUpdateStatus, 
  isUpdating 
}: OrderDetailsModalProps) {
  if (!order) return null;

  const handleMarkAsDelivered = () => {
    onUpdateStatus(order.id, 'delivered');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Order Details - {order.order_number}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status */}
          <div className="flex items-center gap-2">
            {getStatusIcon(order.status)}
            <Badge className={`${getStatusColor(order.status)} capitalize`}>
              {order.status}
            </Badge>
          </div>

          {/* Customer Information */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Name:</span>
                  <span>{order.customer_name}</span>
                </div>
                {order.customer_email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{order.customer_email}</span>
                  </div>
                )}
                {order.customer_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{order.customer_phone}</span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    {new Date(order.created_at).toLocaleDateString()} at{' '}
                    {new Date(order.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm capitalize">{order.payment_method}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm capitalize">{order.delivery_type}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          {order.delivery_address && (
            <div className="space-y-2">
              <h3 className="font-semibold">Delivery Address</h3>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
                <span className="text-sm">{order.delivery_address}</span>
              </div>
            </div>
          )}

          <Separator />

          {/* Order Items */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Order Items</h3>
            <div className="space-y-2">
              {order.items.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex-1">
                    <span className="font-medium">{item.name}</span>
                    <div className="text-sm text-muted-foreground">
                      ${item.price.toFixed(2)} each
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="text-sm text-muted-foreground">Qty:</span>
                    <div className="font-medium">{item.quantity}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Total */}
          <div className="flex justify-between items-center text-lg font-semibold">
            <span>Total Amount:</span>
            <span>${order.total_amount.toFixed(2)}</span>
          </div>

          {/* Actions */}
          {order.status !== 'delivered' && order.status !== 'cancelled' && (
            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleMarkAsDelivered}
                disabled={isUpdating}
                className="flex-1"
              >
                {isUpdating ? 'Updating...' : 'Mark as Delivered'}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}