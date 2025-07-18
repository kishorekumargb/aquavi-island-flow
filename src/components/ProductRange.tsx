import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Droplets, Zap, Heart, Star } from 'lucide-react';

const products = [
  {
    id: 1,
    name: '8 oz Premium',
    size: '8 oz',
    price: '$3.99',
    description: 'Perfect for on-the-go hydration',
    icon: Droplets,
    popular: false,
    minerals: {
      calcium: '15 mg/L',
      magnesium: '8 mg/L',
      potassium: '2 mg/L',
      ph: '7.8'
    }
  },
  {
    id: 2,
    name: '16 oz Classic',
    size: '16 oz',
    price: '$6.99',
    description: 'Our signature size for daily hydration',
    icon: Droplets,
    popular: true,
    minerals: {
      calcium: '15 mg/L',
      magnesium: '8 mg/L',
      potassium: '2 mg/L',
      ph: '7.8'
    }
  },
  {
    id: 3,
    name: '32 oz Grande',
    size: '32 oz',
    price: '$12.99',
    description: 'Ideal for workouts and extended activities',
    icon: Zap,
    popular: false,
    minerals: {
      calcium: '15 mg/L',
      magnesium: '8 mg/L',
      potassium: '2 mg/L',
      ph: '7.8'
    }
  },
  {
    id: 4,
    name: '50 oz Family',
    size: '50 oz',
    price: '$19.99',
    description: 'Perfect for families and sharing',
    icon: Heart,
    popular: false,
    minerals: {
      calcium: '15 mg/L',
      magnesium: '8 mg/L',
      potassium: '2 mg/L',
      ph: '7.8'
    }
  },
  {
    id: 5,
    name: '5 Gallon Office',
    size: '5 Gal',
    price: '$24.99',
    description: 'Commercial grade for offices and events',
    icon: Star,
    popular: false,
    minerals: {
      calcium: '15 mg/L',
      magnesium: '8 mg/L',
      potassium: '2 mg/L',
      ph: '7.8'
    }
  }
];

export function ProductRange() {
  const [selectedProduct, setSelectedProduct] = useState(null);

  return (
    <section id="products" className="py-24 bg-gradient-subtle">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-heading font-bold text-foreground mb-4">
            Premium Product Range
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From personal hydration to office solutions, AQUAVI offers the perfect size for every need.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {products.map((product) => {
            const IconComponent = product.icon;
            return (
              <Card key={product.id} className="relative group hover:shadow-elegant transition-smooth">
                {product.popular && (
                  <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                )}
                
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 bg-gradient-hero rounded-full flex items-center justify-center mx-auto mb-4 group-hover:shadow-glow transition-smooth">
                    <IconComponent className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-xl font-heading">{product.name}</CardTitle>
                  <CardDescription>{product.description}</CardDescription>
                </CardHeader>

                <CardContent className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">{product.price}</div>
                  <div className="text-sm text-muted-foreground">{product.size}</div>
                </CardContent>

                <CardFooter className="flex flex-col space-y-3">
                  <Button variant="premium" className="w-full">
                    Add to Order
                  </Button>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full text-primary">
                        View Mineral Profile
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="font-heading">
                          {product.name} - Mineral Composition
                        </DialogTitle>
                        <DialogDescription>
                          Laboratory-certified mineral profile and purity analysis
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-muted/50 p-4 rounded-lg">
                            <div className="text-sm text-muted-foreground">Calcium</div>
                            <div className="text-lg font-semibold">{product.minerals.calcium}</div>
                          </div>
                          <div className="bg-muted/50 p-4 rounded-lg">
                            <div className="text-sm text-muted-foreground">Magnesium</div>
                            <div className="text-lg font-semibold">{product.minerals.magnesium}</div>
                          </div>
                          <div className="bg-muted/50 p-4 rounded-lg">
                            <div className="text-sm text-muted-foreground">Potassium</div>
                            <div className="text-lg font-semibold">{product.minerals.potassium}</div>
                          </div>
                          <div className="bg-muted/50 p-4 rounded-lg">
                            <div className="text-sm text-muted-foreground">pH Level</div>
                            <div className="text-lg font-semibold">{product.minerals.ph}</div>
                          </div>
                        </div>
                        
                        <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                          <div className="flex items-center space-x-2 mb-2">
                            <Droplets className="w-5 h-5 text-primary" />
                            <span className="font-semibold">Purity Guarantee</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Third-party laboratory tested for 99.9% purity. Sourced from pristine British Virgin Islands springs.
                          </p>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            All products are laboratory-certified and sourced from pristine BVI springs
          </p>
          <div className="flex justify-center space-x-8 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Third-party Lab Tested</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-primary rounded-full"></div>
              <span>BVI Sourced</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-secondary rounded-full"></div>
              <span>99.9% Pure</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}