import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: 'Marina Rodriguez',
    location: 'Road Town, Tortola',
    rating: 5,
    review: 'AQUAVI has completely changed our office hydration game. The taste is incredible and the delivery service is always punctual. We\'ve been subscribers for 8 months now.',
    avatar: '/api/placeholder/64/64',
    verified: true,
    orderType: 'Office Subscription'
  },
  {
    id: 2,
    name: 'James Thompson',
    location: 'Spanish Town, Virgin Gorda',
    rating: 5,
    review: 'As a yacht captain, I demand the highest quality water for my guests. AQUAVI delivers premium quality that matches our luxury standards perfectly.',
    avatar: '/api/placeholder/64/64',
    verified: true,
    orderType: 'Luxury Service'
  },
  {
    id: 3,
    name: 'Dr. Sarah Chen',
    location: 'The Valley, Virgin Gorda',
    rating: 5,
    review: 'The mineral composition in AQUAVI is exceptional. As a healthcare professional, I recommend it to patients for optimal hydration and taste.',
    avatar: '/api/placeholder/64/64',
    verified: true,
    orderType: 'Personal Use'
  },
  {
    id: 4,
    name: 'Roberto Silva',
    location: 'West End, Tortola',
    rating: 5,
    review: 'Been ordering the family size bottles for over a year. Kids love the taste and we love supporting a local BVI business that cares about quality.',
    avatar: '/api/placeholder/64/64',
    verified: true,
    orderType: 'Family Plan'
  },
  {
    id: 5,
    name: 'Lisa Williams',
    location: 'Cane Garden Bay, Tortola',
    rating: 5,
    review: 'The subscription service is so convenient! Never have to worry about running out of premium water. Customer service is outstanding too.',
    avatar: '/api/placeholder/64/64',
    verified: true,
    orderType: 'Monthly Subscription'
  }
];

export function TestimonialsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (isAutoPlaying) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % testimonials.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isAutoPlaying]);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToTestimonial = (index) => {
    setCurrentIndex(index);
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'
        }`}
      />
    ));
  };

  return (
    <section id="testimonials" className="py-24 bg-gradient-subtle">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-heading font-bold text-foreground mb-4">
            Customer Testimonials
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover why customers across the BVI trust AQUAVI for their premium water needs.
          </p>
        </div>

        <div className="relative max-w-4xl mx-auto">
          {/* Main Testimonial Display */}
          <div
            className="relative overflow-hidden"
            onMouseEnter={() => setIsAutoPlaying(false)}
            onMouseLeave={() => setIsAutoPlaying(true)}
          >
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {testimonials.map((testimonial) => (
                <div key={testimonial.id} className="w-full flex-shrink-0 px-4">
                  <Card className="shadow-elegant hover:shadow-premium transition-smooth">
                    <CardContent className="p-8">
                      <div className="flex items-start space-x-6">
                        {/* Quote Icon */}
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-gradient-hero rounded-full flex items-center justify-center">
                            <Quote className="w-6 h-6 text-primary-foreground" />
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                          {/* Rating */}
                          <div className="flex items-center space-x-1 mb-4">
                            {renderStars(testimonial.rating)}
                          </div>

                          {/* Review Text */}
                          <blockquote className="text-lg text-foreground leading-relaxed mb-6 italic">
                            "{testimonial.review}"
                          </blockquote>

                          {/* Customer Info */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <Avatar className="w-12 h-12">
                                <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                  {testimonial.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="font-semibold text-foreground">{testimonial.name}</span>
                                  {testimonial.verified && (
                                    <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                                      Verified
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground">{testimonial.location}</div>
                              </div>
                            </div>
                            <Badge variant="outline" className="border-primary/30 text-primary">
                              {testimonial.orderType}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-center space-x-4 mt-8">
            <Button
              variant="outline"
              size="icon"
              onClick={prevTestimonial}
              className="rounded-full border-primary/30 hover:bg-primary/5"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            {/* Dots Indicator */}
            <div className="flex space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-smooth ${
                    index === currentIndex ? 'bg-primary' : 'bg-muted-foreground/30'
                  }`}
                />
              ))}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={nextTestimonial}
              className="rounded-full border-primary/30 hover:bg-primary/5"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Trust Statistics */}
          <div className="grid grid-cols-3 gap-8 mt-12 text-center">
            <div>
              <div className="text-3xl font-bold text-primary mb-2">500+</div>
              <div className="text-sm text-muted-foreground">Happy Customers</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-secondary mb-2">4.9/5</div>
              <div className="text-sm text-muted-foreground">Average Rating</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">99%</div>
              <div className="text-sm text-muted-foreground">Would Recommend</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}