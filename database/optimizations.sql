-- Database Query Optimizations for Milk Delivery App
-- Generated on: 2025-10-04 07:41:03.773799+00
-- Database: postgres
-- Version: PostgreSQL 17.6

-- ==============================================
-- PERFORMANCE INDEXES
-- ==============================================

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_deliveries_shop_date_status 
ON deliveries(shop_id, delivery_date, payment_status, is_archived);

CREATE INDEX IF NOT EXISTS idx_deliveries_date_archived_status 
ON deliveries(delivery_date, is_archived, payment_status);

CREATE INDEX IF NOT EXISTS idx_deliveries_boy_date 
ON deliveries(delivery_boy_id, delivery_date, is_archived);

CREATE INDEX IF NOT EXISTS idx_payments_shop_date 
ON payments(shop_id, payment_date);

CREATE INDEX IF NOT EXISTS idx_activity_log_shop_date_type 
ON activity_log(shop_id, delivery_date, activity_type);

CREATE INDEX IF NOT EXISTS idx_shop_pending_history_shop 
ON shop_pending_history(shop_id, original_date);

-- Partial indexes for active records only
CREATE INDEX IF NOT EXISTS idx_shops_active 
ON shops(id, name) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_delivery_boys_active 
ON delivery_boys(id, name) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_milk_types_active 
ON milk_types(id, name, price_per_packet) WHERE is_active = true;

-- ==============================================
-- OPTIMIZED FUNCTIONS
-- ==============================================

-- Optimized collection view with better performance
CREATE OR REPLACE FUNCTION get_optimized_collection_view(p_date date)
RETURNS TABLE(
  shop_id uuid,
  shop_name text,
  shop_phone text,
  shop_owner text,
  today_delivered numeric,
  today_paid numeric,
  today_pending numeric,
  old_pending numeric,
  total_pending numeric,
  status text,
  delivery_count bigint
)
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH shop_totals AS (
    SELECT 
      s.id as s_shop_id,
      s.name as s_shop_name,
      s.phone as s_shop_phone,
      s.owner_name as s_shop_owner,
      -- Use index-friendly queries
      COALESCE(SUM(CASE WHEN d.delivery_date = p_date AND d.is_archived = false THEN d.total_amount ELSE 0 END), 0) as s_today_delivered,
      COALESCE(SUM(CASE WHEN d.delivery_date = p_date AND d.is_archived = false THEN d.payment_amount ELSE 0 END), 0) as s_today_paid,
      COALESCE(SUM(CASE WHEN d.delivery_date = p_date AND d.is_archived = false AND d.payment_status != 'pay_tomorrow' THEN (d.total_amount - d.payment_amount) ELSE 0 END), 0) as s_today_pending,
      COALESCE(SUM(CASE WHEN d.delivery_date < p_date AND d.is_archived = false THEN (d.total_amount - d.payment_amount) ELSE 0 END), 0) as s_old_pending,
      COUNT(CASE WHEN d.delivery_date = p_date AND d.is_archived = false THEN 1 END) as s_delivery_count,
      COUNT(CASE WHEN d.delivery_date = p_date AND d.is_archived = false AND d.payment_status = 'pay_tomorrow' THEN 1 END) as s_pay_tomorrow_count
    FROM shops s
    LEFT JOIN deliveries d ON s.id = d.shop_id
    WHERE s.is_active = true
    GROUP BY s.id, s.name, s.phone, s.owner_name
  ),
  shop_pending_history_totals AS (
    SELECT 
      sph.shop_id as sph_shop_id,
      COALESCE(SUM(sph.pending_amount), 0) as sph_total_pending_from_history
    FROM shop_pending_history sph
    GROUP BY sph.shop_id
  ),
  shop_status AS (
    SELECT 
      st.s_shop_id as shop_id,
      st.s_shop_name as shop_name,
      st.s_shop_phone as shop_phone,
      st.s_shop_owner as shop_owner,
      st.s_today_delivered as today_delivered,
      st.s_today_paid as today_paid,
      st.s_today_pending as today_pending,
      st.s_old_pending as old_pending,
      COALESCE(sph.sph_total_pending_from_history, 0) as pending_from_history,
      (st.s_today_pending + st.s_old_pending + COALESCE(sph.sph_total_pending_from_history, 0)) as total_pending,
      st.s_delivery_count as delivery_count,
      st.s_pay_tomorrow_count as pay_tomorrow_count,
      CASE 
        WHEN (st.s_today_pending + st.s_old_pending + COALESCE(sph.sph_total_pending_from_history, 0)) = 0 THEN 'paid'
        WHEN st.s_pay_tomorrow_count > 0 THEN 'pay_tomorrow'
        WHEN st.s_today_pending > 0 AND st.s_today_paid > 0 THEN 'partial'
        WHEN st.s_today_pending > 0 THEN 'pending'
        WHEN COALESCE(sph.sph_total_pending_from_history, 0) > 0 THEN 'pending'
        ELSE 'paid'
      END as status
    FROM shop_totals st
    LEFT JOIN shop_pending_history_totals sph ON st.s_shop_id = sph.sph_shop_id
  )
  SELECT 
    ss.shop_id,
    ss.shop_name,
    ss.shop_phone,
    ss.shop_owner,
    ss.today_delivered,
    ss.today_paid,
    ss.today_pending,
    ss.old_pending,
    ss.total_pending,
    ss.status,
    ss.delivery_count
  FROM shop_status ss
  WHERE ss.delivery_count > 0
  ORDER BY ss.total_pending DESC, ss.shop_name ASC;
END;
$$;

-- Optimized daily summary with better performance
CREATE OR REPLACE FUNCTION get_optimized_daily_summary(p_date date)
RETURNS TABLE(
  total_delivered numeric,
  total_collected numeric,
  total_pending numeric,
  fully_paid_shops bigint,
  partially_paid_shops bigint,
  pending_shops bigint,
  total_shops bigint
)
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH daily_stats AS (
    SELECT
      COALESCE(SUM(d.total_amount), 0) AS delivered,
      COALESCE(SUM(d.payment_amount), 0) AS collected,
      COALESCE(SUM(d.total_amount - d.payment_amount), 0) AS pending_today,
      COUNT(DISTINCT d.shop_id) AS total_shops_with_deliveries
    FROM deliveries d
    WHERE d.delivery_date = p_date
      AND d.is_archived = false
  ),
  shop_statuses AS (
    SELECT
      s.id AS shop_id,
      CASE
        WHEN COALESCE(SUM(d.total_amount - d.payment_amount), 0) = 0 AND COALESCE(SUM(d.payment_amount), 0) > 0 THEN 'paid'
        WHEN COALESCE(SUM(d.payment_amount), 0) > 0 AND COALESCE(SUM(d.total_amount - d.payment_amount), 0) > 0 THEN 'partial'
        WHEN EXISTS (SELECT 1 FROM deliveries WHERE shop_id = s.id AND delivery_date = p_date AND payment_status = 'pay_tomorrow') THEN 'pay_tomorrow'
        WHEN COALESCE(SUM(d.total_amount - d.payment_amount), 0) > 0 THEN 'pending'
        ELSE 'pending'
      END AS status
    FROM shops s
    JOIN deliveries d ON s.id = d.shop_id
    WHERE d.delivery_date = p_date
      AND d.is_archived = false
    GROUP BY s.id
  )
  SELECT
    ds.delivered AS total_delivered,
    ds.collected AS total_collected,
    ds.pending_today AS total_pending,
    COUNT(CASE WHEN ss.status = 'paid' THEN 1 END) AS fully_paid_shops,
    COUNT(CASE WHEN ss.status = 'partial' THEN 1 END) AS partially_paid_shops,
    COUNT(CASE WHEN ss.status = 'pending' OR ss.status = 'pay_tomorrow' THEN 1 END) AS pending_shops,
    ds.total_shops_with_deliveries AS total_shops
  FROM daily_stats ds, shop_statuses ss
  GROUP BY ds.delivered, ds.collected, ds.pending_today, ds.total_shops_with_deliveries;
END;
$$;

-- ==============================================
-- QUERY OPTIMIZATION FUNCTIONS
-- ==============================================

-- Function to analyze query performance
CREATE OR REPLACE FUNCTION analyze_query_performance()
RETURNS TABLE(
  query_text text,
  mean_time numeric,
  calls bigint,
  total_time numeric,
  rows bigint
)
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    query::text as query_text,
    mean_time,
    calls,
    total_time,
    rows
  FROM pg_stat_statements 
  WHERE query LIKE '%deliveries%' 
     OR query LIKE '%payments%'
     OR query LIKE '%shops%'
  ORDER BY mean_time DESC
  LIMIT 20;
END;
$$;

-- Function to get index usage statistics
CREATE OR REPLACE FUNCTION get_index_usage_stats()
RETURNS TABLE(
  table_name text,
  index_name text,
  index_scans bigint,
  tuples_read bigint,
  tuples_fetched bigint
)
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    schemaname||'.'||tablename as table_name,
    indexrelname as index_name,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
  FROM pg_stat_user_indexes
  WHERE schemaname = 'public'
  ORDER BY idx_scan DESC;
END;
$$;

-- Function to get table statistics
CREATE OR REPLACE FUNCTION get_table_stats()
RETURNS TABLE(
  table_name text,
  row_count bigint,
  table_size text,
  index_size text,
  total_size text
)
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    schemaname||'.'||tablename as table_name,
    n_tup_ins + n_tup_upd + n_tup_del as row_count,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as index_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size
  FROM pg_stat_user_tables
  WHERE schemaname = 'public'
  ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
END;
$$;

-- ==============================================
-- MAINTENANCE FUNCTIONS
-- ==============================================

-- Function to update table statistics
CREATE OR REPLACE FUNCTION update_table_statistics()
RETURNS text
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
DECLARE
  result text := '';
BEGIN
  -- Update statistics for all tables
  ANALYZE shops;
  ANALYZE deliveries;
  ANALYZE payments;
  ANALYZE delivery_boys;
  ANALYZE milk_types;
  ANALYZE shop_pending_history;
  ANALYZE activity_log;
  ANALYZE user_roles;
  ANALYZE user_profiles;
  
  result := 'Table statistics updated successfully';
  RETURN result;
END;
$$;

-- Function to vacuum and analyze tables
CREATE OR REPLACE FUNCTION maintenance_cleanup()
RETURNS text
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
DECLARE
  result text := '';
BEGIN
  -- Vacuum and analyze all tables
  VACUUM ANALYZE shops;
  VACUUM ANALYZE deliveries;
  VACUUM ANALYZE payments;
  VACUUM ANALYZE delivery_boys;
  VACUUM ANALYZE milk_types;
  VACUUM ANALYZE shop_pending_history;
  VACUUM ANALYZE activity_log;
  VACUUM ANALYZE user_roles;
  VACUUM ANALYZE user_profiles;
  
  result := 'Database maintenance completed successfully';
  RETURN result;
END;
$$;

-- ==============================================
-- PERFORMANCE MONITORING
-- ==============================================

-- Function to monitor slow queries
CREATE OR REPLACE FUNCTION get_slow_queries(threshold_ms numeric DEFAULT 1000)
RETURNS TABLE(
  query_text text,
  mean_time numeric,
  calls bigint,
  total_time numeric
)
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    query::text as query_text,
    mean_time,
    calls,
    total_time
  FROM pg_stat_statements 
  WHERE mean_time > threshold_ms
  ORDER BY mean_time DESC;
END;
$$;

-- Function to get connection statistics
CREATE OR REPLACE FUNCTION get_connection_stats()
RETURNS TABLE(
  state text,
  count bigint
)
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    state,
    count(*) as count
  FROM pg_stat_activity
  WHERE datname = current_database()
  GROUP BY state
  ORDER BY count DESC;
END;
$$;

-- ==============================================
-- OPTIMIZATION RECOMMENDATIONS
-- ==============================================

-- Function to get optimization recommendations
CREATE OR REPLACE FUNCTION get_optimization_recommendations()
RETURNS TABLE(
  recommendation text,
  priority text,
  description text
)
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'Index Usage' as recommendation,
    'High' as priority,
    'Monitor index usage and consider adding indexes for frequently queried columns' as description
  UNION ALL
  SELECT 
    'Query Performance',
    'High',
    'Review slow queries and optimize them with better indexes or query patterns'
  UNION ALL
  SELECT 
    'Table Statistics',
    'Medium',
    'Regularly update table statistics with ANALYZE for better query planning'
  UNION ALL
  SELECT 
    'Connection Pooling',
    'Medium',
    'Consider using connection pooling for better resource management'
  UNION ALL
  SELECT 
    'Archival Strategy',
    'Low',
    'Implement data archival strategy for old records to improve performance';
END;
$$;
