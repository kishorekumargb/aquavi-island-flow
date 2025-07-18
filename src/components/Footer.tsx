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
              <span className="font-heading text-3xl font-bold text-primary">AQUAVI</span>
            </div>
            
            <p className="text-muted-foreground leading-relaxed mb-6 max-w-xs">
              Ultra-luxury, locally owned premium bottled water delivering laboratory-certified 
              purity with island pride and concierge-level reliability.
            </p>

            <div className="space-y-3 mb-6">
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                <Award className="w-3 h-3 mr-2" />
                Laboratory Certified
              </Badge>
              <Badge variant="secondary" className="bg-secondary/10 text-secondary border-secondary/20">
                <Shield className="w-3 h-3 mr-2" />
                BVI Premium
              </Badge>
            </div>

            <p className="text-sm font-tagline text-primary italic">
              "Pure BVI. Pure Excellence."
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

          {/* Support */}
          <div>
            <h3 className="font-heading text-lg font-semibold text-foreground mb-4">Support</h3>
            <ul className="space-y-3">
              {support.map((item) => (
                <li key={item.name}>
                  <a 
                    href={item.href} 
                    className="text-muted-foreground hover:text-primary transition-smooth"
                  >
                    {item.name}
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
                <span className="text-muted-foreground">+1 (284) 494-AQUA</span>
              </div>
              <div className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">info@aquavi.vg</span>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-primary mt-1" />
                <div>
                  <div className="text-muted-foreground">Road Town, Tortola</div>
                  <div className="text-muted-foreground text-sm">British Virgin Islands</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground text-sm">Delivery: 3:30-5:30 PM</span>
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

        {/* Mini FAQ */}
        <div className="mb-12">
          <h3 className="font-heading text-xl font-semibold text-foreground mb-6 text-center">
            Quick Answers
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-background rounded-lg border border-border">
              <Droplets className="w-8 h-8 text-primary mx-auto mb-3" />
              <h4 className="font-semibold mb-2">Is AQUAVI really pure?</h4>
              <p className="text-sm text-muted-foreground">
                Yes! 99.9% pure, third-party lab certified with complete transparency.
              </p>
            </div>
            <div className="text-center p-4 bg-background rounded-lg border border-border">
              <Clock className="w-8 h-8 text-secondary mx-auto mb-3" />
              <h4 className="font-semibold mb-2">Same-day delivery?</h4>
              <p className="text-sm text-muted-foreground">
                Orders before 2:00 PM get same-day delivery between 3:30-5:30 PM.
              </p>
            </div>
            <div className="text-center p-4 bg-background rounded-lg border border-border">
              <Award className="w-8 h-8 text-primary mx-auto mb-3" />
              <h4 className="font-semibold mb-2">Why choose local?</h4>
              <p className="text-sm text-muted-foreground">
                Support BVI business with premium quality and unmatched service.
              </p>
            </div>
          </div>
        </div>

        <Separator className="mb-8" />

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="text-sm text-muted-foreground">
            © 2024 AQUAVI Premium Water. All rights reserved. Made with pride in the BVI.
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

        {/* Trust Indicators */}
        <div className="flex justify-center space-x-8 mt-8 pt-8 border-t border-border text-sm text-muted-foreground">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>ISO Certified</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <span>Lab Tested</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-secondary rounded-full"></div>
            <span>BVI Local</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Available Today</span>
          </div>
        </div>
      </div>
    </footer>
  );
}