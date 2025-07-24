import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Droplets, Award, Shield } from 'lucide-react';
import { OrderModal } from '@/components/OrderModal';
import { supabase } from '@/integrations/supabase/client';

export function Hero() {
  const [heroImageUrl, setHeroImageUrl] = useState('');

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
      <section className="relative h-screen w-full overflow-hidden mt-20">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transform scale-100 sm:scale-100 md:scale-100"
          style={{ backgroundImage: `url(${heroImageUrl})` }}
        />
        
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
            
            <div className="flex justify-center mb-12">
              <OrderModal>
                <Button variant="hero" size="lg" className="shadow-glow text-base sm:text-lg px-8 py-4">
                  Order Now
                </Button>
              </OrderModal>
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

    </>
  );
}