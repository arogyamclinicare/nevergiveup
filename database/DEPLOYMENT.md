# Milk Delivery App - Database Deployment Guide

## Overview
This guide provides step-by-step instructions for deploying the Milk Delivery App database to Supabase.

## Prerequisites

### Required Tools
- Supabase account (free tier available)
- Database access (Supabase Dashboard)
- SQL client (optional, Supabase Dashboard works)

### Required Information
- Supabase project URL
- Supabase anon key
- Database password (if using external client)

## Deployment Steps

### 1. Create Supabase Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose organization and enter project details
4. Set database password (save securely)
5. Wait for project creation (2-3 minutes)

### 2. Access Database
1. Go to your project dashboard
2. Navigate to "SQL Editor" in the sidebar
3. Or use external client with connection details

### 3. Deploy Schema
Run the following files in order:

#### 3.1 Create Tables
```sql
-- Copy and paste contents of database/schema.sql
-- This creates all tables, indexes, and triggers
```

#### 3.2 Create Functions
```sql
-- Copy and paste contents of database/functions.sql
-- This creates all business logic functions
```

#### 3.3 Enable Security
```sql
-- Copy and paste contents of database/rls_policies.sql
-- This enables Row Level Security
```

#### 3.4 Add Sample Data (Optional)
```sql
-- Copy and paste contents of database/sample_data.sql
-- This adds test data for development
```

### 4. Verify Deployment

#### 4.1 Check Tables
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Expected tables:
- activity_log
- deliveries
- delivery_boys
- milk_types
- payments
- shop_pending_history
- shops
- user_profiles
- user_roles

#### 4.2 Check Functions
```sql
SELECT * FROM verify_functions();
```

All functions should return `function_exists: true`

#### 4.3 Test Core Functions
```sql
-- Test shop creation
INSERT INTO shops (name, owner_name, phone) 
VALUES ('Test Shop', 'Test Owner', '1234567890');

-- Test delivery addition
SELECT add_delivery(
  (SELECT id FROM shops WHERE name = 'Test Shop'),
  (SELECT id FROM delivery_boys LIMIT 1),
  '[{"milk_type_id": "af328f92-9c47-43a1-9edc-99f7d7e225a5", "quantity": 1}]'::JSONB
);

-- Test payment processing
SELECT process_payment(
  (SELECT id FROM shops WHERE name = 'Test Shop'),
  18.00
);
```

### 5. Configure Environment Variables

#### 5.1 Get Supabase Credentials
1. Go to Project Settings → API
2. Copy "Project URL" and "anon public" key

#### 5.2 Update Frontend Configuration
Create `.env.local` file:
```bash
# Supabase Configuration
VITE_REACT_APP_SUPABASE_URL=your-project-url
VITE_REACT_APP_SUPABASE_ANON_KEY=your-anon-key

# Authentication Credentials (CHANGE THESE!)
VITE_REACT_APP_OWNER_USERNAME=owner
VITE_REACT_APP_OWNER_PASSWORD=owner123
VITE_REACT_APP_STAFF_USERNAME=staff
VITE_REACT_APP_STAFF_PASSWORD=staff123

# Settings PIN (CHANGE THIS!)
VITE_REACT_APP_DEFAULT_PIN=6969

# Session Configuration
VITE_REACT_APP_SESSION_TIMEOUT=1800000
VITE_REACT_APP_MAX_LOGIN_ATTEMPTS=3
VITE_REACT_APP_LOCKOUT_DURATION=300000
```

### 6. Test Application

#### 6.1 Start Development Server
```bash
cd frontend
npm install
npm run dev
```

#### 6.2 Test Core Features
1. **Login**: Test with owner/staff credentials
2. **Add Delivery**: Create a test delivery
3. **Process Payment**: Test payment collection
4. **View Reports**: Check historical data
5. **Daily Reset**: Test end-of-day process

#### 6.3 Test Mobile Responsiveness
- Test on different screen sizes
- Verify touch targets are adequate
- Check modal and dialog behavior

### 7. Production Deployment

#### 7.1 Security Checklist
- [ ] Change default credentials
- [ ] Update PIN to secure value
- [ ] Enable RLS policies
- [ ] Review function security
- [ ] Test authentication flow

#### 7.2 Data Migration
If migrating from existing system:
1. Export data from old system
2. Transform data to match new schema
3. Import using Supabase Dashboard
4. Verify data integrity

#### 7.3 Performance Optimization
1. **Monitor Query Performance**
   ```sql
   -- Check slow queries
   SELECT query, mean_time, calls 
   FROM pg_stat_statements 
   ORDER BY mean_time DESC;
   ```

2. **Optimize Indexes**
   ```sql
   -- Check index usage
   SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
   FROM pg_stat_user_indexes;
   ```

3. **Database Maintenance**
   - Regular VACUUM and ANALYZE
   - Monitor database size
   - Check connection limits

### 8. Monitoring and Maintenance

#### 8.1 Health Checks
```sql
-- Check system health
SELECT * FROM verify_functions();

-- Check data integrity
SELECT COUNT(*) as total_deliveries FROM deliveries;
SELECT COUNT(*) as total_payments FROM payments;
SELECT COUNT(*) as total_shops FROM shops;
```

#### 8.2 Backup Strategy
- Supabase handles automatic backups
- Point-in-time recovery available
- Cross-region replication (Pro plan)

#### 8.3 Security Monitoring
```sql
-- Check activity logs
SELECT activity_type, COUNT(*) as count
FROM activity_log
WHERE created_at >= CURRENT_DATE
GROUP BY activity_type
ORDER BY count DESC;
```

### 9. Troubleshooting

#### 9.1 Common Issues

**Function Not Found**
```sql
-- Check if function exists
SELECT proname FROM pg_proc WHERE proname = 'function_name';
```

**Permission Denied**
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'table_name';
```

**Connection Issues**
- Verify Supabase URL and key
- Check network connectivity
- Review firewall settings

#### 9.2 Performance Issues

**Slow Queries**
```sql
-- Enable query logging
SET log_statement = 'all';
SET log_min_duration_statement = 1000;
```

**High Memory Usage**
```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;
```

### 10. Support and Resources

#### 10.1 Documentation
- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Database API Reference](./API_REFERENCE.md)

#### 10.2 Community Support
- [Supabase Discord](https://discord.supabase.com)
- [GitHub Issues](https://github.com/supabase/supabase/issues)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/supabase)

#### 10.3 Professional Support
- Supabase Pro plan for priority support
- Database consulting services
- Custom development services

## Deployment Checklist

### Pre-Deployment
- [ ] Supabase project created
- [ ] Database schema deployed
- [ ] Functions created and tested
- [ ] RLS policies enabled
- [ ] Sample data added (if needed)

### Post-Deployment
- [ ] Environment variables configured
- [ ] Frontend application tested
- [ ] Authentication working
- [ ] Core features functional
- [ ] Mobile responsiveness verified

### Production Readiness
- [ ] Security credentials updated
- [ ] Performance optimized
- [ ] Monitoring configured
- [ ] Backup strategy in place
- [ ] Documentation updated

---

**Last Updated**: January 2025  
**Database Version**: PostgreSQL 17.6 (Supabase)  
**App Version**: 1.0.0
