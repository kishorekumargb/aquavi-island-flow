-- Create testimonials table
CREATE TABLE public.testimonials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  review TEXT NOT NULL,
  avatar TEXT,
  verified BOOLEAN DEFAULT true,
  order_type TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

-- Create policies for testimonials
CREATE POLICY "Allow all for authenticated users" 
ON public.testimonials 
FOR ALL 
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_testimonials_updated_at
BEFORE UPDATE ON public.testimonials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add business_hours to site_settings table if it doesn't exist
INSERT INTO public.site_settings (setting_key, setting_value) VALUES 
('business_hours_monday_friday', '8:00 AM - 6:00 PM'),
('business_hours_saturday', '9:00 AM - 4:00 PM'),
('business_hours_sunday', 'Emergency Only'),
('delivery_hours', '3:30 PM - 5:30 PM'),
('email', 'info@aquavi.com')
ON CONFLICT (setting_key) DO NOTHING;

-- Insert default testimonials
INSERT INTO public.testimonials (name, location, rating, review, verified, order_type) VALUES
('Marina Rodriguez', 'Road Town, Tortola', 5, 'AQUAVI has completely changed our office hydration game. The taste is incredible and the delivery service is always punctual. We''ve been subscribers for 8 months now.', true, 'Office Subscription'),
('James Thompson', 'Spanish Town, Virgin Gorda', 5, 'As a yacht captain, I demand the highest quality water for my guests. AQUAVI delivers premium quality that matches our luxury standards perfectly.', true, 'Luxury Service'),
('Dr. Sarah Chen', 'The Valley, Virgin Gorda', 5, 'The mineral composition in AQUAVI is exceptional. As a healthcare professional, I recommend it to patients for optimal hydration and taste.', true, 'Personal Use'),
('Roberto Silva', 'West End, Tortola', 5, 'Been ordering the family size bottles for over a year. Kids love the taste and we love supporting a local BVI business that cares about quality.', true, 'Family Plan'),
('Lisa Williams', 'Cane Garden Bay, Tortola', 5, 'The subscription service is so convenient! Never have to worry about running out of premium water. Customer service is outstanding too.', true, 'Monthly Subscription');