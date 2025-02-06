-- Create plan_config table if it doesn't exist
CREATE TABLE IF NOT EXISTS plan_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Pro Plan',
  description text NOT NULL DEFAULT 'Get unlimited access to all features',
  price integer NOT NULL DEFAULT 299,
  tokens integer NOT NULL DEFAULT 15,
  features jsonb NOT NULL DEFAULT '["Access to all exam types", "Detailed explanations", "Save unlimited questions", "Priority support"]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE plan_config ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow read access to all users"
  ON plan_config
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admin to manage plan config"
  ON plan_config
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' = '192043@nith.ac.in')
  WITH CHECK (auth.jwt() ->> 'email' = '192043@nith.ac.in');

-- Insert default Pro Plan configuration if not exists
INSERT INTO plan_config (name, description, price, tokens, features)
SELECT 
  'Pro Plan',
  'Get unlimited access to all features',
  299,
  15,
  '[
    "Access to all exam types",
    "Detailed explanations",
    "Save unlimited questions",
    "Priority support"
  ]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM plan_config);

-- Create function to update plan config
CREATE OR REPLACE FUNCTION update_plan_config(
  new_price integer,
  new_description text,
  new_tokens integer,
  new_features jsonb
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin
  IF auth.jwt() ->> 'email' != '192043@nith.ac.in' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Unauthorized: Only admin can update plan configuration'
    );
  END IF;

  -- Update the plan configuration
  UPDATE plan_config
  SET 
    price = new_price,
    description = new_description,
    tokens = new_tokens,
    features = new_features,
    updated_at = now();

  RETURN json_build_object(
    'success', true,
    'message', 'Plan configuration updated successfully'
  );
END;
$$;

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_plan_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_plan_config_timestamp
  BEFORE UPDATE ON plan_config
  FOR EACH ROW
  EXECUTE FUNCTION update_plan_config_updated_at();