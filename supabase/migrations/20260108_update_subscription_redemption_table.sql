-- Update subscription_redemption table to support complete workflow
ALTER TABLE subscription_redemption
  ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  ADD COLUMN nav NUMERIC(20, 4),
  ADD COLUMN total_amount NUMERIC(20, 2),
  ADD COLUMN processed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN failure_reason TEXT,
  ADD COLUMN processed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN completed_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Update existing records to set default values
UPDATE subscription_redemption
SET status = 'completed',
    nav = 0,
    total_amount = 0
WHERE status IS NULL;

-- Create index for status field
CREATE INDEX IF NOT EXISTS idx_subscription_redemption_status ON subscription_redemption(status);
