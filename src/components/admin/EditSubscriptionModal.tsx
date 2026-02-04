import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Minus, Plus, Save } from 'lucide-react';

interface SubscriptionItem {
  name: string;
  price: number;
  quantity: number;
}

interface Subscription {
  id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  delivery_address: string | null;
  delivery_type: string;
  frequency: string;
  preferred_day: string;
  week_of_month: number | null;
  items: SubscriptionItem[];
  total_amount: number;
  status: string;
  next_delivery_date: string;
  start_date: string;
  payment_method: string | null;
}

interface Product {
  id: string;
  name: string;
  price: number;
  is_active: boolean;
}

interface EditSubscriptionModalProps {
  subscription: Subscription | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const weekdayOptions = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
];

const weekOfMonthOptions = [
  { value: '1', label: '1st week' },
  { value: '2', label: '2nd week' },
  { value: '3', label: '3rd week' },
  { value: '4', label: '4th week' },
];

const paymentOptions = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
];

export function EditSubscriptionModal({
  subscription,
  open,
  onOpenChange,
  onSuccess,
}: EditSubscriptionModalProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Form state
  const [deliveryType, setDeliveryType] = useState('delivery');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [frequency, setFrequency] = useState('biweekly');
  const [preferredDay, setPreferredDay] = useState('monday');
  const [weekOfMonth, setWeekOfMonth] = useState('1');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Load products
  useEffect(() => {
    if (open) {
      fetchProducts();
    }
  }, [open]);

  // Initialize form when subscription changes
  useEffect(() => {
    if (subscription && products.length > 0) {
      setDeliveryType(subscription.delivery_type || 'delivery');
      setDeliveryAddress(subscription.delivery_address || '');
      setFrequency(subscription.frequency || 'biweekly');
      setPreferredDay(subscription.preferred_day || 'monday');
      setWeekOfMonth(subscription.week_of_month?.toString() || '1');
      setPaymentMethod(subscription.payment_method || 'cash');

      // Map subscription items to product quantities
      const newQuantities: Record<string, number> = {};
      subscription.items.forEach((item) => {
        // Find matching product by name
        const product = products.find((p) => p.name === item.name);
        if (product) {
          newQuantities[product.id] = item.quantity;
        }
      });
      setQuantities(newQuantities);
    }
  }, [subscription, products]);

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, is_active')
        .eq('is_active', true)
        .order('price');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleQuantityChange = (productId: string, delta: number) => {
    setQuantities((prev) => {
      const current = prev[productId] || 0;
      const newValue = Math.max(0, current + delta);
      return { ...prev, [productId]: newValue };
    });
  };

  const calculateTotal = () => {
    return Object.entries(quantities).reduce((total, [productId, quantity]) => {
      const product = products.find((p) => p.id === productId);
      return total + (product ? product.price * quantity : 0);
    }, 0);
  };

  const getSelectedItems = (): SubscriptionItem[] => {
    return Object.entries(quantities)
      .filter(([_, quantity]) => quantity > 0)
      .map(([productId, quantity]) => {
        const product = products.find((p) => p.id === productId);
        return {
          name: product?.name || '',
          price: product?.price || 0,
          quantity,
        };
      });
  };

  const handleSave = async () => {
    if (!subscription) return;

    const selectedItems = getSelectedItems();
    if (selectedItems.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one product',
        variant: 'destructive',
      });
      return;
    }

    if (deliveryType === 'delivery' && !deliveryAddress.trim()) {
      toast({
        title: 'Error',
        description: 'Delivery address is required for delivery subscriptions',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);

      const totalAmount = calculateTotal();
      
      // Calculate new next_delivery_date if frequency or schedule changed
      let newNextDeliveryDate = subscription.next_delivery_date;
      
      if (
        frequency !== subscription.frequency ||
        preferredDay !== subscription.preferred_day ||
        (frequency === 'monthly' && parseInt(weekOfMonth) !== subscription.week_of_month)
      ) {
        // Call the database function to calculate new delivery date
        const { data: dateData, error: dateError } = await supabase.rpc(
          'calculate_next_delivery_date',
          {
            p_current_date: new Date().toISOString().split('T')[0],
            p_frequency: frequency,
            p_preferred_day: preferredDay,
            p_week_of_month: frequency === 'monthly' ? parseInt(weekOfMonth) : 1,
          }
        );

        if (dateError) {
          console.error('Error calculating next delivery date:', dateError);
        } else if (dateData) {
          newNextDeliveryDate = dateData;
        }
      }

      // Cast items to Json-compatible type for Supabase
      const itemsAsJson = selectedItems.map(item => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      }));

      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          delivery_type: deliveryType,
          delivery_address: deliveryType === 'delivery' ? deliveryAddress : null,
          frequency,
          preferred_day: preferredDay,
          week_of_month: frequency === 'monthly' ? parseInt(weekOfMonth) : null,
          payment_method: paymentMethod,
          items: itemsAsJson,
          total_amount: totalAmount,
          next_delivery_date: newNextDeliveryDate,
          updated_at: new Date().toISOString(),
        })
        .eq('id', subscription.id);

      if (updateError) throw updateError;

      toast({
        title: 'Success',
        description: 'Subscription updated successfully',
      });

      // Send modification notification if customer has email
      if (subscription.customer_email) {
        try {
          await supabase.functions.invoke('send-subscription-notification', {
            body: {
              eventType: 'modified',
              subscriptionId: subscription.id,
              customerName: subscription.customer_name,
              customerEmail: subscription.customer_email,
              frequency,
              subscriptionSummary: getScheduleSummary(),
              nextDeliveryDate: newNextDeliveryDate,
              items: selectedItems,
              totalAmount,
              deliveryType,
            },
          });
        } catch (notifyError) {
          console.error('Failed to send modification notification:', notifyError);
          // Don't fail the whole operation if notification fails
        }
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast({
        title: 'Error',
        description: 'Failed to update subscription',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getScheduleSummary = () => {
    const dayLabel =
      weekdayOptions.find((d) => d.value === preferredDay)?.label || preferredDay;
    if (frequency === 'monthly') {
      const weekLabel =
        weekOfMonthOptions.find((w) => w.value === weekOfMonth)?.label || weekOfMonth;
      return `Monthly on the ${weekLabel} ${dayLabel}`;
    }
    return `Bi-weekly on ${dayLabel}`;
  };

  if (!subscription) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Subscription</DialogTitle>
          <DialogDescription>
            Modify subscription details for {subscription.customer_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Info (Read-only) */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Customer:</span>{' '}
                <span className="font-medium">{subscription.customer_name}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Phone:</span>{' '}
                <span className="font-medium">{subscription.customer_phone}</span>
              </div>
              {subscription.customer_email && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Email:</span>{' '}
                  <span className="font-medium">{subscription.customer_email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Type */}
          <div className="space-y-2">
            <Label>Delivery Type</Label>
            <Select value={deliveryType} onValueChange={setDeliveryType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="delivery">Delivery</SelectItem>
                <SelectItem value="pickup">Pickup</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Delivery Address (only for delivery) */}
          {deliveryType === 'delivery' && (
            <div className="space-y-2">
              <Label>Delivery Address</Label>
              <Textarea
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Enter delivery address"
                rows={2}
              />
            </div>
          )}

          {/* Frequency */}
          <div className="space-y-2">
            <Label>Frequency</Label>
            <RadioGroup
              value={frequency}
              onValueChange={setFrequency}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="biweekly" id="biweekly" />
                <Label htmlFor="biweekly" className="cursor-pointer">
                  Bi-weekly
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="monthly" id="monthly" />
                <Label htmlFor="monthly" className="cursor-pointer">
                  Monthly
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Preferred Day */}
          <div className="space-y-2">
            <Label>Preferred Day</Label>
            <Select value={preferredDay} onValueChange={setPreferredDay}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {weekdayOptions.map((day) => (
                  <SelectItem key={day.value} value={day.value}>
                    {day.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Week of Month (only for monthly) */}
          {frequency === 'monthly' && (
            <div className="space-y-2">
              <Label>Week of Month</Label>
              <Select value={weekOfMonth} onValueChange={setWeekOfMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {weekOfMonthOptions.map((week) => (
                    <SelectItem key={week.value} value={week.value}>
                      {week.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Products */}
          <div className="space-y-2">
            <Label>Products</Label>
            {loadingProducts ? (
              <p className="text-sm text-muted-foreground">Loading products...</p>
            ) : (
              <div className="space-y-2 border rounded-lg p-3">
                {products.map((product) => {
                  const quantity = quantities[product.id] || 0;
                  return (
                    <div
                      key={product.id}
                      className={`flex items-center justify-between p-2 rounded-md transition-colors ${
                        quantity > 0 ? 'bg-primary/5 border border-primary/20' : ''
                      }`}
                    >
                      <div>
                        <span className="font-medium">{product.name}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          ${product.price.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleQuantityChange(product.id, -1)}
                          disabled={quantity === 0}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-medium">{quantity}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleQuantityChange(product.id, 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="font-medium">Total per Delivery:</span>
              <span className="text-lg font-bold text-primary">
                ${calculateTotal().toFixed(2)}
              </span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paymentOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Schedule Summary */}
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
            <p className="text-sm text-primary">
              <strong>New Schedule:</strong> {getScheduleSummary()}
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
