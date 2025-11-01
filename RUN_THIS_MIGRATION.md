# ⚠️ IMPORTANT: Run These Database Migrations

## Migration 1: Add 'pending_added' to activity_type

### Problem
The `activity_log` table has a constraint that only allows specific `activity_type` values. We need to add `'pending_added'` to the allowed list.

### Solution
Run this SQL in your Supabase Dashboard:

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

---

## Migration 2: Fix Payment Order

### Problem
The payment function was paying manual pending FIRST, then deliveries. It should pay deliveries FIRST, then manual pending.

### Solution
Run this SQL in your Supabase Dashboard:

1. Go to: https://supabase.com/dashboard/project/cqltkqwxbtbnunaiknau/sql
2. Click "New Query"
3. Copy and paste the ENTIRE contents of: `database/migration_fix_payment_order.sql`
4. Click "RUN" button

Or open the file and copy-paste the complete `process_payment` function from lines 5-168.

---

## After Running Both:
- Manual pending amounts will show in shop chat ✅
- Payments will be applied to deliveries FIRST, then manual pending ✅
- Ready for testing!

