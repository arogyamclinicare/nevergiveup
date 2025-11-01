-- Migration: Fix payment order - deliveries first, then manual pending
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/cqltkqwxbtbnunaiknau/sql

-- Update process_payment function to pay deliveries BEFORE manual pending
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

  -- STEP 1: Pay deliveries first (FIFO - oldest first)
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

  -- STEP 2: Pay manual pending history (FIFO - oldest first) - AFTER deliveries
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

