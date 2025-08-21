import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { Mail, Phone, User, Calendar, MessageSquare, CheckCircle2, Clock, AlertCircle } from "lucide-react";

interface Message {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface ViewMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: Message | null;
  onUpdateStatus: (messageId: string, newStatus: string) => void;
}

export const ViewMessageModal = ({ isOpen, onClose, message, onUpdateStatus }: ViewMessageModalProps) => {
  const [updatingStatus, setUpdatingStatus] = useState(false);

  if (!message) return null;

  const handleStatusUpdate = async (newStatus: string) => {
    setUpdatingStatus(true);
    try {
      await onUpdateStatus(message.id, newStatus);
      onClose();
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'responded':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'resolved':
        return <CheckCircle2 className="h-4 w-4 text-blue-600" />;
      case 'unread':
      default:
        return <Clock className="h-4 w-4 text-orange-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'responded':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'resolved':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'unread':
      default:
        return 'bg-orange-50 text-orange-700 border-orange-200';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Message Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Contact Information */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <User className="h-4 w-4" />
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{message.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{message.email}</p>
                  </div>
                </div>
                {message.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="font-medium">{message.phone}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Received</p>
                    <p className="font-medium">{format(new Date(message.created_at), 'PPP')}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Message Content */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Message Content
              </h3>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="whitespace-pre-wrap leading-relaxed">{message.message}</p>
              </div>
            </CardContent>
          </Card>

          {/* Status Management */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Message Status
              </h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">Current Status:</span>
                  <Badge className={getStatusColor(message.status)} variant="outline">
                    <span className="flex items-center gap-1">
                      {getStatusIcon(message.status)}
                      {message.status.charAt(0).toUpperCase() + message.status.slice(1)}
                    </span>
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Update to:</span>
                  <Select value={message.status} onValueChange={handleStatusUpdate} disabled={updatingStatus}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unread">Unread</SelectItem>
                      <SelectItem value="responded">Responded</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  onClick={() => window.open(`mailto:${message.email}?subject=Re: Your Inquiry&body=Dear ${message.name},%0D%0A%0D%0AThank you for contacting us.%0D%0A%0D%0ABest regards,%0D%0AAquaVi Team`, '_blank')}
                >
                  <Mail className="h-4 w-4" />
                  Reply via Email
                </Button>
                {message.phone && (
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    onClick={() => window.open(`tel:${message.phone}`, '_blank')}
                  >
                    <Phone className="h-4 w-4" />
                    Call Customer
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  onClick={() => handleStatusUpdate('resolved')}
                  disabled={updatingStatus || message.status === 'resolved'}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Mark Resolved
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            Last updated: {format(new Date(message.updated_at), 'PPp')}
          </div>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};