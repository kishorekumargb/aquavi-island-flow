import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Droplets, Shield, Award, Truck, Clock, Heart } from 'lucide-react';

const features = [
  {
    icon: Droplets,
    title: "Locally Sourced",
    description: "Fresh water bottled right here in the British Virgin Islands",
    highlight: "Local Quality"
  },
  {
    icon: Shield,
    title: "Premium Filtration",
    description: "Advanced purification process ensuring the purest taste",
    highlight: "99.9% Pure"
  },
  {
    icon: Truck,
    title: "Free Delivery",
    description: "Same-day delivery across all major BVI locations",
    highlight: "No Extra Cost"
  },
  {
    icon: Clock,
    title: "Reliable Service",
    description: "Consistent delivery schedule you can count on",
    highlight: "On Time"
  },
  {
    icon: Heart,
    title: "Community Focused",
    description: "Supporting local business and keeping BVI hydrated",
    highlight: "Local Pride"
  },
  {
    icon: Award,
    title: "Great Taste",
    description: "Crisp, clean water that beats the competition",
    highlight: "Premium Taste"
  }
];

const comparison = [
  { feature: "Local Bottling", aquavi: true, competition: false },
  { feature: "Free Delivery", aquavi: true, competition: false },
  { feature: "Same-Day Service", aquavi: true, competition: false },
  { feature: "BVI Community Support", aquavi: true, competition: false },
  { feature: "Premium Filtration", aquavi: true, competition: true },
  { feature: "Competitive Pricing", aquavi: true, competition: true }
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

        {/* Comparison Table */}
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-heading font-bold text-center mb-8">Aqua VI vs Competition</h3>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 pb-4 border-b border-border">
                  <div className="font-semibold text-foreground">Feature</div>
                  <div className="font-semibold text-primary text-center">Aqua VI</div>
                  <div className="font-semibold text-muted-foreground text-center">Others</div>
                </div>
                {comparison.map((item, index) => (
                  <div key={index} className="grid grid-cols-3 gap-4 py-3 border-b border-border/50 last:border-b-0">
                    <div className="text-foreground">{item.feature}</div>
                    <div className="text-center">
                      {item.aquavi ? (
                        <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                    <div className="text-center">
                      {item.competition ? (
                        <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}