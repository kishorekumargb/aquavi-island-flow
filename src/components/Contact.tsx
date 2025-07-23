import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Phone, Mail, MapPin, Clock, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from('site_settings')
        .select('setting_key, setting_value');
      
      if (data) {
        const settingsMap = data.reduce((acc, setting) => {
          acc[setting.setting_key] = setting.setting_value;
          return acc;
        }, {});
        setSettings(settingsMap);
      }
    };
    
    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      toast({
        title: "Message Sent Successfully!",
        description: "We'll respond within 24 hours. Thank you for contacting Aqua VI.",
      });
      setFormData({ name: '', email: '', phone: '', message: '' });
      setIsSubmitting(false);
    }, 1500);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <section id="contact" className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-heading font-bold text-foreground mb-4">
            Contact us today to schedule your Aqua VI delivery
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Delivery available in the greater Road Town area with FREE delivery service.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-heading font-semibold mb-6">Get in Touch</h3>
              <p className="text-muted-foreground leading-relaxed mb-8">
              Our customer service team is here to help with orders, delivery scheduling, 
              and any questions about Aqua VI water. We provide friendly local service 
              with free delivery to the greater Road Town area.
              </p>
            </div>

            {/* Contact Methods */}
            <div className="space-y-6">
              {/* WhatsApp */}
              <Card className="hover:shadow-elegant transition-smooth border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                      <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-foreground">WhatsApp Support</div>
                      <div className="text-muted-foreground">{settings.phone || '1-499-4611'}</div>
                      <Badge variant="secondary" className="mt-2 bg-green-100 text-green-700">
                        Fastest Response
                      </Badge>
                    </div>
                    <Button variant="outline" size="sm" className="border-green-500 text-green-600 hover:bg-green-50">
                      Chat Now
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Phone */}
              <Card className="hover:shadow-elegant transition-smooth">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                      <Phone className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-foreground">Phone Support</div>
                      <div className="text-muted-foreground">{settings.phone || '1-499-4611'}</div>
                      <div className="text-sm text-muted-foreground">{settings.business_hours_monday_friday || 'Mon-Fri 8AM-6PM'}, {settings.business_hours_saturday || 'Sat 9AM-4PM'}</div>
                    </div>
                    <Button variant="outline" size="sm">
                      Call Now
                    </Button>
                  </div>
                </CardContent>
              </Card>


              {/* Address */}
              <Card className="hover:shadow-elegant transition-smooth">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-accent-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-foreground">Visit Our Office</div>
                      <div className="text-muted-foreground">{settings.address || 'MoneyGram, Flemming Street'}</div>
                      <div className="text-muted-foreground">{settings.address ? '' : 'Road Town, Tortola'}</div>
                    </div>
                    <Button variant="outline" size="sm">
                      Directions
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Business Hours */}
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <span>Business Hours</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-medium">Monday - Friday</div>
                    <div className="text-muted-foreground">{settings.business_hours_monday_friday || '8:00 AM - 6:00 PM'}</div>
                  </div>
                  <div>
                    <div className="font-medium">Saturday</div>
                    <div className="text-muted-foreground">{settings.business_hours_saturday || '9:00 AM - 4:00 PM'}</div>
                  </div>
                  <div>
                    <div className="font-medium">Sunday</div>
                    <div className="text-muted-foreground">{settings.business_hours_sunday || 'Emergency Only'}</div>
                  </div>
                  <div>
                    <div className="font-medium">Delivery Hours</div>
                    <div className="text-muted-foreground">{settings.delivery_hours || '3:30 PM - 5:30 PM'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle className="text-2xl font-heading">Send us a Message</CardTitle>
              <CardDescription>
                Have a question about our products or need help with an order? We're here to help.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-base font-medium">Name *</Label>
                    <Input
                      id="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="mt-2"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-base font-medium">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="mt-2"
                      placeholder="+1 (284) 123-4567"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email" className="text-base font-medium">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="mt-2"
                    placeholder="your.email@example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="message" className="text-base font-medium">Message *</Label>
                  <Textarea
                    id="message"
                    required
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    className="mt-2 min-h-[120px]"
                    placeholder="Tell us how we can help you..."
                  />
                </div>

                <Button 
                  type="submit" 
                  variant="premium" 
                  size="lg" 
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                      <span>Sending...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Send className="w-5 h-5" />
                      <span>Send Message</span>
                    </div>
                  )}
                </Button>

                <p className="text-sm text-muted-foreground text-center">
                  We'll respond within 24 hours. For urgent matters, please call or WhatsApp us directly.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}