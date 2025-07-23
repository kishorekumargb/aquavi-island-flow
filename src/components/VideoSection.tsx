import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Play, MapPin, Truck } from 'lucide-react';

export function VideoSection() {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          {/* Video Placeholder */}
          <Card className="relative overflow-hidden shadow-elegant">
            <CardContent className="p-0">
              <div className="relative bg-gradient-hero aspect-video flex items-center justify-center">
                <div className="text-center text-primary-foreground space-y-4">
                  <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto">
                    <Play className="w-10 h-10 fill-current" />
                  </div>
                  <h3 className="text-2xl font-heading font-bold">
                    Aqua VI's Local Journey vs. Imported Water
                  </h3>
                  <p className="text-lg opacity-90">
                    30-second comparison video coming soon
                  </p>
                </div>
                
                {/* Overlay Message */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white p-6">
                  <div className="text-center space-y-2">
                    <p className="text-lg font-semibold">
                      Why drink water that's traveled thousands of miles?
                    </p>
                    <p className="text-base">
                      At Aqua VI, your water is bottled at the source, fresh, and delivered for free.
                    </p>
                    <Badge variant="secondary" className="bg-primary text-primary-foreground">
                      Choose water that's from the VI. For you.
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comparison Cards */}
          <div className="grid md:grid-cols-2 gap-8 mt-12">
            {/* Imported Water */}
            <Card className="border-2 border-muted">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-heading font-semibold mb-3">Imported Water</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>Travels thousands of miles</li>
                  <li>Higher carbon footprint</li>
                  <li>More expensive shipping costs</li>
                  <li>Longer time to reach you</li>
                </ul>
              </CardContent>
            </Card>

            {/* Aqua VI */}
            <Card className="border-2 border-primary shadow-glow">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-hero rounded-full flex items-center justify-center mx-auto mb-4">
                  <Truck className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-heading font-semibold mb-3 text-primary">Aqua VI Water</h3>
                <ul className="space-y-2 text-foreground">
                  <li>✓ Bottled locally in BVI</li>
                  <li>✓ Fresh from the source</li>
                  <li>✓ FREE delivery to your door</li>
                  <li>✓ Supporting local business</li>
                </ul>
                <Button variant="premium" className="mt-4">
                  Drink Local. Stay Healthy.
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}