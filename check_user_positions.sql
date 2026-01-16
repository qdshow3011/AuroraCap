-- 检查朱家友用户的信息
SELECT id, name, email, role FROM users WHERE name = '朱家友';

-- 检查朱家友用户的持仓数据
SELECT * FROM positions WHERE user_id IN (SELECT id FROM users WHERE name = '朱家友');

-- 检查positions表的结构
SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'positions';

-- 检查positions表的RLS策略
SELECT * FROM pg_policies WHERE tablename = 'positions';
