-- Sample Data for Milk Delivery App
-- Generated on: 2025-10-04 07:41:03.773799+00
-- Database: postgres
-- Version: PostgreSQL 17.6

-- ==============================================
-- SAMPLE SHOPS
-- ==============================================

INSERT INTO shops (id, name, owner_name, phone, address, route_number) VALUES
('e01fd715-c698-49e2-8848-76d4aee8953a', 'Anita Milk Center', 'Anita Sharma', '9876543210', 'Market Street, Sector 1', 1),
('b602de58-1c08-4bd0-aa08-28bc9eccc148', 'Fresh Dairy', 'Rajesh Kumar', '9876543211', 'Market Street, Sector 3', 1),
('d81d9e77-9c6d-485d-b288-da066e88408c', 'Daily Milk Supply', 'Priya Singh', '9876543212', 'Market Street, Sector 2', 1),
('c3299bf8-331e-481a-8158-86d695e0d767', 'Milk Corner', 'Vikram Patel', '9876543213', 'Market Street, Sector 4', 1),
('6a731f11-09d6-4bcb-b7bc-32d19d47a8a0', 'banu kirana', 'suraj', '8208500495', 'Market Street, Sector 5', 1),
('f8e9d0c1-b2a3-4567-8901-234567890123', 'Pure Milk Shop', 'Ravi Kumar', '9876543214', 'Market Street, Sector 6', 1)
ON CONFLICT (id) DO NOTHING;

-- ==============================================
-- SAMPLE DELIVERY BOYS
-- ==============================================

INSERT INTO delivery_boys (id, name, phone) VALUES
('12c7056a-c423-445b-86af-2e6c60347e84', 'Rajesh', '9876543215'),
('cd59c654-f9d5-4fad-93cd-643d97af8ee0', 'Rahul Kumar', '9876543216'),
('60f96362-2f02-48f7-a69b-e67e397830c1', 'Rajesh Kumar', '9876543217'),
('5f98637b-01b0-42a3-bd0b-d41f343e7a50', 'Amit Singh', '9876543218'),
('4949c10a-1c42-4ed0-aa94-322bf7ce404b', 'Vikram Patel', '9876543219')
ON CONFLICT (id) DO NOTHING;

-- ==============================================
-- SAMPLE MILK TYPES
-- ==============================================

INSERT INTO milk_types (id, name, price_per_packet) VALUES
('af328f92-9c47-43a1-9edc-99f7d7e225a5', 'Dahi 180ml - 18 inr', 18.00),
('b1e2f3g4-h5i6-j7k8-l9m0-n1o2p3q4r5s6', 'Toned Milk 500ml', 25.00),
('c2d3e4f5-g6h7-i8j9-k0l1-m2n3o4p5q6r7', 'Full Cream Milk 1L', 45.00),
('d3e4f5g6-h7i8-j9k0-l1m2-n3o4p5q6r7s8', 'Skimmed Milk 1L', 40.00),
('e4f5g6h7-i8j9-k0l1-m2n3-o4p5q6r7s8t9', 'Buffalo Milk 1L', 50.00)
ON CONFLICT (id) DO NOTHING;

-- ==============================================
-- SAMPLE DELIVERIES (Today)
-- ==============================================

INSERT INTO deliveries (shop_id, delivery_boy_id, delivery_date, products, total_amount, payment_amount, payment_status, delivery_status, is_archived, notes) VALUES
('e01fd715-c698-49e2-8848-76d4aee8953a', '12c7056a-c423-445b-86af-2e6c60347e84', CURRENT_DATE, '[{"milk_type_id": "af328f92-9c47-43a1-9edc-99f7d7e225a5", "quantity": 2, "subtotal": 36, "price_per_packet": 18}]', 36.00, 0.00, 'pending', 'pending', false, 'Sample delivery for testing'),
('b602de58-1c08-4bd0-aa08-28bc9eccc148', '12c7056a-c423-445b-86af-2e6c60347e84', CURRENT_DATE, '[{"milk_type_id": "af328f92-9c47-43a1-9edc-99f7d7e225a5", "quantity": 3, "subtotal": 54, "price_per_packet": 18}]', 54.00, 0.00, 'pending', 'pending', false, 'Sample delivery for testing')
ON CONFLICT DO NOTHING;

-- ==============================================
-- SAMPLE ACTIVITY LOG
-- ==============================================

INSERT INTO activity_log (shop_id, delivery_boy_id, activity_type, message, amount, delivery_date, metadata) VALUES
('e01fd715-c698-49e2-8848-76d4aee8953a', '12c7056a-c423-445b-86af-2e6c60347e84', 'delivery_added', 'Sample delivery added for testing', 36.00, CURRENT_DATE, '{"test": true}'),
('b602de58-1c08-4bd0-aa08-28bc9eccc148', '12c7056a-c423-445b-86af-2e6c60347e84', 'delivery_added', 'Sample delivery added for testing', 54.00, CURRENT_DATE, '{"test": true}')
ON CONFLICT DO NOTHING;

-- ==============================================
-- SAMPLE USER ROLES (for testing)
-- ==============================================

INSERT INTO user_roles (user_id, role, is_active) VALUES
('00000000-0000-0000-0000-000000000001', 'owner', true),
('00000000-0000-0000-0000-000000000002', 'staff', true)
ON CONFLICT DO NOTHING;

-- ==============================================
-- SAMPLE USER PROFILES (for testing)
-- ==============================================

INSERT INTO user_profiles (user_id, full_name, phone, role) VALUES
('00000000-0000-0000-0000-000000000001', 'Owner User', '9876543200', 'owner'),
('00000000-0000-0000-0000-000000000002', 'Staff User', '9876543201', 'staff')
ON CONFLICT DO NOTHING;

-- ==============================================
-- TESTING NOTES
-- ==============================================

-- This sample data provides:
-- 1. 6 shops with different owners and phone numbers
-- 2. 5 delivery boys for assignment
-- 3. 5 milk types with different prices
-- 2 sample deliveries for today (pending status)
-- 2 activity log entries
-- 2 user roles (owner and staff)
-- 2 user profiles

-- To test the system:
-- 1. Run the schema.sql to create tables
-- 2. Run the functions.sql to create functions
-- 3. Run the rls_policies.sql to enable security
-- 4. Run this sample_data.sql to populate test data
-- 5. Test the application with the test data

-- For production:
-- 1. Remove or modify sample data
-- 2. Add real shop and delivery boy data
-- 3. Set up proper user authentication
-- 4. Configure environment variables
-- 5. Test all functions with real data
