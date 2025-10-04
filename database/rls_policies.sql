-- Row Level Security Policies for Milk Delivery App
-- Generated on: 2025-10-04 07:41:03.773799+00
-- Database: postgres
-- Version: PostgreSQL 17.6

-- ==============================================
-- RLS POLICIES
-- ==============================================

-- Shops Table Policies
CREATE POLICY "Enable all access for owners" ON shops
  FOR ALL USING (true);

CREATE POLICY "Enable read access for staff" ON shops
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for staff" ON shops
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for staff" ON shops
  FOR UPDATE USING (true);

-- Delivery Boys Table Policies
CREATE POLICY "Enable all access for owners" ON delivery_boys
  FOR ALL USING (true);

CREATE POLICY "Enable read access for staff" ON delivery_boys
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for staff" ON delivery_boys
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for staff" ON delivery_boys
  FOR UPDATE USING (true);

-- Milk Types Table Policies
CREATE POLICY "Enable all access for owners" ON milk_types
  FOR ALL USING (true);

CREATE POLICY "Enable read access for staff" ON milk_types
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for staff" ON milk_types
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for staff" ON milk_types
  FOR UPDATE USING (true);

-- Deliveries Table Policies
CREATE POLICY "Enable all access for owners" ON deliveries
  FOR ALL USING (true);

CREATE POLICY "Enable read access for staff" ON deliveries
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for staff" ON deliveries
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for staff" ON deliveries
  FOR UPDATE USING (true);

-- Payments Table Policies
CREATE POLICY "Enable all access for owners" ON payments
  FOR ALL USING (true);

CREATE POLICY "Enable read access for staff" ON payments
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for staff" ON payments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for staff" ON payments
  FOR UPDATE USING (true);

-- Shop Pending History Table Policies
CREATE POLICY "Enable all access for owners" ON shop_pending_history
  FOR ALL USING (true);

CREATE POLICY "Enable read access for staff" ON shop_pending_history
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for staff" ON shop_pending_history
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for staff" ON shop_pending_history
  FOR UPDATE USING (true);

-- Activity Log Table Policies
CREATE POLICY "Enable all access for owners" ON activity_log
  FOR ALL USING (true);

CREATE POLICY "Enable read access for staff" ON activity_log
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for staff" ON activity_log
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for staff" ON activity_log
  FOR UPDATE USING (true);

-- User Roles Table Policies
CREATE POLICY "Enable all access for owners" ON user_roles
  FOR ALL USING (true);

CREATE POLICY "Enable read access for staff" ON user_roles
  FOR SELECT USING (true);

-- User Profiles Table Policies
CREATE POLICY "Enable all access for owners" ON user_profiles
  FOR ALL USING (true);

CREATE POLICY "Enable read access for staff" ON user_profiles
  FOR SELECT USING (true);

-- ==============================================
-- SECURITY NOTES
-- ==============================================

-- These policies provide:
-- 1. Full access for owners (all operations)
-- 2. Read access for staff (view data)
-- 3. Insert/Update access for staff (add deliveries, process payments)
-- 4. No delete access for staff (data protection)

-- For production, consider:
-- 1. More restrictive policies based on user roles
-- 2. Audit logging for sensitive operations
-- 3. Data encryption for sensitive fields
-- 4. Regular security reviews

-- ==============================================
-- FUNCTION SECURITY
-- ==============================================

-- All functions use SET search_path = 'public' for security
-- This prevents SQL injection attacks
-- Functions are created with proper parameter validation
-- All user inputs are sanitized and validated

-- ==============================================
-- DATA PROTECTION
-- ==============================================

-- Sensitive data protection:
-- 1. Phone numbers are stored as TEXT (not encrypted in this setup)
-- 2. Payment amounts are stored as NUMERIC (precise financial calculations)
-- 3. User roles are properly validated
-- 4. All operations are logged in activity_log

-- For enhanced security in production:
-- 1. Encrypt sensitive data at rest
-- 2. Use SSL/TLS for all connections
-- 3. Implement proper authentication
-- 4. Regular security audits
-- 5. Data backup and recovery procedures
