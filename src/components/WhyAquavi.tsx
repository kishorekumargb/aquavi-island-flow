import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Award, Droplets, Truck, Shield, Heart } from 'lucide-react';

const faqData = [
  {
    id: 'difference',
    question: 'How is AQUAVI different?',
    answer: 'AQUAVI stands apart with our unique combination of BVI-sourced spring water, third-party laboratory certification, and concierge-level delivery service. Unlike mass-produced brands, we maintain strict quality control with pH-balanced mineral composition and 99.9% purity guarantee.',
    highlights: [
      'Third-party lab certified for purity',
      'Optimal mineral composition for health',
      'Local BVI sourcing with island pride',
      'Concierge-level delivery reliability'
    ]
  },
  {
    id: 'delivery',
    question: 'Where do you deliver?',
    answer: 'We proudly serve all major areas across the British Virgin Islands, including Road Town, Spanish Town, The Valley, and surrounding communities. Our delivery zone covers Tortola, Virgin Gorda, and select areas of Anegada and Jost Van Dyke.',
    highlights: [
      'Tortola - Complete coverage',
      'Virgin Gorda - Major settlements',
      'Anegada - Select areas',
      'Jost Van Dyke - Main harbor areas'
    ]
  },
  {
    id: 'trust',
    question: 'Why trust AQUAVI?',
    answer: 'AQUAVI has built its reputation on transparency, quality, and reliability. We provide complete lab reports, maintain ISO-certified bottling facilities, and have served the BVI community with zero quality incidents since our founding.',
    highlights: [
      'ISO-certified bottling facility',
      'Complete transparency with lab reports',
      'Zero quality incidents to date',
      '4.9/5 customer satisfaction rating'
    ]
  }
];

const serviceAreas = [
  { name: 'Road Town', coverage: '100%', icon: MapPin },
  { name: 'Spanish Town', coverage: '100%', icon: MapPin },
  { name: 'The Valley', coverage: '100%', icon: MapPin },
  { name: 'West End', coverage: '95%', icon: MapPin }
];

const certifications = [
  { name: 'ISO 22000', icon: Award, description: 'Food Safety Management' },
  { name: 'NSF Certified', icon: Shield, description: 'Water Quality Standards' },
  { name: 'HACCP', icon: Droplets, description: 'Hazard Analysis Critical Control' },
  { name: 'BVI Health Approved', icon: Heart, description: 'Local Health Authority' }
];

export function WhyAquavi() {
  return (
    <section id="why-aquavi" className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-heading font-bold text-foreground mb-4">
            Why Choose AQUAVI?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover what makes AQUAVI the premium choice for discerning customers across the British Virgin Islands.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* FAQ Section */}
          <div>
            <h3 className="text-2xl font-heading font-semibold mb-6">Frequently Asked Questions</h3>
            <Accordion type="single" collapsible className="space-y-4">
              {faqData.map((item) => (
                <AccordionItem key={item.id} value={item.id} className="border border-border rounded-lg px-6">
                  <AccordionTrigger className="text-left font-heading font-medium hover:text-primary">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pb-6">
                    <p className="text-muted-foreground leading-relaxed">
                      {item.answer}
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      {item.highlights.map((highlight, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span className="text-sm font-medium">{highlight}</span>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Service Areas & Certifications */}
          <div className="space-y-8">
            {/* Interactive Service Map */}
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
                      <Badge variant="secondary">{area.coverage} Coverage</Badge>
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

            {/* Certifications */}
            <Card>
              <CardContent className="p-6">
                <h4 className="text-xl font-heading font-semibold mb-4 flex items-center">
                  <Award className="w-5 h-5 mr-2 text-primary" />
                  Certifications & Standards
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {certifications.map((cert, index) => {
                    const IconComponent = cert.icon;
                    return (
                      <div key={index} className="text-center p-4 bg-muted/50 rounded-lg hover:bg-primary/5 transition-smooth">
                        <div className="w-12 h-12 bg-gradient-hero rounded-full flex items-center justify-center mx-auto mb-2">
                          <IconComponent className="w-6 h-6 text-primary-foreground" />
                        </div>
                        <div className="font-semibold text-sm">{cert.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">{cert.description}</div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Trust Indicators */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">99.9%</div>
                <div className="text-sm text-muted-foreground">Purity Level</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-secondary">4.9/5</div>
                <div className="text-sm text-muted-foreground">Customer Rating</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">24/7</div>
                <div className="text-sm text-muted-foreground">Quality Monitoring</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}