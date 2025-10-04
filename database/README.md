# Milk Delivery App - Database Documentation

## Overview
This directory contains the complete database schema, functions, and documentation for the Milk Delivery App.

## Database Structure
The app uses **Supabase (PostgreSQL)** as the cloud database. All data is stored in the cloud, but this directory contains the complete schema and functions for reference and backup.

## Files in this Directory

### 📁 Schema Files
- `schema.sql` - Complete database schema with all tables, constraints, and indexes
- `functions.sql` - All PostgreSQL functions used by the application
- `rls_policies.sql` - Row Level Security policies for data protection
- `sample_data.sql` - Sample data for testing and development

### 📁 Documentation
- `README.md` - This file with complete documentation
- `API_REFERENCE.md` - Complete API reference for all functions
- `DEPLOYMENT.md` - Database deployment instructions

## Database Tables

### Core Tables
1. **shops** - Shop information and contact details
2. **deliveries** - Delivery records with products and amounts
3. **payments** - Payment transactions and collections
4. **delivery_boys** - Delivery personnel information
5. **milk_types** - Product catalog (milk types and prices)

### Supporting Tables
6. **shop_pending_history** - Historical pending amounts
7. **activity_log** - System activity tracking
8. **user_roles** - User role management
9. **user_profiles** - User profile information

## Key Features

### 🔐 Security
- Row Level Security (RLS) enabled on all tables
- Role-based access control (Owner/Staff)
- Secure function execution with proper search_path

### 📊 Business Logic
- FIFO payment processing
- Multi-day delivery workflow
- Daily reset functionality
- Historical data preservation
- Payment deferral (Pay Tomorrow)

### 🚀 Performance
- Optimized indexes on frequently queried columns
- Efficient JSONB operations for product data
- Proper foreign key relationships
- Transaction-safe operations

## Database Functions

### Core Functions
- `add_delivery()` - Add new delivery with product calculations
- `process_payment()` - Process payments with FIFO logic
- `process_daily_reset()` - Daily reset with data archiving
- `mark_pay_tomorrow()` - Defer payments to next day

### Reporting Functions
- `get_collection_view()` - Active deliveries for collection
- `get_reports_collection_view()` - Historical data for reports
- `get_shop_detail_view()` - Detailed shop information
- `get_daily_report_summary()` - Daily summary statistics

### Utility Functions
- `get_shop_balance()` - Shop financial summary
- `get_delivery_status_view()` - Delivery status tracking
- `verify_functions()` - System verification

## Data Flow

### 1. Delivery Process
```
Add Delivery → Calculate Amounts → Store Products → Log Activity
```

### 2. Payment Process
```
Process Payment → FIFO Application → Update Status → Log Activity
```

### 3. Daily Reset
```
Archive Paid → Move Pending to History → Update Status → Log Activity
```

## Backup and Recovery

### Cloud Backup
- Supabase automatically handles backups
- Point-in-time recovery available
- Cross-region replication

### Local Backup
- Use the files in this directory to recreate the database
- All functions and schema are version controlled
- Sample data included for testing

## Environment Variables

### Required
```bash
VITE_REACT_APP_SUPABASE_URL=your-supabase-url
VITE_REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Optional
```bash
VITE_REACT_APP_DEFAULT_PIN=6969
VITE_REACT_APP_SESSION_TIMEOUT=1800000
VITE_REACT_APP_MAX_LOGIN_ATTEMPTS=3
VITE_REACT_APP_LOCKOUT_DURATION=300000
```

## Deployment

### Production Setup
1. Create Supabase project
2. Run schema.sql to create tables
3. Run functions.sql to create functions
4. Run rls_policies.sql to enable security
5. Configure environment variables
6. Deploy frontend to Vercel

### Development Setup
1. Use sample_data.sql for testing
2. All functions are available for testing
3. RLS policies can be temporarily disabled for development

## Monitoring and Maintenance

### Health Checks
- Use `verify_functions()` to check system status
- Monitor activity_log for system health
- Check payment processing with `get_shop_balance()`

### Performance Monitoring
- Monitor query performance in Supabase dashboard
- Check index usage and optimization
- Review RLS policy performance

## Support

For database-related issues:
1. Check the function definitions in `functions.sql`
2. Review the schema in `schema.sql`
3. Test with sample data from `sample_data.sql`
4. Check RLS policies in `rls_policies.sql`

---

**Last Updated**: January 2025
**Database Version**: PostgreSQL 15+ (Supabase)
**App Version**: 1.0.0
