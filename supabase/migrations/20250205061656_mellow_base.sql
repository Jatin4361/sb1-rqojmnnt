-- Drop existing function
DROP FUNCTION IF EXISTS process_payment_success;

-- Create updated function to handle pro plan
CREATE OR REPLACE FUNCTION process_payment_success(
  payment_id_input text,
  order_id_input text,
  plan_id_input text
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
  WHERE order_id = order_id_input;

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
  WHERE id = payment_record.user_id;

  -- Update user tokens and account type
  UPDATE profiles
  SET 
    tokens = current_tokens + plan_config_record.tokens,
    account_type = 'premium'
  WHERE id = payment_record.user_id;

  RETURN json_build_object(
    'success', true,
    'user_id', payment_record.user_id,
    'new_tokens', current_tokens + plan_config_record.tokens
  );
END;
$$;