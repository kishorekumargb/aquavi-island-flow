import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Facebook, 
  Instagram, 
  Twitter, 
  MessageCircle, 
  Phone, 
  Mail, 
  MapPin,
  Droplets,
  Award,
  Shield,
  Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const quickLinks = [
  { name: 'Products', href: '#products' },
  { name: 'Why AQUAVI?', href: '#why-aquavi' },
  { name: 'Testimonials', href: '#testimonials' },
  { name: 'Contact', href: '#contact' }
];

const support = [
  { name: 'Order Tracking', href: '#' },
  { name: 'Delivery Info', href: '#' },
  { name: 'Subscription Management', href: '#' },
  { name: 'FAQ', href: '#' }
];

const legal = [
  { name: 'Privacy Policy', href: '#' },
  { name: 'Terms of Service', href: '#' },
  { name: 'Return Policy', href: '#' },
  { name: 'Quality Guarantee', href: '#' }
];

export function Footer() {
  const [businessPhone, setBusinessPhone] = useState('1-499-4611');
  const [businessAddress, setBusinessAddress] = useState('MoneyGram, Flemming Street');
  const [deliveryHours, setDeliveryHours] = useState('3:30-5:30 PM');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await supabase
        .from('site_settings')
        .select('*')
        .in('setting_key', ['business_phone', 'business_address', 'delivery_hours']);

      if (data) {
        data.forEach(setting => {
          if (setting.setting_key === 'business_phone' && setting.setting_value) {
            setBusinessPhone(setting.setting_value);
          }
          if (setting.setting_key === 'business_address' && setting.setting_value) {
            setBusinessAddress(setting.setting_value);
          }
          if (setting.setting_key === 'delivery_hours' && setting.setting_value) {
            setDeliveryHours(setting.setting_value);
          }
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  return (
    <footer className="bg-gradient-subtle border-t border-border">
      <div className="container mx-auto px-6 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-10 h-10 bg-gradient-hero rounded-full flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xl">A</span>
              </div>
              <span className="font-heading text-3xl font-bold text-primary">Aqua VI</span>
            </div>
            
            <p className="text-muted-foreground leading-relaxed mb-6 max-w-xs">
              Locally bottled water with great taste and free delivery across the British Virgin Islands.
            </p>


            <p className="text-sm font-tagline text-primary italic">
              "Convenience Meets Great Taste"
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-heading text-lg font-semibold text-foreground mb-4">Quick Links</h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <a 
                    href={link.href} 
                    className="text-muted-foreground hover:text-primary transition-smooth"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>


          {/* Contact Info */}
          <div>
            <h3 className="font-heading text-lg font-semibold text-foreground mb-4">Contact</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">{businessPhone}</span>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-primary mt-1" />
                <div>
                  <div className="text-muted-foreground">{businessAddress}</div>
                  <div className="text-muted-foreground text-sm">Road Town Tortola</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground text-sm">Delivery: {deliveryHours}</span>
              </div>
            </div>

            {/* Social Media */}
            <div className="mt-6">
              <h4 className="font-medium text-foreground mb-3">Follow Us</h4>
              <div className="flex space-x-3">
                <Button variant="outline" size="icon" className="rounded-full">
                  <Facebook className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" className="rounded-full">
                  <Instagram className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" className="rounded-full">
                  <Twitter className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" className="rounded-full bg-green-50 border-green-200 hover:bg-green-100">
                  <MessageCircle className="w-4 h-4 text-green-600" />
                </Button>
              </div>
            </div>
          </div>
        </div>


        <Separator className="mb-8" />

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-sm text-muted-foreground">
            © 2024 Aqua VI Water. All rights reserved. Made with pride in the BVI.
          </div>
          
          <div className="flex flex-wrap justify-center space-x-6 text-sm">
            {legal.map((item) => (
              <a 
                key={item.name}
                href={item.href} 
                className="text-muted-foreground hover:text-primary transition-smooth"
              >
                {item.name}
              </a>
            ))}
          </div>
        </div>

      </div>
    </footer>
  );
}