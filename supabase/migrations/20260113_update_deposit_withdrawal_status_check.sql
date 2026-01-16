-- Update deposit_withdrawal table status check constraint to use new 5-status system
ALTER TABLE deposit_withdrawal
  DROP CONSTRAINT IF EXISTS deposit_withdrawal_status_check,
  ADD CONSTRAINT deposit_withdrawal_status_check CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled'));
