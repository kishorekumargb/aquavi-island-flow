import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { OrderModal } from '@/components/OrderModal';
import { Menu, X, Phone, Mail } from 'lucide-react';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <img 
              src="/src/assets/aqua-vi-logo-updated.png" 
              alt="Aqua VI Logo" 
              className="w-10 h-10"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                const sibling = target.nextElementSibling as HTMLElement;
                target.style.display = 'none';
                if (sibling) sibling.style.display = 'flex';
              }}
            />
            <div className="w-10 h-10 bg-gradient-hero rounded-full items-center justify-center hidden">
              <span className="text-primary-foreground font-bold text-lg">A</span>
            </div>
            <span className="font-heading text-2xl font-bold text-primary">Aqua VI</span>
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
                <span>1-499-4611</span>
              </div>
              <div className="flex items-center space-x-1">
                <Mail className="w-4 h-4" />
                <span>info@aquavi.com</span>
              </div>
            </div>
            <OrderModal>
              <Button variant="premium" size="sm">
                Order Now
              </Button>
            </OrderModal>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-border">
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
          </div>
        )}
      </div>
    </header>
  );
}