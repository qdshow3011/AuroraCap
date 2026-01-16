-- Add new fields to ib_fund_data table
ALTER TABLE public.ib_fund_data ADD COLUMN reserved_fees NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE public.ib_fund_data ADD COLUMN latest_shares NUMERIC(10, 2) DEFAULT 0;
