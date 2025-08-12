import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Droplets, Shield, Award, Truck, Clock, Heart } from 'lucide-react';

const features = [
  {
    icon: Droplets,
    title: "Locally Bottled",
    description: "Fresh water bottled right here in the British Virgin Islands",
    highlight: "Local Quality"
  },
  {
    icon: Award,
    title: "Great Taste",
    description: "Crisp, clean water that beats the competition",
    highlight: "Premium Taste"
  },
  {
    icon: Truck,
    title: "Free Delivery",
    description: "Same-day delivery across Road Town",
    highlight: "No Extra Cost"
  }
];

export function WhyAquavi() {
  return (
    <section id="why-aquavi" className="py-16 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl lg:text-5xl font-heading font-bold text-foreground mb-4">
            Why Choose Aqua VI?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Locally bottled water with great taste and free delivery across the British Virgin Islands.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="relative overflow-hidden group hover:shadow-elegant transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-hero rounded-lg flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-heading text-lg font-semibold text-foreground">{feature.title}</h3>
                      <Badge variant="secondary" className="text-xs">{feature.highlight}</Badge>
                    </div>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

      </div>
    </section>
  );
}