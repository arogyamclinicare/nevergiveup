-- Migration: Add 'pending_added' to activity_type constraint
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql

-- Drop existing constraint
ALTER TABLE activity_log 
DROP CONSTRAINT IF EXISTS activity_log_activity_type_check;

-- Add constraint with 'pending_added' included
ALTER TABLE activity_log 
ADD CONSTRAINT activity_log_activity_type_check 
CHECK (activity_type IN (
  'delivery_added', 
  'payment_collected', 
  'payment_partial', 
  'payment_pending', 
  'reset_daily', 
  'delivery_updated',
  'pending_added'  -- New activity type for manual pending amounts
));

