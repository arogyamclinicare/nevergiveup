-- Database Schema for Milk Delivery App
-- Generated on: 2025-10-04 07:41:03.773799+00
-- Database: postgres
-- Version: PostgreSQL 17.6 on aarch64-unknown-linux-gnu, compiled by gcc (GCC) 13.2.0, 64-bit

-- ==============================================
-- TABLES
-- ==============================================

-- Shops table
CREATE TABLE IF NOT EXISTS shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_name TEXT,
  phone TEXT,
  address TEXT,
  route_number INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Delivery Boys table
CREATE TABLE IF NOT EXISTS delivery_boys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Milk Types table
CREATE TABLE IF NOT EXISTS milk_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price_per_packet NUMERIC(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deliveries table
CREATE TABLE IF NOT EXISTS deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  delivery_boy_id UUID REFERENCES delivery_boys(id) ON DELETE SET NULL,
  delivery_date DATE NOT NULL DEFAULT CURRENT_DATE,
  products JSONB NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'pay_tomorrow')),
  delivery_status TEXT DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'in_transit', 'delivered', 'failed')),
  is_archived BOOLEAN DEFAULT false,
  notes TEXT,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  delivery_boy_id UUID REFERENCES delivery_boys(id) ON DELETE SET NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC(10,2) NOT NULL,
  payment_type TEXT DEFAULT 'collection' CHECK (payment_type IN ('collection', 'refund', 'adjustment')),
  collected_by TEXT,
  notes TEXT,
  applied_to_deliveries JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shop Pending History table
CREATE TABLE IF NOT EXISTS shop_pending_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  original_delivery_id UUID REFERENCES deliveries(id) ON DELETE SET NULL,
  original_date DATE NOT NULL,
  pending_amount NUMERIC(10,2) NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity Log table
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
  delivery_boy_id UUID REFERENCES delivery_boys(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL,
  message TEXT NOT NULL,
  amount NUMERIC(10,2),
  delivery_date DATE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'staff')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('owner', 'staff')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- INDEXES
-- ==============================================

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_deliveries_shop_date ON deliveries(shop_id, delivery_date);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(payment_status, is_archived);
CREATE INDEX IF NOT EXISTS idx_payments_shop_date ON payments(shop_id, payment_date);
CREATE INDEX IF NOT EXISTS idx_activity_log_shop_date ON activity_log(shop_id, delivery_date);
CREATE INDEX IF NOT EXISTS idx_shop_pending_history_shop ON shop_pending_history(shop_id);

-- ==============================================
-- TRIGGERS
-- ==============================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables
CREATE TRIGGER update_shops_updated_at BEFORE UPDATE ON shops FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_delivery_boys_updated_at BEFORE UPDATE ON delivery_boys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_milk_types_updated_at BEFORE UPDATE ON milk_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_deliveries_updated_at BEFORE UPDATE ON deliveries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shop_pending_history_updated_at BEFORE UPDATE ON shop_pending_history FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON user_roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- ROW LEVEL SECURITY
-- ==============================================

-- Enable RLS on all tables
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_boys ENABLE ROW LEVEL SECURITY;
ALTER TABLE milk_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_pending_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- SAMPLE DATA
-- ==============================================

-- Insert sample shops
INSERT INTO shops (id, name, owner_name, phone, address, route_number) VALUES
('e01fd715-c698-49e2-8848-76d4aee8953a', 'Anita Milk Center', 'Anita Sharma', '9876543210', 'Market Street, Sector 1', 1),
('b602de58-1c08-4bd0-aa08-28bc9eccc148', 'Fresh Dairy', 'Rajesh Kumar', '9876543211', 'Market Street, Sector 3', 1),
('d81d9e77-9c6d-485d-b288-da066e88408c', 'Daily Milk Supply', 'Priya Singh', '9876543212', 'Market Street, Sector 2', 1),
('c3299bf8-331e-481a-8158-86d695e0d767', 'Milk Corner', 'Vikram Patel', '9876543213', 'Market Street, Sector 4', 1),
('6a731f11-09d6-4bcb-b7bc-32d19d47a8a0', 'banu kirana', 'suraj', '8208500495', 'Market Street, Sector 5', 1),
('f8e9d0c1-b2a3-4567-8901-234567890123', 'Pure Milk Shop', 'Ravi Kumar', '9876543214', 'Market Street, Sector 6', 1)
ON CONFLICT (id) DO NOTHING;

-- Insert sample delivery boys
INSERT INTO delivery_boys (id, name, phone) VALUES
('12c7056a-c423-445b-86af-2e6c60347e84', 'Rajesh', '9876543215'),
('cd59c654-f9d5-4fad-93cd-643d97af8ee0', 'Rahul Kumar', '9876543216'),
('60f96362-2f02-48f7-a69b-e67e397830c1', 'Rajesh Kumar', '9876543217'),
('5f98637b-01b0-42a3-bd0b-d41f343e7a50', 'Amit Singh', '9876543218'),
('4949c10a-1c42-4ed0-aa94-322bf7ce404b', 'Vikram Patel', '9876543219')
ON CONFLICT (id) DO NOTHING;

-- Insert sample milk types
INSERT INTO milk_types (id, name, price_per_packet) VALUES
('af328f92-9c47-43a1-9edc-99f7d7e225a5', 'Dahi 180ml - 18 inr', 18.00),
('b1e2f3g4-h5i6-j7k8-l9m0-n1o2p3q4r5s6', 'Toned Milk 500ml', 25.00),
('c2d3e4f5-g6h7-i8j9-k0l1-m2n3o4p5q6r7', 'Full Cream Milk 1L', 45.00),
('d3e4f5g6-h7i8-j9k0-l1m2-n3o4p5q6r7s8', 'Skimmed Milk 1L', 40.00),
('e4f5g6h7-i8j9-k0l1-m2n3-o4p5q6r7s8t9', 'Buffalo Milk 1L', 50.00)
ON CONFLICT (id) DO NOTHING;
