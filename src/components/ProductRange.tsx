import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Droplets, Zap, Heart, Star } from 'lucide-react';
import { OrderModal } from '@/components/OrderModal';

const products = [
  {
    id: 1,
    name: 'Small',
    size: '8.45 FL OZ (250mL)',
    price: '$2.50',
    description: 'Perfect for on-the-go hydration',
    icon: Droplets,
    popular: false
  },
  {
    id: 2,
    name: 'Medium',
    size: '16.9 FL OZ (500mL)',
    price: '$4.50',
    description: 'Our signature size for daily hydration',
    icon: Droplets,
    popular: true
  },
  {
    id: 3,
    name: 'Large',
    size: '33.81 FL OZ (1000mL)',
    price: '$7.50',
    description: 'Ideal for workouts and extended activities',
    icon: Zap,
    popular: false
  },
  {
    id: 4,
    name: 'Extra Large',
    size: '50.72 FL OZ (1500mL)',
    price: '$10.50',
    description: 'Perfect for families and sharing',
    icon: Heart,
    popular: false
  }
];

export function ProductRange() {
  const [selectedProduct, setSelectedProduct] = useState(null);

  return (
    <section id="products" className="py-24 bg-gradient-subtle">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-heading font-bold text-foreground mb-4">
            Product Sizes
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the perfect size for your hydration needs. All bottles are locally sourced and delivered fresh.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                  <OrderModal>
                    <Button variant="premium" className="w-full">
                      Add to Order
                    </Button>
                  </OrderModal>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            All bottles are locally sourced and delivered fresh to your door
          </p>
          <div className="flex justify-center space-x-8 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Locally Bottled</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-primary rounded-full"></div>
              <span>Great Taste</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-secondary rounded-full"></div>
              <span>Free Delivery</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}