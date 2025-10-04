-- Database Functions for Milk Delivery App
-- Generated on: 2025-10-04 07:41:03.773799+00
-- Database: postgres
-- Version: PostgreSQL 17.6

-- ==============================================
-- CORE BUSINESS FUNCTIONS
-- ==============================================

-- Add Delivery Function
CREATE OR REPLACE FUNCTION add_delivery(
  p_shop_id UUID,
  p_delivery_boy_id UUID,
  p_products JSONB,
  p_delivery_date DATE DEFAULT CURRENT_DATE,
  p_notes TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
DECLARE
  v_delivery_id UUID;
  v_total_amount NUMERIC := 0;
  v_product JSONB;
  v_price NUMERIC;
  v_quantity INTEGER;
  v_subtotal NUMERIC;
  v_products_with_prices JSONB := '[]'::JSONB;
  v_shop_name TEXT;
BEGIN
  -- Validate inputs
  IF p_products IS NULL OR jsonb_array_length(p_products) = 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'At least one product is required'
    );
  END IF;

  -- Get shop name for activity log
  SELECT name INTO v_shop_name FROM shops WHERE id = p_shop_id;
  
  -- Process each product and calculate total
  FOR v_product IN SELECT * FROM jsonb_array_elements(p_products)
  LOOP
    -- Get price from milk_types table
    SELECT price_per_packet INTO v_price
    FROM milk_types
    WHERE id = (v_product->>'milk_type_id')::UUID
    AND is_active = true;
    
    IF v_price IS NULL THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Invalid or inactive milk type'
      );
    END IF;
    
    v_quantity := (v_product->>'quantity')::INTEGER;
    
    IF v_quantity <= 0 THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Quantity must be greater than 0'
      );
    END IF;
    
    v_subtotal := v_price * v_quantity;
    v_total_amount := v_total_amount + v_subtotal;
    
    -- Build product array with prices
    v_products_with_prices := v_products_with_prices || 
      jsonb_build_object(
        'milk_type_id', v_product->>'milk_type_id',
        'quantity', v_quantity,
        'price_per_packet', v_price,
        'subtotal', v_subtotal
      );
  END LOOP;

  -- Insert delivery
  INSERT INTO deliveries (
    shop_id,
    delivery_boy_id,
    delivery_date,
    products,
    total_amount,
    payment_amount,
    payment_status,
    is_archived,
    notes
  ) VALUES (
    p_shop_id,
    p_delivery_boy_id,
    p_delivery_date,
    v_products_with_prices,
    v_total_amount,
    0,
    'pending',
    false,
    p_notes
  )
  RETURNING id INTO v_delivery_id;

  -- Log activity
  INSERT INTO activity_log (
    shop_id,
    delivery_boy_id,
    activity_type,
    message,
    amount,
    delivery_date,
    metadata
  ) VALUES (
    p_shop_id,
    p_delivery_boy_id,
    'delivery_added',
    'Delivery added to ' || v_shop_name || ': ₹' || v_total_amount,
    v_total_amount,
    p_delivery_date,
    jsonb_build_object('delivery_id', v_delivery_id)
  );

  -- Return success with delivery details
  RETURN jsonb_build_object(
    'success', true,
    'delivery_id', v_delivery_id,
    'total_amount', v_total_amount,
    'products', v_products_with_prices,
    'message', 'Delivery added successfully'
  );
END;
$$;

-- Process Payment Function
CREATE OR REPLACE FUNCTION process_payment(
  p_shop_id UUID,
  p_amount NUMERIC,
  p_collected_by TEXT DEFAULT NULL,
  p_payment_date DATE DEFAULT CURRENT_DATE,
  p_notes TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
DECLARE
  v_payment_id UUID;
  v_remaining_amount NUMERIC;
  v_applied_amount NUMERIC := 0;
  v_history_record RECORD;
  v_delivery_record RECORD;
  v_to_apply NUMERIC;
  v_shop_name TEXT;
  v_affected_deliveries JSONB := '[]'::JSONB;
  v_affected_history JSONB := '[]'::JSONB;
BEGIN
  -- Validate amount
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Payment amount must be greater than 0'
    );
  END IF;

  -- Get shop name
  SELECT name INTO v_shop_name FROM shops WHERE id = p_shop_id;
  
  IF v_shop_name IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Shop not found'
    );
  END IF;

  v_remaining_amount := p_amount;

  -- Create payment record
  INSERT INTO payments (
    shop_id,
    payment_date,
    amount,
    payment_type,
    collected_by,
    notes
  ) VALUES (
    p_shop_id,
    p_payment_date,
    p_amount,
    'collection',
    p_collected_by,
    p_notes
  )
  RETURNING id INTO v_payment_id;

  -- STEP 1: Pay old pending history first (FIFO - oldest first)
  FOR v_history_record IN
    SELECT * FROM shop_pending_history
    WHERE shop_id = p_shop_id
    ORDER BY original_date ASC, created_at ASC
  LOOP
    EXIT WHEN v_remaining_amount <= 0;
    
    v_to_apply := LEAST(v_remaining_amount, v_history_record.pending_amount);
    
    IF v_to_apply >= v_history_record.pending_amount THEN
      -- Fully paid - delete from history
      DELETE FROM shop_pending_history WHERE id = v_history_record.id;
    ELSE
      -- Partially paid - update remaining
      UPDATE shop_pending_history
      SET pending_amount = pending_amount - v_to_apply,
          updated_at = now()
      WHERE id = v_history_record.id;
    END IF;
    
    v_remaining_amount := v_remaining_amount - v_to_apply;
    v_applied_amount := v_applied_amount + v_to_apply;
    
    v_affected_history := v_affected_history || jsonb_build_object(
      'history_id', v_history_record.id,
      'original_date', v_history_record.original_date,
      'amount_applied', v_to_apply
    );
  END LOOP;

  -- STEP 2: Pay today's deliveries (FIFO - oldest first)
  FOR v_delivery_record IN
    SELECT * FROM deliveries
    WHERE shop_id = p_shop_id
      AND is_archived = false
      AND payment_status != 'paid'
    ORDER BY delivery_date ASC, created_at ASC
  LOOP
    EXIT WHEN v_remaining_amount <= 0;
    
    v_to_apply := LEAST(v_remaining_amount, v_delivery_record.total_amount - v_delivery_record.payment_amount);
    
    UPDATE deliveries
    SET 
      payment_amount = payment_amount + v_to_apply,
      payment_status = CASE
        WHEN payment_amount + v_to_apply >= total_amount THEN 'paid'
        WHEN payment_amount + v_to_apply > 0 THEN 'partial'
        ELSE 'pending'
      END,
      updated_at = now()
    WHERE id = v_delivery_record.id;
    
    v_remaining_amount := v_remaining_amount - v_to_apply;
    v_applied_amount := v_applied_amount + v_to_apply;
    
    v_affected_deliveries := v_affected_deliveries || jsonb_build_object(
      'delivery_id', v_delivery_record.id,
      'delivery_date', v_delivery_record.delivery_date,
      'amount_applied', v_to_apply
    );
  END LOOP;

  -- Update payment record with affected deliveries
  UPDATE payments
  SET applied_to_deliveries = jsonb_build_object(
    'deliveries', v_affected_deliveries,
    'history', v_affected_history
  )
  WHERE id = v_payment_id;

  -- Log activity
  INSERT INTO activity_log (
    shop_id,
    activity_type,
    message,
    amount,
    delivery_date,
    metadata
  ) VALUES (
    p_shop_id,
    CASE
      WHEN v_applied_amount = p_amount THEN 'payment_collected'
      ELSE 'payment_partial'
    END,
    'Collected ₹' || p_amount || ' from ' || v_shop_name,
    p_amount,
    p_payment_date,
    jsonb_build_object('payment_id', v_payment_id)
  );

  -- Return success with details
  RETURN jsonb_build_object(
    'success', true,
    'payment_id', v_payment_id,
    'amount_paid', p_amount,
    'amount_applied', v_applied_amount,
    'amount_remaining', v_remaining_amount,
    'affected_deliveries', v_affected_deliveries,
    'affected_history', v_affected_history,
    'message', 'Payment processed successfully'
  );
END;
$$;

-- Process Daily Reset Function
CREATE OR REPLACE FUNCTION process_daily_reset(
  p_date DATE DEFAULT CURRENT_DATE
) RETURNS JSONB
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
DECLARE
  v_processed_deliveries INTEGER := 0;
  v_total_pending NUMERIC := 0;
  v_delivery RECORD;
BEGIN
  -- Process each delivery for the specified date
  FOR v_delivery IN
    SELECT * FROM deliveries
    WHERE delivery_date = p_date
      AND is_archived = false
  LOOP
    -- Calculate pending amount for this delivery
    v_total_pending := v_total_pending + (v_delivery.total_amount - v_delivery.payment_amount);

    -- Handle different payment statuses
    IF v_delivery.payment_status = 'paid' THEN
      -- Fully paid - just archive it
      UPDATE deliveries
      SET is_archived = true,
          updated_at = now()
      WHERE id = v_delivery.id;

    ELSIF v_delivery.payment_status IN ('pending', 'partial', 'pay_tomorrow') THEN
      -- Pending, partial, or pay tomorrow - move to history if there's pending amount
      IF v_delivery.total_amount > v_delivery.payment_amount THEN
        INSERT INTO shop_pending_history (
          shop_id,
          original_delivery_id,
          original_date,
          pending_amount,
          note
        ) VALUES (
          v_delivery.shop_id,
          v_delivery.id,
          v_delivery.delivery_date,
          v_delivery.total_amount - v_delivery.payment_amount,
          CASE
            WHEN v_delivery.payment_status = 'pay_tomorrow' THEN 'Payment was deferred to tomorrow'
            ELSE 'Pending from ' || p_date::TEXT
          END
        );
      END IF;

      -- Archive the delivery (mark as processed for the day)
      UPDATE deliveries
      SET is_archived = true,
          updated_at = now()
      WHERE id = v_delivery.id;
    END IF;

    v_processed_deliveries := v_processed_deliveries + 1;
  END LOOP;

  -- Return summary
  RETURN jsonb_build_object(
    'success', true,
    'date_reset', p_date,
    'processed_deliveries', v_processed_deliveries,
    'total_pending_moved', v_total_pending,
    'message', 'Daily reset completed successfully'
  );
END;
$$;

-- Mark Pay Tomorrow Function
CREATE OR REPLACE FUNCTION mark_pay_tomorrow(
  p_shop_id UUID,
  p_notes TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
DECLARE
  v_delivery RECORD;
  v_affected_count INTEGER := 0;
BEGIN
  -- Find today's deliveries for this shop that have pending amounts and aren't already deferred
  FOR v_delivery IN
    SELECT * FROM deliveries
    WHERE shop_id = p_shop_id
      AND delivery_date = CURRENT_DATE
      AND is_archived = false
      AND payment_status IN ('pending', 'partial')
      AND (total_amount - payment_amount) > 0
  LOOP
    -- Mark as pay tomorrow status (don't archive, don't move to history)
    UPDATE deliveries
    SET payment_status = 'pay_tomorrow',
        notes = COALESCE(p_notes, 'Payment deferred to tomorrow'),
        updated_at = now()
    WHERE id = v_delivery.id;

    v_affected_count := v_affected_count + 1;
  END LOOP;

  -- Log activity
  INSERT INTO activity_log (
    shop_id,
    activity_type,
    message,
    delivery_date,
    metadata
  ) VALUES (
    p_shop_id,
    'payment_deferred',
    'Payment deferred to tomorrow for ' || v_affected_count || ' deliveries',
    CURRENT_DATE,
    jsonb_build_object(
      'affected_deliveries', v_affected_count,
      'notes', p_notes
    )
  );

  -- Return success
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Payment deferred to tomorrow',
    'affected_deliveries', v_affected_count
  );
END;
$$;

-- ==============================================
-- VIEW FUNCTIONS
-- ==============================================

-- Get Today Collection View
CREATE OR REPLACE FUNCTION get_today_collection_view(p_date DATE)
RETURNS TABLE(
  shop_id UUID,
  shop_name TEXT,
  shop_phone TEXT,
  shop_owner TEXT,
  today_delivered NUMERIC,
  today_paid NUMERIC,
  today_pending NUMERIC,
  old_pending NUMERIC,
  total_pending NUMERIC,
  status TEXT,
  delivery_count INTEGER
)
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH today_deliveries AS (
    SELECT 
      d.shop_id as sid,
      COALESCE(SUM(d.total_amount), 0) as delivered,
      COALESCE(SUM(d.payment_amount), 0) as paid,
      COALESCE(SUM(CASE WHEN d.payment_status = 'pay_tomorrow' THEN d.total_amount - d.payment_amount ELSE 0 END), 0) as pay_tomorrow_amount,
      COUNT(*) as del_count
    FROM deliveries d
    WHERE d.delivery_date = p_date
      AND d.is_archived = false  -- ONLY active deliveries
    GROUP BY d.shop_id
  ),
  shop_totals AS (
    SELECT
      s.id as sid,
      s.name as sname,
      s.phone as sphone,
      s.owner_name as sowner,
      COALESCE(td.delivered, 0) as t_delivered,
      COALESCE(td.paid, 0) as t_paid,
      COALESCE(td.delivered, 0) - COALESCE(td.paid, 0) as t_pending,
      COALESCE(td.pay_tomorrow_amount, 0) as t_pay_tomorrow,
      0::NUMERIC as o_pending,  -- NO OLD PENDING in today's view
      COALESCE(td.del_count, 0)::INTEGER as d_count
    FROM shops s
    LEFT JOIN today_deliveries td ON s.id = td.sid
    WHERE s.is_active = true
      AND td.delivered IS NOT NULL  -- ONLY shops with TODAY's ACTIVE deliveries
  )
  SELECT
    st.sid,
    st.sname,
    st.sphone,
    st.sowner,
    st.t_delivered,
    st.t_paid,
    st.t_pending,
    st.o_pending,
    st.t_pending + st.o_pending as total_pend,
    CASE
      WHEN st.t_pending = 0 AND st.t_paid > 0 THEN 'paid'  -- Show paid when pending is 0
      WHEN st.t_paid > 0 AND st.t_pending > 0 THEN 'partial'  -- Show partial when some payment made
      WHEN st.t_pay_tomorrow > 0 THEN 'pay_tomorrow'  -- Show pay_tomorrow when there are pay_tomorrow deliveries
      WHEN st.t_pending > 0 THEN 'pending'  -- Show pending when no payment
      ELSE 'pending'  -- Default to pending
    END as stat,
    st.d_count
  FROM shop_totals st
  -- Show ALL shops with today's ACTIVE deliveries (even paid ones)
  ORDER BY total_pend DESC, st.sname ASC;
END;
$$;

-- Get Reports Collection View
CREATE OR REPLACE FUNCTION get_reports_collection_view(p_date DATE)
RETURNS TABLE(
  shop_id UUID,
  shop_name TEXT,
  shop_phone TEXT,
  shop_owner TEXT,
  today_delivered NUMERIC,
  today_paid NUMERIC,
  today_pending NUMERIC,
  old_pending NUMERIC,
  total_pending NUMERIC,
  status TEXT,
  delivery_count BIGINT
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
      -- Include ALL deliveries for the date (both archived and active)
      COALESCE(SUM(CASE WHEN d.delivery_date = p_date THEN d.total_amount ELSE 0 END), 0) as s_today_delivered,
      COALESCE(SUM(CASE WHEN d.delivery_date = p_date THEN d.payment_amount ELSE 0 END), 0) as s_today_paid,
      -- Calculate pending amounts
      COALESCE(SUM(CASE WHEN d.delivery_date = p_date AND d.payment_status != 'pay_tomorrow' THEN (d.total_amount - d.payment_amount) ELSE 0 END), 0) as s_today_pending,
      COALESCE(SUM(CASE WHEN d.delivery_date < p_date THEN (d.total_amount - d.payment_amount) ELSE 0 END), 0) as s_old_pending,
      COUNT(CASE WHEN d.delivery_date = p_date THEN 1 END) as s_delivery_count,
      -- Check if there are any pay_tomorrow deliveries
      COUNT(CASE WHEN d.delivery_date = p_date AND d.payment_status = 'pay_tomorrow' THEN 1 END) as s_pay_tomorrow_count
    FROM shops s
    LEFT JOIN deliveries d ON s.id = d.shop_id
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
  WHERE ss.delivery_count > 0  -- Show all shops that have deliveries for the date
  ORDER BY ss.total_pending DESC, ss.shop_name ASC;
END;
$$;

-- Get Reports Shop Detail View
CREATE OR REPLACE FUNCTION get_reports_shop_detail_view(p_shop_id UUID, p_date DATE)
RETURNS TABLE(
  shop_id UUID,
  shop_name TEXT,
  shop_owner TEXT,
  shop_phone TEXT,
  shop_address TEXT,
  delivery_date DATE,
  total_delivered NUMERIC,
  total_paid NUMERIC,
  total_pending NUMERIC,
  delivery_count INTEGER,
  products_delivered JSONB,
  payment_history JSONB,
  delivery_notes TEXT
)
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id as shop_id,
    s.name as shop_name,
    s.owner_name as shop_owner,
    s.phone as shop_phone,
    s.address as shop_address,
    p_date as delivery_date,
    COALESCE(SUM(d.total_amount), 0) as total_delivered,
    COALESCE(SUM(d.payment_amount), 0) as total_paid,
    COALESCE(SUM(d.total_amount - d.payment_amount), 0) as total_pending,
    COUNT(d.id)::INTEGER as delivery_count,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'delivery_id', d.id,
          'products', (
            SELECT jsonb_agg(
              jsonb_build_object(
                'name', mt.name,
                'quantity', product_item->>'quantity',
                'subtotal', product_item->>'subtotal',
                'price_per_packet', product_item->>'price_per_packet'
              )
            )
            FROM jsonb_array_elements(d.products) AS product_item
            LEFT JOIN milk_types mt ON (product_item->>'milk_type_id')::uuid = mt.id
          ),
          'total_amount', d.total_amount,
          'payment_amount', d.payment_amount,
          'payment_status', d.payment_status,
          'delivery_boy', db.name,
          'delivered_at', d.created_at
        )
      ) FILTER (WHERE d.id IS NOT NULL), 
      '[]'::jsonb
    ) as products_delivered,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'payment_id', p.id,
            'amount', p.amount,
            'payment_date', p.payment_date,
            'collected_by', p.collected_by,
            'notes', p.notes,
            'created_at', p.created_at
          )
        )
        FROM payments p
        WHERE p.shop_id = s.id 
          AND p.payment_date = p_date
      ),
      '[]'::jsonb
    ) as payment_history,
    COALESCE(
      (
        SELECT string_agg(d.notes, '; ')
        FROM deliveries d
        WHERE d.shop_id = s.id 
          AND d.delivery_date = p_date
          AND d.notes IS NOT NULL
      ),
      ''
    ) as delivery_notes
  FROM shops s
  LEFT JOIN deliveries d ON s.id = d.shop_id 
    AND d.delivery_date = p_date 
    -- Include ALL deliveries for reports (both active and archived)
  LEFT JOIN delivery_boys db ON d.delivery_boy_id = db.id
  WHERE s.id = p_shop_id
  GROUP BY s.id, s.name, s.owner_name, s.phone, s.address;
END;
$$;

-- Get Reports Daily Summary
CREATE OR REPLACE FUNCTION get_reports_daily_summary(p_date DATE)
RETURNS TABLE(
  total_delivered NUMERIC,
  total_collected NUMERIC,
  total_pending NUMERIC,
  fully_paid_shops BIGINT,
  partially_paid_shops BIGINT,
  pending_shops BIGINT,
  total_shops BIGINT
)
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH daily_totals AS (
    SELECT 
      -- Include ALL deliveries for the date (both archived and active)
      COALESCE(SUM(d.total_amount), 0) as total_delivered,
      COALESCE(SUM(d.payment_amount), 0) as total_collected,
      COALESCE(SUM(d.total_amount - d.payment_amount), 0) as total_pending,
      COUNT(CASE WHEN d.payment_status = 'paid' OR (d.total_amount - d.payment_amount) = 0 THEN 1 END) as fully_paid_count,
      COUNT(CASE WHEN d.payment_status = 'partial' THEN 1 END) as partially_paid_count,
      COUNT(CASE WHEN d.payment_status = 'pending' OR d.payment_status = 'pay_tomorrow' THEN 1 END) as pending_count,
      COUNT(DISTINCT d.shop_id) as total_shops_count
    FROM deliveries d
    WHERE d.delivery_date = p_date
  )
  SELECT 
    dt.total_delivered,
    dt.total_collected,
    dt.total_pending,
    dt.fully_paid_count,
    dt.partially_paid_count,
    dt.pending_count,
    dt.total_shops_count
  FROM daily_totals dt;
END;
$$;

-- ==============================================
-- UTILITY FUNCTIONS
-- ==============================================

-- Get Shop Balance
CREATE OR REPLACE FUNCTION get_shop_balance(p_shop_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
DECLARE
  v_result JSONB;
  v_shop_name TEXT;
  v_total_delivered NUMERIC;
  v_total_paid NUMERIC;
  v_today_delivered NUMERIC;
  v_today_paid NUMERIC;
  v_old_pending NUMERIC;
  v_deliveries_count INTEGER;
  v_pending_count INTEGER;
  v_last_delivery_date DATE;
BEGIN
  -- Get shop name
  SELECT name INTO v_shop_name
  FROM shops
  WHERE id = p_shop_id;
  
  IF v_shop_name IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Shop not found'
    );
  END IF;

  -- Get all-time totals (including archived)
  SELECT
    COALESCE(SUM(total_amount), 0),
    COALESCE(SUM(payment_amount), 0),
    COUNT(*),
    COUNT(CASE WHEN payment_status != 'paid' THEN 1 END),
    MAX(delivery_date)
  INTO
    v_total_delivered,
    v_total_paid,
    v_deliveries_count,
    v_pending_count,
    v_last_delivery_date
  FROM deliveries
  WHERE shop_id = p_shop_id;

  -- Get today's totals (active only)
  SELECT
    COALESCE(SUM(total_amount), 0),
    COALESCE(SUM(payment_amount), 0)
  INTO
    v_today_delivered,
    v_today_paid
  FROM deliveries
  WHERE shop_id = p_shop_id
    AND delivery_date = CURRENT_DATE
    AND is_archived = false;

  -- Get old pending from history
  SELECT COALESCE(SUM(pending_amount), 0)
  INTO v_old_pending
  FROM shop_pending_history
  WHERE shop_id = p_shop_id;

  -- Build result
  v_result := jsonb_build_object(
    'success', true,
    'shop_id', p_shop_id,
    'shop_name', v_shop_name,
    'total_delivered', v_total_delivered,
    'total_paid', v_total_paid,
    'total_pending', (v_total_delivered - v_total_paid) + v_old_pending,
    'today_delivered', v_today_delivered,
    'today_paid', v_today_paid,
    'today_pending', v_today_delivered - v_today_paid,
    'old_pending', v_old_pending,
    'deliveries_count', v_deliveries_count,
    'pending_deliveries_count', v_pending_count,
    'last_delivery_date', v_last_delivery_date
  );

  RETURN v_result;
END;
$$;

-- Verify Functions
CREATE OR REPLACE FUNCTION verify_functions()
RETURNS TABLE(function_name TEXT, function_exists BOOLEAN)
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.func_name::TEXT,
        EXISTS(
            SELECT 1 FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public'
            AND p.proname = f.func_name
        ) as function_exists
    FROM (
        VALUES 
            ('add_delivery'),
            ('process_payment'),
            ('process_daily_reset'),
            ('mark_pay_tomorrow'),
            ('get_today_collection_view'),
            ('get_reports_collection_view'),
            ('get_reports_shop_detail_view'),
            ('get_reports_daily_summary'),
            ('get_shop_balance'),
            ('verify_functions')
    ) AS f(func_name);
END;
$$;
