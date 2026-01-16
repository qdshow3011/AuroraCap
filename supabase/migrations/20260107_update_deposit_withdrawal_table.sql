-- Update deposit_withdrawal table to support complete deposit workflow
ALTER TABLE deposit_withdrawal
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status DROP CONSTRAINT IF EXISTS deposit_withdrawal_status_check,
  ADD CONSTRAINT deposit_withdrawal_status_check CHECK (status IN ('pending', 'approved', 'processed', 'completed', 'failed', 'cancelled')),
  ALTER COLUMN status SET DEFAULT 'pending';

-- Add columns for tracking workflow steps
ALTER TABLE deposit_withdrawal
  ADD COLUMN approved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN processed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN processed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN completed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN completed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN failure_reason TEXT;
