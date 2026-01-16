-- 检查positions表的RLS设置
SELECT table_name, row_level_security FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'positions';

-- 检查positions表的现有策略
SELECT * FROM pg_policies WHERE tablename = 'positions';

-- 如果没有RLS策略，创建适当的策略
-- 允许用户查看自己的持仓
CREATE POLICY IF NOT EXISTS "Allow users to view their own positions" ON public.positions
    FOR SELECT USING (auth.uid() = user_id);

-- 允许用户更新自己的持仓（如果需要）
CREATE POLICY IF NOT EXISTS "Allow users to update their own positions" ON public.positions
    FOR UPDATE USING (auth.uid() = user_id);

-- 检查positions表的结构
SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'positions';

-- 测试查询，查看是否能获取到数据
SELECT * FROM public.positions LIMIT 5;