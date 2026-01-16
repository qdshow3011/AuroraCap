-- Add nav field to subscription_redemption table for cost calculation
ALTER TABLE subscription_redemption ADD COLUMN IF NOT EXISTS nav NUMERIC(20, 4) DEFAULT 0;
ALTER TABLE subscription_redemption ADD COLUMN IF NOT EXISTS total_amount NUMERIC(20, 2) DEFAULT 0;

-- Add comment to document the purpose
COMMENT ON COLUMN subscription_redemption.nav IS '净值 at the time of subscription/redemption, used for cost calculation';
COMMENT ON COLUMN subscription_redemption.total_amount IS '总金额 = shares * nav, used for cost calculation';
