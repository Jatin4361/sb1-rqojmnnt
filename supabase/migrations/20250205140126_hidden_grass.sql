-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS create_razorpay_order;
DROP FUNCTION IF EXISTS verify_razorpay_payment;

-- Create function to create Razorpay order
CREATE OR REPLACE FUNCTION create_razorpay_order(
  amount_input integer,
  currency_input text,
  plan_id_input text,
  user_id_input uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  order_id text;
  receipt_id text;
BEGIN
  -- Generate a unique order ID and receipt ID using UUID
  order_id := 'order_' || substr(md5(random()::text), 1, 16);
  receipt_id := 'rcpt_' || substr(md5(random()::text), 1, 16);
  
  -- Insert payment record
  INSERT INTO payment_history (
    user_id,
    order_id,
    amount,
    plan_id,
    status
  ) VALUES (
    user_id_input,
    order_id,
    amount_input,
    plan_id_input,
    'pending'
  );

  RETURN json_build_object(
    'id', order_id,
    'amount', amount_input,
    'currency', currency_input,
    'receipt', receipt_id
  );
END;
$$;

-- Create function to verify Razorpay payment
CREATE OR REPLACE FUNCTION verify_razorpay_payment(
  payment_id_input text,
  order_id_input text,
  signature_input text,
  plan_id_input text,
  user_id_input uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payment_record payment_history;
  plan_config_record plan_config;
  current_tokens integer;
BEGIN
  -- Get payment record
  SELECT * INTO payment_record
  FROM payment_history
  WHERE order_id = order_id_input
  AND user_id = user_id_input;

  IF payment_record IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Payment record not found'
    );
  END IF;

  -- Get plan configuration
  SELECT * INTO plan_config_record
  FROM plan_config
  LIMIT 1;

  IF plan_config_record IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Plan configuration not found'
    );
  END IF;

  -- Update payment status
  UPDATE payment_history
  SET 
    payment_id = payment_id_input,
    status = 'success'
  WHERE id = payment_record.id;

  -- Get current tokens
  SELECT tokens INTO current_tokens
  FROM profiles
  WHERE id = user_id_input;

  -- Update user tokens and account type
  UPDATE profiles
  SET 
    tokens = current_tokens + plan_config_record.tokens,
    account_type = 'premium'
  WHERE id = user_id_input;

  RETURN json_build_object(
    'success', true,
    'user_id', user_id_input,
    'new_tokens', current_tokens + plan_config_record.tokens
  );
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION create_razorpay_order TO authenticated;
GRANT EXECUTE ON FUNCTION verify_razorpay_payment TO authenticated;