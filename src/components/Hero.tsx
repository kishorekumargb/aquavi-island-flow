import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Droplets, Award, Shield } from 'lucide-react';
import { OrderModal } from '@/components/OrderModal';
import { supabase } from '@/integrations/supabase/client';

export function Hero() {
  const [heroImageUrl, setHeroImageUrl] = useState('/src/assets/aqua-vi-hero-banner.jpg');

  useEffect(() => {
    fetchHeroImage();
  }, []);

  const fetchHeroImage = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('setting_value')
        .eq('setting_key', 'hero_image_url')
        .single();

      if (error) throw error;
      
      if (data?.setting_value) {
        setHeroImageUrl(data.setting_value);
      }
    } catch (error) {
      console.error('Error fetching hero image:', error);
    }
  };

  return (
    <>
      {/* Full Screen Hero Image Section - Image Only */}
      <section className="relative h-screen w-full overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImageUrl})` }}
        >
          <div className="absolute inset-0 bg-black/20"></div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Hero Content Section */}
      <section className="relative py-16 sm:py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 lg:mb-16">
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-8">
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-sm sm:text-base">
                <Droplets className="w-4 h-4 mr-2" />
                Locally Bottled
              </Badge>
              <Badge variant="secondary" className="bg-secondary/10 text-secondary border-secondary/20 text-sm sm:text-base">
                <Shield className="w-4 h-4 mr-2" />
                Free Delivery
              </Badge>
            </div>
            
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-heading font-bold leading-tight mb-6 sm:mb-8 text-foreground">
              Convenience Meets Great Taste
            </h1>
            
            <p className="text-xl sm:text-2xl lg:text-3xl font-tagline text-tropical italic mb-8 sm:mb-10">
              Locally bottled water with great taste and free delivery across Road Town.
            </p>
            
            <p className="text-base sm:text-lg max-w-3xl mx-auto leading-relaxed mb-12 sm:mb-16 text-muted-foreground">
              Enjoy Aqua VI—the sweet taste of purity, delivered to you for FREE.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center mb-12">
              <OrderModal>
                <Button variant="hero" size="lg" className="shadow-glow text-base sm:text-lg px-8 py-4">
                  Order Now
                </Button>
              </OrderModal>
              <Button variant="outline" size="lg" className="border-primary/30 hover:bg-primary/5 text-base sm:text-lg px-8 py-4">
                Learn More
              </Button>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 text-sm sm:text-base text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Available Today</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>Delivery 3:30 - 5:30 PM</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-16 sm:py-20 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Features Section */}
            <div className="text-center lg:text-left">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-6 lg:mb-8">
                Why Choose Aqua VI?
              </h2>
              
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mb-8 lg:mb-12 leading-relaxed">
                Fresh, locally bottled in the British Virgin Islands with minerals added for that perfect taste. 
                Delivered fresh to your door across Road Town.
              </p>

              {/* Features Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 lg:gap-8 max-w-2xl mx-auto lg:mx-0">
                <div className="text-center lg:text-left">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto lg:mx-0 mb-4">
                    <Droplets className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Locally Bottled</h3>
                  <p className="text-sm text-muted-foreground">Fresh from the British Virgin Islands</p>
                </div>
                <div className="text-center lg:text-left">
                  <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto lg:mx-0 mb-4">
                    <Award className="w-8 h-8 text-secondary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Great Taste</h3>
                  <p className="text-sm text-muted-foreground">Minerals added for perfect flavor</p>
                </div>
                <div className="text-center lg:text-left">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto lg:mx-0 mb-4">
                    <Shield className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Free Delivery</h3>
                  <p className="text-sm text-muted-foreground">Delivered across Road Town</p>
                </div>
              </div>
            </div>

            {/* Product Image */}
            <div className="relative order-first lg:order-last">
              <div className="relative z-10 p-4 sm:p-8">
                <img 
                  src="/src/assets/aqua-vi-bottle.png" 
                  alt="Aqua VI Bottles"
                  className="w-full max-w-md mx-auto drop-shadow-2xl"
                />
              </div>
              
              {/* Caribbean-inspired Floating Elements */}
              <div className="absolute -top-8 -right-8 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-bottle rounded-full opacity-15 animate-pulse"></div>
              <div className="absolute -bottom-8 -left-8 w-32 h-32 sm:w-40 sm:h-40 bg-gradient-ocean rounded-full opacity-15 animate-pulse delay-1000"></div>
              <div className="absolute top-1/3 -right-12 w-16 h-16 sm:w-20 sm:h-20 bg-tropical/20 rounded-full opacity-30 animate-pulse delay-500"></div>
              <div className="absolute bottom-1/3 -left-6 w-12 h-12 sm:w-16 sm:h-16 bg-primary/15 rounded-full opacity-25 animate-pulse delay-700"></div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}