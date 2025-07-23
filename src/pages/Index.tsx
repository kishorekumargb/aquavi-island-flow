import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { ProductRange } from '@/components/ProductRange';
import { WhyAquavi } from '@/components/WhyAquavi';
import { TestimonialsCarousel } from '@/components/TestimonialsCarousel';
import { Contact } from '@/components/Contact';
import { Footer } from '@/components/Footer';
import { OrderModal } from '@/components/OrderModal';
import { Button } from '@/components/ui/button';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="space-y-0">
        <Hero />
        <ProductRange />
        <WhyAquavi />
        <TestimonialsCarousel />
        <Contact />
      </main>
      <Footer />
      
      {/* Floating Order Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <OrderModal>
          <Button variant="hero" size="lg" className="shadow-glow animate-pulse">
            Order Now
          </Button>
        </OrderModal>
      </div>
    </div>
  );
};

export default Index;
