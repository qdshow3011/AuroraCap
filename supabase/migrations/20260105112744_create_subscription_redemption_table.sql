-- Create subscription_redemption table
CREATE TABLE IF NOT EXISTS subscription_redemption (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  fund_id UUID REFERENCES products(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('subscription', 'redemption')),
  shares NUMERIC(20, 2) NOT NULL CHECK (shares > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subscription_redemption_user_id ON subscription_redemption(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_redemption_fund_id ON subscription_redemption(fund_id);
CREATE INDEX IF NOT EXISTS idx_subscription_redemption_type ON subscription_redemption(type);
CREATE INDEX IF NOT EXISTS idx_subscription_redemption_created_at ON subscription_redemption(created_at DESC);

-- Create trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_subscription_redemption_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_subscription_redemption_updated_at
BEFORE UPDATE ON subscription_redemption
FOR EACH ROW
EXECUTE FUNCTION update_subscription_redemption_updated_at();