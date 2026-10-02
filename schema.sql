-- =======================================================
-- SADGURU TYRES & MOBILITY SOLUTIONS - COMPLETE POSTGRES SCHEMA
-- Run this script in the Supabase SQL Editor:
-- https://app.supabase.com -> Project -> SQL Editor
-- =======================================================

-- 1. TABLE: tyre_products (Tyre Inventory Catalog)
CREATE TABLE IF NOT EXISTS public.tyre_products (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  brand VARCHAR(100) NOT NULL,
  vehicle_type VARCHAR(50) NOT NULL DEFAULT 'Cars',
  tyre_type VARCHAR(100) NOT NULL DEFAULT 'All-Season',
  performance_level VARCHAR(100) DEFAULT 'High Performance',
  width VARCHAR(20) DEFAULT '225',
  profile VARCHAR(20) DEFAULT '45',
  rim_size VARCHAR(20) DEFAULT '17',
  category VARCHAR(100) DEFAULT 'Passenger Tyre',
  badge VARCHAR(100) DEFAULT 'Featured',
  rating NUMERIC(3,2) DEFAULT 4.8,
  reviews_count INTEGER DEFAULT 1,
  image TEXT DEFAULT '/images/tyre_sport.jpg',
  price_usd NUMERIC(10,2) DEFAULT 195.00,
  price_inr NUMERIC(10,2) NOT NULL DEFAULT 12500.00,
  stock INTEGER DEFAULT 45,
  tagline TEXT,
  description TEXT,
  specs JSONB DEFAULT '{}'::jsonb,
  visual_specs JSONB DEFAULT '{}'::jsonb,
  available_sizes TEXT[] DEFAULT ARRAY[]::TEXT[],
  highlights TEXT[] DEFAULT ARRAY[]::TEXT[],
  date_added DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tyre_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to tyre_products" ON public.tyre_products FOR SELECT USING (true);
CREATE POLICY "Allow full access for service_role to tyre_products" ON public.tyre_products FOR ALL USING (true);

-- Insert All 12 Real Tyre Products
INSERT INTO public.tyre_products (id, name, brand, vehicle_type, tyre_type, performance_level, width, profile, rim_size, category, badge, rating, reviews_count, image, price_usd, price_inr, stock, tagline, description, specs, visual_specs, available_sizes)
VALUES 
  ('apex-sport-pro', 'ApexSport Pro 4S', 'Sadguru Apex', 'Cars', 'Track / Racing', 'Ultra-High Performance', '245', '40', '19', 'Ultra-High Performance', 'Track Master', 4.90, 148, '/images/tyre_sport.jpg', 249.00, 18900.00, 45, 'Track-bred grip engineered for high-output sports cars.', 'Engineered with our proprietary motorsport dual-compound matrix.', '{"wetGrip":"A","fuelEfficiency":"B","noiseLevel":"68 dB","speedRating":"Y (300 km/h)","warranty":"50,000 Miles"}'::jsonb, '{"grip":{"score":99,"label":"Maximum Adhesion"},"mileage":{"score":85,"label":"50,000 Miles"}}'::jsonb, ARRAY['225/45 R18', '245/40 R19', '255/35 R20', '275/35 R20', '285/30 R21']),
  ('grand-touring-gt', 'GrandTouring GT Silent', 'Sadguru GT', 'Cars', 'All-Season', 'Grand Touring', '245', '45', '19', 'All-Season Touring', 'Best Seller', 4.95, 312, '/images/tyre_touring.jpg', 195.00, 14500.00, 60, 'Whisper-quiet luxury cruising with all-weather confidence.', 'Crafted for executive sedans and grand tourers.', '{"wetGrip":"A","fuelEfficiency":"A","noiseLevel":"66 dB","speedRating":"W (270 km/h)","warranty":"80,000 Miles"}'::jsonb, '{"comfort":{"score":99,"label":"Velveteen Ride"},"noise":{"score":97,"label":"66 dB Silent Foam"}}'::jsonb, ARRAY['205/55 R16', '215/55 R17', '225/50 R18', '235/45 R18', '245/45 R19']),
  ('terra-force-at', 'TerraForce All-Terrain X', 'Sadguru Terra', 'SUVs', 'All-Terrain', 'All-Terrain', '275', '65', '18', '4x4 & Off-Road', 'Heavy Duty', 4.85, 220, '/images/tyre_offroad.jpg', 235.00, 17500.00, 35, 'Unstoppable off-road ruggedness with refined highway manners.', 'Forged for rugged terrain, rocky ascents, and muddy trails.', '{"wetGrip":"B","fuelEfficiency":"C","noiseLevel":"71 dB","warranty":"65,000 Miles"}'::jsonb, '{"grip":{"score":94,"label":"Rock & Mud Grip"},"durability":{"score":99,"label":"Kevlar Shield"}}'::jsonb, ARRAY['265/70 R16', '265/65 R17', '275/65 R18', '275/60 R20']),
  ('volt-drive-ev', 'VoltDrive EV AeroMax', 'Sadguru Volt', 'Cars', 'EV Optimized', 'Eco EV', '255', '40', '20', 'Electric Vehicle EV', 'Range Booster', 4.90, 185, '/images/tyre_ev.jpg', 215.00, 16100.00, 50, 'Low rolling resistance tuned specifically for instant torque.', 'Electric drivetrains deliver instantaneous torque and battery weight.', '{"wetGrip":"A","fuelEfficiency":"A+","noiseLevel":"65 dB","warranty":"60,000 Miles"}'::jsonb, '{"noise":{"score":99,"label":"65 dB Ultra Silent"},"durability":{"score":93,"label":"High Load (HL)"}}'::jsonb, ARRAY['235/45 R18', '235/40 R19', '255/45 R19', '255/40 R20']),
  ('apex-moto-track-gp', 'ApexMoto Track GP', 'Sadguru Moto', 'Bikes', 'Track / Racing', 'Track Day', '190', '55', '17', 'Ultra-High Performance', '60° Lean Angle', 4.96, 88, '/images/tyre_bike.jpg', 185.00, 13900.00, 40, 'MotoGP-inspired dual-compound racing tyre for extreme lean angles.', 'Engineered on World Superbike tracks.', '{"wetGrip":"A","speedRating":"(W) 270+ km/h","warranty":"25,000 KM"}'::jsonb, '{"grip":{"score":99,"label":"Full 60° Lean Grip"}}'::jsonb, ARRAY['120/70 ZR17', '160/60 ZR17', '180/55 ZR17', '190/55 ZR17']),
  ('terra-rider-rally-adv', 'TerraRider Rally ADV', 'Sadguru Moto', 'Bikes', 'All-Terrain', 'All-Terrain', '150', '70', '18', '4x4 & Off-Road', '50/50 ADV', 4.88, 104, '/images/tyre_bike_adv.jpg', 165.00, 12400.00, 42, '50/50 Dual-Sport adventure tyre built for Dakar sands.', 'The quintessential globe-trotting adventure tyre.', '{"wetGrip":"B","speedRating":"V (240 km/h)","warranty":"30,000 KM"}'::jsonb, '{"durability":{"score":98,"label":"Thorn Proof"}}'::jsonb, ARRAY['90/90-21', '110/80 R19', '150/70 R17', '150/70 R18']),
  ('winter-grip-ice', 'WinterGrip IceClaw 2', 'Sadguru Apex', 'Cars', 'Winter', 'Ultra-High Performance', '245', '45', '18', 'Winter / Extreme Cold', 'Arctic Tested', 4.92, 96, '/images/tyre_winter.jpg', 240.00, 17900.00, 30, 'Unrivaled braking safety on black ice, slush, and alpine snow.', 'Maintains rubber elasticity even at -35°C.', '{"wetGrip":"A","speedRating":"V (240 km/h)","warranty":"45,000 Miles"}'::jsonb, '{"grip":{"score":98,"label":"Sub-Zero Biting Edges"}}'::jsonb, ARRAY['205/55 R16', '225/45 R17', '245/45 R18', '255/40 R19']),
  ('grand-touring-suv-max', 'GrandTouring SUV Max', 'Sadguru GT', 'SUVs', 'All-Season', 'Grand Touring', '275', '45', '21', 'All-Season Touring', 'Luxury SUV', 4.91, 165, '/images/tyre_suv_max.jpg', 255.00, 19200.00, 40, 'High-load luxury touring tyre tailored for performance SUVs.', 'Crafted specifically for modern luxury performance SUVs.', '{"wetGrip":"A","speedRating":"Y (300 km/h)","warranty":"70,000 Miles"}'::jsonb, '{"comfort":{"score":98,"label":"Executive Quiet"}}'::jsonb, ARRAY['255/50 R19', '275/45 R20', '285/40 R22', '295/35 R22']),
  ('apex-moto-corsa-gp', 'ApexMoto Corsa GP', 'Sadguru Apex Moto', 'Bikes', 'Track & Superbike', 'Ultra-High Performance', '120', '70', '17', 'Superbike & Motorcycle', 'Superbike Spec', 4.98, 194, '/images/tyre_bike_corsa.jpg', 180.00, 13500.00, 45, 'MotoGP dual-compound radial tyre for extreme lean angles.', 'Engineered with technology derived directly from world superbike racing.', '{"wetGrip":"A","speedRating":"(W) 270+ km/h","warranty":"25,000 KM"}'::jsonb, '{"grip":{"score":99,"label":"58° Lean Angle"}}'::jsonb, ARRAY['110/70 R17', '120/70 ZR17', '160/60 ZR17', '190/55 ZR17']),
  ('terra-moto-adv-overland', 'TerraMoto ADV Overland', 'Sadguru Terra Moto', 'Bikes', 'Dual Sport / ADV', 'All-Terrain Adventure', '110', '80', '19', 'Superbike & Motorcycle', 'ADV Explorer', 4.92, 115, '/images/tyre_bike.jpg', 165.00, 12200.00, 38, 'Heavy-duty 80/20 adventure motorcycle tyre built for trail and highway.', 'Designed for adventure touring motorcyclists.', '{"wetGrip":"A","speedRating":"V (240 km/h)","warranty":"30,000 KM"}'::jsonb, '{"mileage":{"score":96,"label":"30,000 KM"}}'::jsonb, ARRAY['100/90 R19', '110/80 R19', '150/70 R17', '170/60 R17']),
  ('terra-force-pro-at', 'TerraForce Pro Extreme A/T', 'Sadguru 4x4', 'SUVs', 'All-Terrain 4x4', 'Extreme Off-Road', '265', '65', '17', '4x4 & Off-Road', 'Extreme Terrain', 4.95, 178, '/images/tyre_suv_at.jpg', 235.00, 17800.00, 45, 'Heavy-duty all-terrain tire built for rugged expeditions.', 'Engineered for serious 4x4 enthusiasts.', '{"wetGrip":"A","speedRating":"T (190 km/h)","warranty":"65,000 Miles"}'::jsonb, '{"durability":{"score":99,"label":"Armor Sidewall"}}'::jsonb, ARRAY['245/70 R16', '265/65 R17', '275/65 R18', '285/60 R18']),
  ('apex-sport-suv-gt', 'ApexSport SUV Performance', 'Sadguru Apex', 'SUVs', 'High-Performance SUV', 'Ultra-High Performance', '275', '45', '20', 'Ultra-High Performance', 'Track SUV', 4.96, 142, '/images/tyre_touring.jpg', 265.00, 19900.00, 40, 'Track-inspired cornering precision and wet braking for performance SUVs.', 'Developed specifically for high-output performance SUVs.', '{"wetGrip":"A","speedRating":"Y (300 km/h)","warranty":"50,000 Miles"}'::jsonb, '{"grip":{"score":98,"label":"Supercar-Level Grip"}}'::jsonb, ARRAY['255/50 R19', '275/45 R20', '285/40 R22', '295/35 R22'])
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  brand = EXCLUDED.brand,
  price_inr = EXCLUDED.price_inr,
  price_usd = EXCLUDED.price_usd,
  stock = EXCLUDED.stock,
  tagline = EXCLUDED.tagline,
  description = EXCLUDED.description,
  specs = EXCLUDED.specs,
  visual_specs = EXCLUDED.visual_specs,
  available_sizes = EXCLUDED.available_sizes;


-- 2. TABLE: partner_brands (Manufacturer Brand Partners)
CREATE TABLE IF NOT EXISTS public.partner_brands (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  logo TEXT NOT NULL,
  tagline TEXT,
  status VARCHAR(50) DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.partner_brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to partner_brands" ON public.partner_brands FOR SELECT USING (true);
CREATE POLICY "Allow full access for service_role to partner_brands" ON public.partner_brands FOR ALL USING (true);

INSERT INTO public.partner_brands (id, name, logo, tagline, status)
VALUES 
  ('yokohama', 'Yokohama', '/images/YOKOHAMA.png', 'Japan''s Premium Tyres', 'Active'),
  ('mrf', 'MRF Tyres', '/images/MRF tyres.png', 'India''s No.1 Tyre Brand', 'Active'),
  ('ceat', 'CEAT', '/images/CEAT tyres.png', 'Confidence for Every Ride', 'Active'),
  ('goodyear', 'Goodyear', '/images/Good Year.jpg', 'Global Innovation Leader', 'Active'),
  ('bridgestone', 'Bridgestone', '/images/bridgestone.png', 'World''s #1 Premium Tyre', 'Active'),
  ('michelin', 'Michelin', '/images/mechalin.jpg', 'Performance & Innovation', 'Active')
ON CONFLICT (id) DO NOTHING;


-- 3. TABLE: service_bookings (Customer Appointments)
CREATE TABLE IF NOT EXISTS public.service_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name VARCHAR(255) NOT NULL,
  car_model VARCHAR(255) DEFAULT 'Standard Vehicle',
  service_name VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  time_slot VARCHAR(100) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'Pending',
  total_inr NUMERIC(10,2) DEFAULT 1850.00,
  tyre_id VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.service_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public insert & read for service_bookings" ON public.service_bookings FOR ALL USING (true);

INSERT INTO public.service_bookings (customer_name, car_model, service_name, date, time_slot, phone, status, total_inr)
VALUES 
  ('Rajesh Sharma', 'Honda City (2022)', '4-Wheel Alignment & Balancing', '2026-10-02', '11:00 AM', '+91 98220 44556', 'Confirmed', 1850.00),
  ('Vikramaditya Deshmukh', 'Toyota Fortuner', 'Run-Flat Tyre Replacement', '2026-10-03', '02:30 PM', '+91 94230 11223', 'Pending', 24500.00),
  ('Amitabh Kulkarni', 'Hyundai Creta', 'Nitrogen Air Flush & Inspection', '2026-10-04', '04:00 PM', '+91 98900 99887', 'Confirmed', 850.00);


-- 4. TABLE: quote_inquiries (Wholesale Quotes)
CREATE TABLE IF NOT EXISTS public.quote_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tyre_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  company_name VARCHAR(255),
  total_formatted VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.quote_inquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public insert & read for quote_inquiries" ON public.quote_inquiries FOR ALL USING (true);

INSERT INTO public.quote_inquiries (tyre_name, quantity, email, company_name, total_formatted)
VALUES 
  ('ApexSport Pro 4S', 12, 'fleet@maharashtratravels.com', 'Maharashtra Travels Ltd', '₹2,26,800'),
  ('TerraGrip All-Terrain X', 8, 'purchasing@westernsafari.in', 'Western Safari Tours', '₹1,27,200');
