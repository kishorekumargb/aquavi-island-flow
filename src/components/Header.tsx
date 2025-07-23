import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { OrderModal } from '@/components/OrderModal';
import { Menu, X, Phone, Mail } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [businessPhone, setBusinessPhone] = useState('1-499-4611');
  const [businessEmail, setBusinessEmail] = useState('info@aquavi.com');
  useEffect(() => {
    fetchSettings();
  }, []);
  const fetchSettings = async () => {
    try {
      const {
        data
      } = await supabase.from('site_settings').select('*').in('setting_key', ['business_phone']);
      if (data) {
        data.forEach(setting => {
          if (setting.setting_key === 'business_phone' && setting.setting_value) {
            setBusinessPhone(setting.setting_value);
          }
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };
  return <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <img src="/lovable-uploads/a2e2f478-6f1b-41fd-954b-c2753b9c6153.png" alt="Aqua VI Logo" className="w-10 h-10" onError={e => {
            const target = e.currentTarget as HTMLImageElement;
            const sibling = target.nextElementSibling as HTMLElement;
            target.style.display = 'none';
            if (sibling) sibling.style.display = 'flex';
          }} />
            <div className="w-10 h-10 bg-gradient-hero rounded-full items-center justify-center hidden">
              <span className="text-primary-foreground font-bold text-lg">A</span>
            </div>
            <span className="font-heading text-2xl font-bold text-primary">AQUA VI</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#products" className="text-foreground hover:text-primary transition-smooth">Products</a>
            <a href="#why-aquavi" className="text-foreground hover:text-primary transition-smooth">Why Aqua VI?</a>
            <a href="#testimonials" className="text-foreground hover:text-primary transition-smooth">Reviews</a>
            <a href="#contact" className="text-foreground hover:text-primary transition-smooth">Contact</a>
          </nav>

          {/* Contact Info & CTA */}
          <div className="hidden lg:flex items-center space-x-4">
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Phone className="w-4 h-4" />
                <span>{businessPhone}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Mail className="w-4 h-4" />
                <span>{businessEmail}</span>
              </div>
            </div>
            <OrderModal>
              <Button variant="premium" size="sm">
                Order Now
              </Button>
            </OrderModal>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && <div className="md:hidden mt-4 pb-4 border-t border-border">
            <nav className="flex flex-col space-y-4 mt-4">
              <a href="#products" className="text-foreground hover:text-primary transition-smooth">Products</a>
              <a href="#why-aquavi" className="text-foreground hover:text-primary transition-smooth">Why Aqua VI?</a>
              <a href="#testimonials" className="text-foreground hover:text-primary transition-smooth">Reviews</a>
              <a href="#contact" className="text-foreground hover:text-primary transition-smooth">Contact</a>
              <div className="pt-4 border-t border-border">
                <OrderModal>
                  <Button variant="premium" className="w-full">
                    Order Now
                  </Button>
                </OrderModal>
              </div>
            </nav>
          </div>}
      </div>
    </header>;
}