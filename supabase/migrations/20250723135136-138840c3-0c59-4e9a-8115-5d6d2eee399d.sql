-- Create orders table for tracking customer orders
CREATE TABLE public.orders (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_number TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    customer_phone TEXT,
    delivery_address TEXT NOT NULL,
    items JSONB NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in-transit', 'delivered', 'cancelled')),
    payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table for product management
CREATE TABLE public.products (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    size TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    description TEXT,
    image_url TEXT,
    stock INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create site_settings table for website configuration
CREATE TABLE public.site_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key TEXT NOT NULL UNIQUE,
    setting_value TEXT,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create admin_users table for admin authentication
CREATE TABLE public.admin_users (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access (will need proper authentication)
CREATE POLICY "Allow all for authenticated users" ON public.orders FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.products FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.site_settings FOR ALL USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.admin_users FOR ALL USING (true);

-- Insert default products
INSERT INTO public.products (name, size, price, description, stock) VALUES
('Small', '8.45 FL OZ (250mL)', 2.50, 'Perfect for on-the-go hydration', 150),
('Medium', '16.9 FL OZ (500mL)', 4.50, 'Our signature size for daily hydration', 200),
('Large', '33.81 FL OZ (1000mL)', 7.50, 'Ideal for workouts and extended activities', 120),
('Extra Large', '50.72 FL OZ (1500mL)', 10.50, 'Perfect for families and sharing', 80);

-- Insert default site settings
INSERT INTO public.site_settings (setting_key, setting_value) VALUES
('business_phone', '1-499-4611'),
('business_address', 'MoneyGram, Flemming Street, Road Town Tortola'),
('delivery_hours', '3:30 PM - 5:30 PM'),
('hero_image_url', '/src/assets/aqua-vi-hero-banner.jpg');

-- Insert default admin user (password will be hashed in application)
INSERT INTO public.admin_users (email, password_hash, name) VALUES
('kkumar@mwmglobalhld.com', '$2a$10$placeholder', 'Admin User');

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_site_settings_updated_at
    BEFORE UPDATE ON public.site_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at
    BEFORE UPDATE ON public.admin_users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();