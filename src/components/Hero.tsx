import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Droplets, Award, Shield } from 'lucide-react';
import heroBottle from '@/assets/aqua-vi-bottle.png';
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
              <Droplets className="w-4 h-4 mr-2" />
              Locally Bottled
            </Badge>
            <Badge variant="secondary" className="bg-secondary/10 text-secondary border-secondary/20">
              <Shield className="w-4 h-4 mr-2" />
              Free Delivery
            </Badge>
          </div>

          {/* Main Heading */}
          <div className="space-y-4">
            <h1 className="text-5xl lg:text-7xl font-heading font-bold text-foreground leading-tight">
              Convenience Meets Great Taste
            </h1>
            <p className="text-2xl lg:text-3xl font-tagline text-tropical italic">
              Locally bottled water with great taste and free delivery across Road Town.
            </p>
          </div>

          {/* Description */}
          <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
            Experience the sweet taste of purity with minerals added for taste. Fresh, locally bottled 
            in the British Virgin Islands and delivered free to your door across Road Town.
          </p>

          {/* Features */}
          <div className="grid grid-cols-3 gap-4 max-w-md">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <Droplets className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm font-medium">Locally Bottled</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <Award className="w-6 h-6 text-secondary" />
              </div>
              <p className="text-sm font-medium">Great Taste</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm font-medium">Free Delivery</p>
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
          <div className="relative z-10 p-8">
            <img 
              src={heroBottle} 
              alt="Aqua VI - The Sweet Taste of Purity"
              className="w-full max-w-sm mx-auto drop-shadow-2xl"
              onError={(e) => {
                e.currentTarget.src = '/src/assets/aquavi-hero-bottle.jpg';
              }}
            />
          </div>
          
          {/* Caribbean-inspired Floating Elements */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-gradient-bottle rounded-full opacity-15 animate-pulse"></div>
          <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-gradient-ocean rounded-full opacity-15 animate-pulse delay-1000"></div>
          <div className="absolute top-1/3 -right-16 w-20 h-20 bg-tropical/20 rounded-full opacity-30 animate-pulse delay-500"></div>
          <div className="absolute bottom-1/3 -left-8 w-16 h-16 bg-primary/15 rounded-full opacity-25 animate-pulse delay-700"></div>
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