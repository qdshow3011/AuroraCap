-- 修复用户角色约束问题 - 只包含标准SQL语句

-- 1. 解除现有的role字段check约束
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- 2. 更新所有用户角色，确保使用正确的英文角色值
UPDATE users SET role = 'admin' WHERE role IN ('管理员', '系统管理员');
UPDATE users SET role = 'partner' WHERE role IN ('合伙人');
UPDATE users SET role = 'customer' WHERE role IN ('客户', '特约观察员');
UPDATE users SET role = 'waiter' WHERE role IN ('服务员');

-- 3. 再次确认所有角色值都是英文
UPDATE users SET role = 'customer' WHERE role NOT IN ('admin', 'partner', 'customer', 'waiter');

-- 4. 添加新的role字段约束，只允许英文角色值
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'partner', 'customer', 'waiter'));
