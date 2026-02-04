import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, differenceInDays, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  RefreshCw,
  Eye,
  Pause,
  Play,
  XCircle,
  CheckCircle,
  Clock,
  AlertCircle,
  CalendarClock,
  Package,
  Pencil,
} from 'lucide-react';
import { EditSubscriptionModal } from './EditSubscriptionModal';

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
  items: Array<{ name: string; price: number; quantity: number }>;
  total_amount: number;
  status: string;
  next_delivery_date: string;
  start_date: string;
  payment_method: string | null;
  created_at: string;
  updated_at: string;
}

interface SubscriptionOrder {
  id: string;
  order_number: string;
  total_amount: number;
  status: string;
  created_at: string;
}

export function SubscriptionsTab() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [generatingOrder, setGeneratingOrder] = useState(false);
  const [subscriptionOrders, setSubscriptionOrders] = useState<SubscriptionOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  // Fetch orders when subscription details modal opens
  useEffect(() => {
    if (showDetails && selectedSubscription) {
      fetchSubscriptionOrders(selectedSubscription.id);
    }
  }, [showDetails, selectedSubscription]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubscriptions((data || []).map(sub => ({
        ...sub,
        items: Array.isArray(sub.items) ? sub.items : []
      })) as unknown as Subscription[]);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast({
        title: "Error",
        description: "Failed to load subscriptions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptionOrders = async (subscriptionId: string) => {
    try {
      setLoadingOrders(true);
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, total_amount, status, created_at')
        .eq('subscription_id', subscriptionId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubscriptionOrders(data || []);
    } catch (error) {
      console.error('Error fetching subscription orders:', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const sendSubscriptionNotification = async (
    subscription: Subscription,
    eventType: 'paused' | 'resumed' | 'cancelled'
  ) => {
    if (!subscription.customer_email) {
      console.log('No customer email, skipping notification');
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('send-subscription-notification', {
        body: {
          eventType,
          subscriptionId: subscription.id,
          customerName: subscription.customer_name,
          customerEmail: subscription.customer_email,
          frequency: subscription.frequency,
          subscriptionSummary: `${getFrequencyLabel(subscription.frequency)} delivery on ${getDayLabel(subscription.preferred_day)}${subscription.frequency === 'monthly' && subscription.week_of_month ? ` (${getWeekLabel(subscription.week_of_month)} week)` : ''}`,
          nextDeliveryDate: subscription.next_delivery_date ? format(new Date(subscription.next_delivery_date), 'MMMM d, yyyy') : undefined,
          items: subscription.items,
          totalAmount: subscription.total_amount,
          deliveryType: subscription.delivery_type
        }
      });

      if (error) {
        console.error('Failed to send subscription notification:', error);
      } else {
        console.log(`Subscription ${eventType} notification sent successfully`);
      }
    } catch (error) {
      console.error('Failed to send subscription notification:', error);
    }
  };

  const updateSubscriptionStatus = async (subscriptionId: string, newStatus: string) => {
    const subscription = subscriptions.find(s => s.id === subscriptionId);
    
    try {
      setUpdatingStatus(true);
      const { error } = await supabase
        .from('subscriptions')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', subscriptionId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Subscription ${newStatus === 'cancelled' ? 'cancelled' : newStatus === 'paused' ? 'paused' : 'resumed'} successfully`,
      });

      if (subscription && (newStatus === 'paused' || newStatus === 'cancelled' || newStatus === 'active')) {
        const eventType = newStatus === 'active' ? 'resumed' : newStatus as 'paused' | 'cancelled';
        await sendSubscriptionNotification(subscription, eventType);
      }

      fetchSubscriptions();
      setShowCancelConfirm(false);
      setSelectedSubscription(null);
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast({
        title: "Error",
        description: "Failed to update subscription",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const generateNextOrder = async (subscription: Subscription) => {
    try {
      setGeneratingOrder(true);
      
      const { data, error } = await supabase.functions.invoke('generate-subscription-orders', {
        body: { subscription_id: subscription.id }
      });

      if (error) throw error;

      if (data.success && data.generated > 0) {
        toast({
          title: "Order Generated",
          description: `Order ${data.results[0]?.order_number || ''} created for ${subscription.customer_name}`,
        });
        fetchSubscriptions();
        if (showDetails) {
          fetchSubscriptionOrders(subscription.id);
        }
      } else if (data.failed > 0) {
        throw new Error(data.results[0]?.error || 'Failed to generate order');
      }
    } catch (error) {
      console.error('Error generating order:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate order",
        variant: "destructive",
      });
    } finally {
      setGeneratingOrder(false);
    }
  };

  const getDueBadge = (subscription: Subscription) => {
    if (subscription.status !== 'active') return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextDelivery = parseISO(subscription.next_delivery_date);
    const daysUntil = differenceInDays(nextDelivery, today);

    if (daysUntil < 0) {
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
          <AlertCircle className="w-3 h-3 mr-1" />
          Overdue
        </Badge>
      );
    } else if (daysUntil === 0) {
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200 text-xs">
          <CalendarClock className="w-3 h-3 mr-1" />
          Today
        </Badge>
      );
    } else if (daysUntil <= 2) {
      return (
        <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-xs">
          <CalendarClock className="w-3 h-3 mr-1" />
          {daysUntil}d
        </Badge>
      );
    } else if (daysUntil <= 7) {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs">
          <CalendarClock className="w-3 h-3 mr-1" />
          {daysUntil}d
        </Badge>
      );
    }
    return null;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'paused':
        return <Pause className="w-4 h-4 text-yellow-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'biweekly': return 'Bi-weekly';
      case 'monthly': return 'Monthly';
      default: return frequency;
    }
  };

  const getDayLabel = (day: string) => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  const getWeekLabel = (week: number | null) => {
    if (!week) return '';
    const labels = ['1st', '2nd', '3rd', '4th'];
    return labels[week - 1] || '';
  };

  // Count subscriptions due within 7 days
  const dueThisWeekCount = subscriptions.filter(sub => {
    if (sub.status !== 'active') return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextDelivery = parseISO(sub.next_delivery_date);
    const daysUntil = differenceInDays(nextDelivery, today);
    return daysUntil <= 7;
  }).length;

  const filteredSubscriptions = statusFilter === 'all'
    ? subscriptions
    : statusFilter === 'due_soon'
    ? subscriptions.filter(sub => {
        if (sub.status !== 'active') return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const nextDelivery = parseISO(sub.next_delivery_date);
        const daysUntil = differenceInDays(nextDelivery, today);
        return daysUntil <= 7;
      })
    : subscriptions.filter(sub => sub.status === statusFilter);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Subscriptions Management</h3>
          <p className="text-sm text-muted-foreground">Manage recurring delivery subscriptions</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subscriptions</SelectItem>
              <SelectItem value="due_soon">
                Due This Week {dueThisWeekCount > 0 && `(${dueThisWeekCount})`}
              </SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchSubscriptions}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{subscriptions.length}</div>
            <p className="text-xs text-muted-foreground">Total Subscriptions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {subscriptions.filter(s => s.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">
              {subscriptions.filter(s => s.status === 'paused').length}
            </div>
            <p className="text-xs text-muted-foreground">Paused</p>
          </CardContent>
        </Card>
        <Card className={dueThisWeekCount > 0 ? 'border-orange-300 bg-orange-50' : ''}>
          <CardContent className="pt-6">
            <div className={`text-2xl font-bold ${dueThisWeekCount > 0 ? 'text-orange-600' : ''}`}>
              {dueThisWeekCount}
            </div>
            <p className="text-xs text-muted-foreground">Due This Week</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              ${subscriptions.filter(s => s.status === 'active').reduce((sum, s) => sum + s.total_amount, 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Monthly Recurring</p>
          </CardContent>
        </Card>
      </div>

      {/* Subscriptions Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-center">Loading subscriptions...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Frequency</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Next Delivery</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscriptions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      {statusFilter === 'all' ? 'No subscriptions found' : 
                       statusFilter === 'due_soon' ? 'No subscriptions due this week' :
                       `No ${statusFilter} subscriptions found`}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSubscriptions.map((subscription) => (
                    <TableRow key={subscription.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{subscription.customer_name}</div>
                          <div className="text-sm text-muted-foreground">{subscription.customer_email || subscription.customer_phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="flex items-center gap-1 w-fit">
                          <RefreshCw className="w-3 h-3" />
                          {getFrequencyLabel(subscription.frequency)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {subscription.frequency === 'monthly' && subscription.week_of_month
                            ? `${getWeekLabel(subscription.week_of_month)} ${getDayLabel(subscription.preferred_day)}`
                            : `Every ${getDayLabel(subscription.preferred_day)}`
                          }
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">${subscription.total_amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {subscription.status === 'active' ? (
                            <>
                              <span>{format(new Date(subscription.next_delivery_date), 'MMM d, yyyy')}</span>
                              {getDueBadge(subscription)}
                            </>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(subscription.status)}
                          <Badge className={`${getStatusColor(subscription.status)} capitalize`}>
                            {subscription.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedSubscription(subscription);
                              setShowDetails(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {subscription.status !== 'cancelled' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedSubscription(subscription);
                                setShowEditModal(true);
                              }}
                              title="Edit Subscription"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {subscription.status === 'active' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => generateNextOrder(subscription)}
                                disabled={generatingOrder}
                                title="Generate Next Order"
                              >
                                <Package className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateSubscriptionStatus(subscription.id, 'paused')}
                                disabled={updatingStatus}
                              >
                                <Pause className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {subscription.status === 'paused' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateSubscriptionStatus(subscription.id, 'active')}
                              disabled={updatingStatus}
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                          {subscription.status !== 'cancelled' && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedSubscription(subscription);
                                setShowCancelConfirm(true);
                              }}
                              disabled={updatingStatus}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
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

      {/* Subscription Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Subscription Details</DialogTitle>
            <DialogDescription>
              View subscription information, items, and order history
            </DialogDescription>
          </DialogHeader>
          {selectedSubscription && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-medium">{selectedSubscription.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedSubscription.customer_phone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedSubscription.customer_email || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={`${getStatusColor(selectedSubscription.status)} capitalize`}>
                    {selectedSubscription.status}
                  </Badge>
                </div>
              </div>

              {/* Delivery Info */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Delivery Schedule</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Frequency</p>
                    <p className="font-medium">{getFrequencyLabel(selectedSubscription.frequency)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Day</p>
                    <p className="font-medium">
                      {selectedSubscription.frequency === 'monthly' && selectedSubscription.week_of_month
                        ? `${getWeekLabel(selectedSubscription.week_of_month)} ${getDayLabel(selectedSubscription.preferred_day)}`
                        : getDayLabel(selectedSubscription.preferred_day)
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <p className="font-medium capitalize">{selectedSubscription.delivery_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Next Delivery</p>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {selectedSubscription.status === 'active'
                          ? format(new Date(selectedSubscription.next_delivery_date), 'MMMM d, yyyy')
                          : '—'
                        }
                      </p>
                      {getDueBadge(selectedSubscription)}
                    </div>
                  </div>
                  {selectedSubscription.delivery_address && (
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Delivery Address</p>
                      <p className="font-medium">{selectedSubscription.delivery_address}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Items */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Items</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedSubscription.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                        <TableCell className="text-right">${(item.price * item.quantity).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={3} className="font-medium">Total per Delivery</TableCell>
                      <TableCell className="text-right font-bold">${selectedSubscription.total_amount.toFixed(2)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Order History */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Order History</h4>
                {loadingOrders ? (
                  <p className="text-sm text-muted-foreground">Loading orders...</p>
                ) : subscriptionOrders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No orders generated yet</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order #</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subscriptionOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono text-sm">{order.order_number}</TableCell>
                          <TableCell>{format(new Date(order.created_at), 'MMM d, yyyy')}</TableCell>
                          <TableCell>${order.total_amount.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge className={`${getOrderStatusColor(order.status)} capitalize`}>
                              {order.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              {/* Action Buttons */}
              {selectedSubscription.status !== 'cancelled' && (
                <div className="border-t pt-4 flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDetails(false);
                      setShowEditModal(true);
                    }}
                    className="flex-1"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Subscription
                  </Button>
                  {selectedSubscription.status === 'active' && (
                    <Button
                      onClick={() => generateNextOrder(selectedSubscription)}
                      disabled={generatingOrder}
                      className="flex-1"
                    >
                      <Package className="h-4 w-4 mr-2" />
                      {generatingOrder ? 'Generating...' : 'Generate Order'}
                    </Button>
                  )}
                </div>
              )}
              {selectedSubscription.status === 'active' && (
                <p className="text-xs text-muted-foreground text-center">
                  Generate Order will create a new order and advance the next delivery date
                </p>
              )}

              {/* Dates */}
              <div className="border-t pt-4 text-sm text-muted-foreground">
                <p>Started: {format(new Date(selectedSubscription.start_date), 'MMMM d, yyyy')}</p>
                <p>Created: {format(new Date(selectedSubscription.created_at), 'MMMM d, yyyy h:mm a')}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetails(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Modal */}
      <Dialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this subscription? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedSubscription && (
            <div className="py-4">
              <p><strong>Customer:</strong> {selectedSubscription.customer_name}</p>
              <p><strong>Amount:</strong> ${selectedSubscription.total_amount.toFixed(2)} / {getFrequencyLabel(selectedSubscription.frequency).toLowerCase()}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelConfirm(false)} disabled={updatingStatus}>
              Keep Subscription
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedSubscription && updateSubscriptionStatus(selectedSubscription.id, 'cancelled')}
              disabled={updatingStatus}
            >
              {updatingStatus ? 'Cancelling...' : 'Yes, Cancel Subscription'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Subscription Modal */}
      <EditSubscriptionModal
        subscription={selectedSubscription}
        open={showEditModal}
        onOpenChange={setShowEditModal}
        onSuccess={fetchSubscriptions}
      />
    </div>
  );
}
