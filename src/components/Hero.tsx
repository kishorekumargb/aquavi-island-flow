import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Droplets, Award, Shield } from 'lucide-react';
import heroBottle from '@/assets/aquavi-hero-bottle.jpg';
import { OrderModal } from '@/components/OrderModal';

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-subtle"></div>
      
      {/* Content Container */}
      <div className="container mx-auto px-6 py-24 grid lg:grid-cols-2 gap-12 items-center relative z-10">
        
        {/* Left Content */}
        <div className="space-y-8">
          {/* Premium Badge */}
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
              <Award className="w-4 h-4 mr-2" />
              Laboratory Certified
            </Badge>
            <Badge variant="secondary" className="bg-secondary/10 text-secondary border-secondary/20">
              <Shield className="w-4 h-4 mr-2" />
              BVI Premium
            </Badge>
          </div>

          {/* Main Heading */}
          <div className="space-y-4">
            <h1 className="text-5xl lg:text-7xl font-heading font-bold text-foreground leading-tight">
              AQUAVI
            </h1>
            <p className="text-2xl lg:text-3xl font-tagline text-primary italic">
              "Pure BVI. Pure Excellence."
            </p>
          </div>

          {/* Description */}
          <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
            Ultra-luxury, locally owned premium bottled water delivering laboratory-certified purity 
            with island pride and concierge-level reliability. Experience the essence of the British Virgin Islands.
          </p>

          {/* Features */}
          <div className="grid grid-cols-3 gap-4 max-w-md">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <Droplets className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm font-medium">99.9% Pure</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <Award className="w-6 h-6 text-secondary" />
              </div>
              <p className="text-sm font-medium">Lab Tested</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm font-medium">BVI Local</p>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4">
            <OrderModal>
              <Button variant="hero" size="lg" className="shadow-glow">
                Order Now
              </Button>
            </OrderModal>
            <Button variant="outline" size="lg" className="border-primary/30 hover:bg-primary/5">
              Learn More
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="flex items-center space-x-6 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Available Today</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span>Delivery 3:30 - 5:30 PM</span>
            </div>
          </div>
        </div>

        {/* Right Content - Hero Image */}
        <div className="relative">
          <div className="relative z-10">
            <img 
              src={heroBottle} 
              alt="AQUAVI Premium Bottled Water"
              className="w-full max-w-md mx-auto drop-shadow-2xl shadow-premium"
            />
          </div>
          
          {/* Floating Elements */}
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-gradient-hero rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-gradient-ocean rounded-full opacity-20 animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 -right-12 w-16 h-16 bg-primary/20 rounded-full opacity-40 animate-pulse delay-500"></div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-primary rounded-full flex justify-center">
          <div className="w-1 h-3 bg-primary rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
}