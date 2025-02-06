```sql
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own payment history" ON payment_history;
DROP POLICY IF EXISTS "System can insert payment history" ON payment_history;
DROP POLICY IF EXISTS "System can update payment history" ON payment_history;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS process_payment_success;

-- Create or update payment_history table
CREATE TABLE IF NOT EXISTS payment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  order_id text NOT NULL,
  payment_id text,
  amount integer NOT NULL,
  plan_id text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'success', 'failed'))
);

-- Enable RLS
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own payment history"
  ON payment_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert payment history"
  ON payment_history
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update payment history"
  ON payment_history
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create function to process successful payment
CREATE FUNCTION process_payment_success(
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
  plan_tokens integer;
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

  -- Get plan tokens
  CASE plan_id_input
    WHEN 'silver' THEN plan_tokens := 15;
    WHEN 'gold' THEN plan_tokens := 50;
    ELSE
      RETURN json_build_object(
        'success', false,
        'error', 'Invalid plan'
      );
  END CASE;

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
    tokens = current_tokens + plan_tokens,
    account_type = CASE 
      WHEN plan_id_input = 'gold' THEN 'premium'
      ELSE account_type
    END
  WHERE id = payment_record.user_id;

  RETURN json_build_object(
    'success', true,
    'user_id', payment_record.user_id,
    'new_tokens', current_tokens + plan_tokens
  );
END;
$$;
```