import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Droplets, Zap, Heart, Star } from 'lucide-react';
import { OrderModal } from '@/components/OrderModal';
import { supabase } from '@/integrations/supabase/client';

interface Product {
  id: string;
  name: string;
  size: string;
  price: number;
  description: string | null;
  image_url: string | null;
  stock: number | null;
  is_active: boolean;
}

export function ProductRange() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
    
    // Set up real-time subscription for product changes
    const channel = supabase
      .channel('products-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'products' 
        }, 
        (payload) => {
          console.log('Product change detected:', payload);
          fetchProducts(); // Refresh products when changes occur
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
    <section id="products" className="py-12 bg-gradient-subtle">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <div className="w-8 h-8 bg-primary/20 rounded-full animate-pulse mx-auto mb-4"></div>
            <p>Loading products...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="products" className="py-16 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-4xl lg:text-5xl font-heading font-bold text-foreground mb-4">
            Product Sizes
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the perfect size for your hydration needs. All bottles are locally sourced and delivered fresh.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product, index) => {
            const isPopular = index === 1; // Make second product popular by default
            const hasLimitedStock = product.stock !== null && product.stock !== undefined;
            const isOutOfStock = hasLimitedStock && product.stock <= 0;
            const isLowStock = hasLimitedStock && product.stock > 0 && product.stock < 10;

            return (
              <Card key={product.id} className="relative group hover:shadow-elegant transition-smooth">
                {isPopular && (
                  <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                )}

                <CardHeader className="text-center pb-4">
                  <div className="flex items-center justify-center mb-4 bg-grey">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={`Aqua VI ${product.name}`}
                        className="w-32 h-48 object-cover rounded-lg"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-32 h-48 bg-primary/10 flex items-center justify-center rounded-lg">
                        <Droplets className="w-12 h-12 text-primary" />
                      </div>
                    )}
                  </div>
                  <CardTitle className="text-xl font-heading">{product.name}</CardTitle>
                  <CardDescription>{product.description ?? ''}</CardDescription>
                </CardHeader>

                <CardContent className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">${product.price.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">{product.size}</div>
                  {isLowStock && (
                    <Badge variant="destructive" className="mt-2">
                      Low Stock ({product.stock} left)
                    </Badge>
                  )}
                </CardContent>

                <CardFooter className="flex flex-col space-y-3">
                  <OrderModal>
                    <Button variant="premium" className="w-full" disabled={isOutOfStock}>
                      {isOutOfStock ? 'Out of Stock' : 'Add to Order'}
                    </Button>
                  </OrderModal>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            All bottles are locally sourced and delivered fresh to your door
          </p>
        </div>
      </div>
    </section>
  );
}
