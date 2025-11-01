# ⚠️ IMPORTANT: Run This Database Migration

## Problem
The `activity_log` table has a constraint that only allows specific `activity_type` values. We need to add `'pending_added'` to the allowed list.

## Solution
Run this SQL in your Supabase Dashboard:

### Steps:
1. Go to: https://supabase.com/dashboard/project/cqltkqwxbtbnunaiknau/sql
2. Click "New Query"
3. Copy and paste this SQL:

```sql
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
  'pending_added'
));
```

4. Click "RUN" button
5. You should see "Success. No rows returned"

## After Running:
- Try adding a manual pending amount again
- It should now show in the shop chat with timestamp!

