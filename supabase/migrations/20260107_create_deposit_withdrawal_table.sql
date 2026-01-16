-- Create deposit_withdrawal table for managing deposits and withdrawals
CREATE TABLE IF NOT EXISTS deposit_withdrawal (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('deposit', 'withdrawal')),
  amount NUMERIC(20, 2) NOT NULL CHECK (amount > 0),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notes TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_deposit_withdrawal_user_id ON deposit_withdrawal(user_id);
CREATE INDEX IF NOT EXISTS idx_deposit_withdrawal_type ON deposit_withdrawal(type);
CREATE INDEX IF NOT EXISTS idx_deposit_withdrawal_status ON deposit_withdrawal(status);
CREATE INDEX IF NOT EXISTS idx_deposit_withdrawal_created_at ON deposit_withdrawal(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_deposit_withdrawal_transaction_date ON deposit_withdrawal(transaction_date DESC);

-- Create trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_deposit_withdrawal_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_deposit_withdrawal_updated_at
BEFORE UPDATE ON deposit_withdrawal
FOR EACH ROW
EXECUTE FUNCTION update_deposit_withdrawal_updated_at();
