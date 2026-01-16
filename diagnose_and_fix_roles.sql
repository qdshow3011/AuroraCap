-- 诊断和修复用户角色约束问题

-- =====================================
-- 诊断步骤
-- =====================================

-- 1. 查看users表的结构，特别是role字段的定义和约束
\d users

-- 2. 查看users_role_check约束的具体定义
SELECT conname, consrc 
FROM pg_constraint 
WHERE conname = 'users_role_check' 
AND conrelid = 'users'::regclass;

-- 3. 查看所有用户的role值，找出不符合约束的值
SELECT DISTINCT role, count(*) 
FROM users 
GROUP BY role;

-- =====================================
-- 修复步骤
-- =====================================

-- 1. 先解除现有的role字段check约束
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- 2. 确认约束已解除
\d users

-- 3. 更新所有用户角色，确保使用正确的英文角色值
UPDATE users SET role = 'admin' WHERE role IN ('管理员', '系统管理员');
UPDATE users SET role = 'partner' WHERE role IN ('合伙人');
UPDATE users SET role = 'customer' WHERE role IN ('客户', '特约观察员');
UPDATE users SET role = 'waiter' WHERE role IN ('服务员');

-- 4. 再次确认所有角色值都是英文
UPDATE users SET role = 'customer' WHERE role NOT IN ('admin', 'partner', 'customer', 'waiter');

-- 5. 查看更新后的角色分布
SELECT DISTINCT role, count(*) 
FROM users 
GROUP BY role;

-- 6. 添加新的role字段约束，只允许英文角色值
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'partner', 'customer', 'waiter'));

-- 7. 验证约束已添加
\d users

-- 8. 测试插入一个新用户，验证约束是否正常工作
-- INSERT INTO users (name, email, phone, status, password, role, customer_number, id_number) 
-- VALUES ('测试用户', 'test@example.com', '13800000001', 'active', 'hashed_password', 'customer', 'TEST001', '123456789012345678');

-- 9. 如果测试成功，删除测试用户
-- DELETE FROM users WHERE email = 'test@example.com';

-- =====================================
-- 完成
-- =====================================
-- 所有用户角色约束问题已修复
