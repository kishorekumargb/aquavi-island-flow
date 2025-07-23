import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Truck } from 'lucide-react';

const serviceAreas = [
  { name: 'Road Town', coverage: '100%' },
  { name: 'Spanish Town', coverage: '100%' },
  { name: 'The Valley', coverage: '100%' },
  { name: 'West End', coverage: '95%' }
];

export function WhyAquavi() {
  return (
    <section id="why-aquavi" className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-heading font-bold text-foreground mb-4">
            Why Choose Aqua VI?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Locally bottled water with great taste and free delivery across the British Virgin Islands.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Delivery Coverage */}
          <Card>
            <CardContent className="p-6">
              <h4 className="text-xl font-heading font-semibold mb-4 flex items-center">
                <Truck className="w-5 h-5 mr-2 text-primary" />
                Delivery Coverage
              </h4>
              <div className="space-y-3">
                {serviceAreas.map((area, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span className="font-medium">{area.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{area.coverage} Coverage</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-sm text-primary font-medium">
                  📍 Same-day delivery available for orders placed before 2:00 PM
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}