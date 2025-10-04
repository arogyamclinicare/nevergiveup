# Milk Delivery App - Database API Reference

## Overview
This document provides a complete reference for all database functions, their parameters, return values, and usage examples.

## Core Business Functions

### 1. add_delivery()
**Purpose**: Add a new delivery with product calculations and validation.

**Parameters**:
- `p_shop_id` (UUID): Shop ID for the delivery
- `p_delivery_boy_id` (UUID): Delivery boy assigned
- `p_products` (JSONB): Array of products with quantities
- `p_delivery_date` (DATE, optional): Delivery date (defaults to today)
- `p_notes` (TEXT, optional): Additional notes

**Returns**: JSONB with success status and delivery details

**Example**:
```sql
SELECT add_delivery(
  'e01fd715-c698-49e2-8848-76d4aee8953a'::UUID,
  '12c7056a-c423-445b-86af-2e6c60347e84'::UUID,
  '[{"milk_type_id": "af328f92-9c47-43a1-9edc-99f7d7e225a5", "quantity": 2}]'::JSONB,
  CURRENT_DATE,
  'Regular delivery'
);
```

**Response**:
```json
{
  "success": true,
  "delivery_id": "uuid",
  "total_amount": 36.00,
  "products": [...],
  "message": "Delivery added successfully"
}
```

### 2. process_payment()
**Purpose**: Process payments with FIFO logic (oldest first).

**Parameters**:
- `p_shop_id` (UUID): Shop ID for payment
- `p_amount` (NUMERIC): Payment amount
- `p_collected_by` (TEXT, optional): Who collected the payment
- `p_payment_date` (DATE, optional): Payment date (defaults to today)
- `p_notes` (TEXT, optional): Payment notes

**Returns**: JSONB with payment processing details

**Example**:
```sql
SELECT process_payment(
  'e01fd715-c698-49e2-8848-76d4aee8953a'::UUID,
  50.00,
  'Rajesh',
  CURRENT_DATE,
  'Cash payment'
);
```

**Response**:
```json
{
  "success": true,
  "payment_id": "uuid",
  "amount_paid": 50.00,
  "amount_applied": 50.00,
  "amount_remaining": 0.00,
  "affected_deliveries": [...],
  "message": "Payment processed successfully"
}
```

### 3. process_daily_reset()
**Purpose**: Archive paid deliveries and move pending ones to history.

**Parameters**:
- `p_date` (DATE, optional): Date to reset (defaults to today)

**Returns**: JSONB with reset summary

**Example**:
```sql
SELECT process_daily_reset(CURRENT_DATE);
```

**Response**:
```json
{
  "success": true,
  "date_reset": "2025-01-04",
  "processed_deliveries": 5,
  "total_pending_moved": 150.00,
  "message": "Daily reset completed successfully"
}
```

### 4. mark_pay_tomorrow()
**Purpose**: Defer payments to the next day.

**Parameters**:
- `p_shop_id` (UUID): Shop ID
- `p_notes` (TEXT, optional): Deferral notes

**Returns**: JSONB with deferral details

**Example**:
```sql
SELECT mark_pay_tomorrow(
  'e01fd715-c698-49e2-8848-76d4aee8953a'::UUID,
  'Customer requested deferral'
);
```

**Response**:
```json
{
  "success": true,
  "message": "Payment deferred to tomorrow",
  "affected_deliveries": 2
}
```

## View Functions

### 5. get_today_collection_view()
**Purpose**: Get today's active deliveries for collection screen.

**Parameters**:
- `p_date` (DATE): Date to query

**Returns**: Table with shop collection data

**Example**:
```sql
SELECT * FROM get_today_collection_view(CURRENT_DATE);
```

**Columns**:
- `shop_id`, `shop_name`, `shop_phone`, `shop_owner`
- `today_delivered`, `today_paid`, `today_pending`, `old_pending`, `total_pending`
- `status`, `delivery_count`

### 6. get_reports_collection_view()
**Purpose**: Get historical collection data for reports.

**Parameters**:
- `p_date` (DATE): Date to query

**Returns**: Table with historical shop data

**Example**:
```sql
SELECT * FROM get_reports_collection_view('2025-01-03'::DATE);
```

### 7. get_reports_shop_detail_view()
**Purpose**: Get detailed shop information for reports.

**Parameters**:
- `p_shop_id` (UUID): Shop ID
- `p_date` (DATE): Date to query

**Returns**: Table with detailed shop data

**Example**:
```sql
SELECT * FROM get_reports_shop_detail_view(
  'e01fd715-c698-49e2-8848-76d4aee8953a'::UUID,
  '2025-01-03'::DATE
);
```

**Columns**:
- `shop_id`, `shop_name`, `shop_owner`, `shop_phone`, `shop_address`
- `delivery_date`, `total_delivered`, `total_paid`, `total_pending`
- `delivery_count`, `products_delivered`, `payment_history`, `delivery_notes`

### 8. get_reports_daily_summary()
**Purpose**: Get daily summary statistics for reports.

**Parameters**:
- `p_date` (DATE): Date to query

**Returns**: Table with daily summary

**Example**:
```sql
SELECT * FROM get_reports_daily_summary('2025-01-03'::DATE);
```

**Columns**:
- `total_delivered`, `total_collected`, `total_pending`
- `fully_paid_shops`, `partially_paid_shops`, `pending_shops`, `total_shops`

## Utility Functions

### 9. get_shop_balance()
**Purpose**: Get comprehensive shop financial summary.

**Parameters**:
- `p_shop_id` (UUID): Shop ID

**Returns**: JSONB with shop balance details

**Example**:
```sql
SELECT get_shop_balance('e01fd715-c698-49e2-8848-76d4aee8953a'::UUID);
```

**Response**:
```json
{
  "success": true,
  "shop_id": "uuid",
  "shop_name": "Anita Milk Center",
  "total_delivered": 500.00,
  "total_paid": 450.00,
  "total_pending": 50.00,
  "today_delivered": 36.00,
  "today_paid": 0.00,
  "today_pending": 36.00,
  "old_pending": 14.00,
  "deliveries_count": 15,
  "pending_deliveries_count": 2,
  "last_delivery_date": "2025-01-04"
}
```

### 10. verify_functions()
**Purpose**: Check if all required functions exist.

**Parameters**: None

**Returns**: Table with function existence status

**Example**:
```sql
SELECT * FROM verify_functions();
```

**Columns**:
- `function_name`: Name of the function
- `function_exists`: Boolean indicating if function exists

## Error Handling

### Common Error Responses
```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

### Validation Errors
- **Invalid shop ID**: "Shop not found"
- **Invalid amount**: "Payment amount must be greater than 0"
- **Invalid products**: "At least one product is required"
- **Invalid milk type**: "Invalid or inactive milk type"
- **Invalid quantity**: "Quantity must be greater than 0"

## Security Notes

### Function Security
- All functions use `SET search_path = 'public'` to prevent SQL injection
- Input validation on all parameters
- Proper error handling and logging

### Data Protection
- Row Level Security (RLS) enabled on all tables
- Role-based access control
- Activity logging for all operations

## Performance Considerations

### Indexes
- `idx_deliveries_shop_date`: Optimizes delivery queries by shop and date
- `idx_deliveries_status`: Optimizes queries by payment status
- `idx_payments_shop_date`: Optimizes payment queries
- `idx_activity_log_shop_date`: Optimizes activity log queries

### Query Optimization
- Use appropriate date ranges to limit data
- Leverage indexes for frequently queried columns
- Consider pagination for large result sets

## Testing

### Function Testing
```sql
-- Test all functions exist
SELECT * FROM verify_functions();

-- Test delivery addition
SELECT add_delivery(...);

-- Test payment processing
SELECT process_payment(...);

-- Test daily reset
SELECT process_daily_reset();
```

### Data Validation
```sql
-- Check shop data
SELECT * FROM shops WHERE is_active = true;

-- Check delivery data
SELECT * FROM deliveries WHERE delivery_date = CURRENT_DATE;

-- Check payment data
SELECT * FROM payments WHERE payment_date = CURRENT_DATE;
```

## Maintenance

### Regular Tasks
1. **Daily Reset**: Run `process_daily_reset()` at end of day
2. **Data Cleanup**: Archive old data periodically
3. **Performance Monitoring**: Check query performance
4. **Security Review**: Regular security audits

### Backup and Recovery
- Supabase handles automatic backups
- Use database schema files for recreation
- Test recovery procedures regularly

---

**Last Updated**: January 2025  
**Database Version**: PostgreSQL 17.6 (Supabase)  
**App Version**: 1.0.0
