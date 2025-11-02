-- Migration: Add get_route_stats function for HomeScreen
-- This ensures pending calculation matches ShopDetailScreen and ShopsScreen

CREATE OR REPLACE FUNCTION get_route_stats()
RETURNS JSONB
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
DECLARE
  v_today_delivered NUMERIC;
  v_today_collected NUMERIC;
  v_total_pending NUMERIC;
  v_shops_visited INTEGER;
  v_total_shops INTEGER;
  v_result JSONB;
BEGIN
  -- Get today's totals from active deliveries only
  SELECT
    COALESCE(SUM(total_amount), 0),
    COALESCE(SUM(payment_amount), 0)
  INTO
    v_today_delivered,
    v_today_collected
  FROM deliveries
  WHERE delivery_date = CURRENT_DATE
    AND is_archived = false;

  -- Get total pending across all shops (active + history)
  -- This matches the logic in ShopDetailScreen and ShopsScreen
  WITH shop_pending AS (
    SELECT shop_id, SUM(total_amount - payment_amount) as pending
    FROM deliveries
    WHERE is_archived = false
    GROUP BY shop_id
    
    UNION ALL
    
    SELECT shop_id, SUM(pending_amount) as pending
    FROM shop_pending_history
    GROUP BY shop_id
  )
  SELECT COALESCE(SUM(pending), 0)
  INTO v_total_pending
  FROM shop_pending;

  -- Get shops visited count (shops with today's deliveries)
  SELECT COUNT(DISTINCT shop_id)
  INTO v_shops_visited
  FROM deliveries
  WHERE delivery_date = CURRENT_DATE
    AND is_archived = false;

  -- Get total active shops
  SELECT COUNT(*)
  INTO v_total_shops
  FROM shops
  WHERE is_active = true;

  -- Build result
  v_result := jsonb_build_object(
    'success', true,
    'today_delivered', v_today_delivered,
    'today_collected', v_today_collected,
    'pending', v_total_pending,
    'shops_visited', v_shops_visited,
    'total_shops', v_total_shops
  );

  RETURN v_result;
END;
$$;

-- Verify the function exists
SELECT verify_functions();

