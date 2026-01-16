-- 添加cash_balances表的INSERT策略

-- 允许管理员管理所有cash_balances操作
CREATE POLICY "Admins can manage cash balances" ON public.cash_balances
    FOR ALL
    USING (auth.role() = 'admin')
    WITH CHECK (auth.role() = 'admin');

-- 允许用户为自己插入cash_balances记录
CREATE POLICY "Allow users to insert their own cash balances" ON public.cash_balances
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
