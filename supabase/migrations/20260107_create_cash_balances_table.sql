-- 创建现金余额表，用于管理用户的现金余额、在途资金等信息
CREATE TABLE IF NOT EXISTS public.cash_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    cash_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00, -- 现金余额
    pending_funds NUMERIC(15, 2) NOT NULL DEFAULT 0.00, -- 在途资金
    total_deposits NUMERIC(15, 2) NOT NULL DEFAULT 0.00, -- 累计入金
    total_withdrawals NUMERIC(15, 2) NOT NULL DEFAULT 0.00, -- 累计出金
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 添加唯一约束，确保每个用户只有一条现金余额记录
ALTER TABLE public.cash_balances ADD CONSTRAINT unique_user_cash_balance UNIQUE (user_id);

-- 添加触发器，自动更新updated_at字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cash_balances_updated_at
BEFORE UPDATE ON public.cash_balances
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 设置RLS权限
ALTER TABLE public.cash_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to view their own cash balances" ON public.cash_balances
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own cash balances" ON public.cash_balances
    FOR UPDATE USING (auth.uid() = user_id);

-- 初始化数据：为每个现有用户创建一条现金余额记录
INSERT INTO public.cash_balances (user_id, cash_balance, pending_funds, total_deposits, total_withdrawals)
SELECT id, 100000.00, 0.00, 100000.00, 0.00 FROM public.users
WHERE NOT EXISTS (SELECT 1 FROM public.cash_balances WHERE cash_balances.user_id = users.id);
