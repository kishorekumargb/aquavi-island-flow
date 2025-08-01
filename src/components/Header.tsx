import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { OrderModal } from '@/components/OrderModal';
import { Menu, X, Phone, Mail, User, LogOut } from 'lucide-react';
import { useContactInfo } from '@/hooks/useContactInfo';
import { useAuth } from '@/components/auth/AuthProvider';
import { Link } from 'react-router-dom';
export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { contactInfo } = useContactInfo();
  const { user, signOut } = useAuth();
  return <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border shadow-sm">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <img src={contactInfo.logo_url || "/lovable-uploads/a2e2f478-6f1b-41fd-954b-c2753b9c6153.png"} alt="Aqua VI Logo" className="w-10 h-10" onError={e => {
            const target = e.currentTarget as HTMLImageElement;
            const sibling = target.nextElementSibling as HTMLElement;
            target.style.display = 'none';
            if (sibling) sibling.style.display = 'flex';
          }} />
            <div className="w-10 h-10 bg-gradient-hero rounded-full items-center justify-center hidden">
              <span className="text-primary-foreground font-bold text-lg">A</span>
            </div>
            <span className="font-heading text-2xl font-bold text-primary">AQUA VI Distributor</span>
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
                <span>{contactInfo.phone}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Mail className="w-4 h-4" />
                <span>{contactInfo.email}</span>
              </div>
            </div>
            <OrderModal>
              <Button variant="premium" size="sm">
                Order Now
              </Button>
            </OrderModal>
            {user ? (
              <div className="flex items-center space-x-2">
                <Link to="/admin">
                  <Button variant="outline" size="sm">
                    Dashboard
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={() => signOut()}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Link to="/auth">
                <Button variant="outline" size="sm">
                  <User className="w-4 h-4 mr-2" />
                  Sign In
                </Button>
              </Link>
            )}
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
              <div className="pt-4 border-t border-border space-y-2">
                <OrderModal>
                  <Button variant="premium" className="w-full">
                    Order Now
                  </Button>
                </OrderModal>
                {user ? (
                  <>
                    <Link to="/admin" className="block">
                      <Button variant="outline" className="w-full">
                        Dashboard
                      </Button>
                    </Link>
                    <Button variant="ghost" className="w-full" onClick={() => signOut()}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <Link to="/auth" className="block">
                    <Button variant="outline" className="w-full">
                      <User className="w-4 h-4 mr-2" />
                      Sign In
                    </Button>
                  </Link>
                )}
              </div>
            </nav>
          </div>}
      </div>
    </header>;
}