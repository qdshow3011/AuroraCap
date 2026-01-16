-- 修复users表中不符合约束的role值，然后再添加约束

-- 1. 先查询所有不符合新约束的role值
SELECT DISTINCT role FROM users WHERE role NOT IN ('admin', 'partner', 'customer', 'waiter');

-- 2. 将所有不符合约束的role值更新为customer（默认角色）
UPDATE users SET role = 'customer' WHERE role NOT IN ('admin', 'partner', 'customer', 'waiter');

-- 3. 解除现有的role字段check约束（如果存在）
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- 4. 添加新的role字段约束，允许admin, partner, customer, waiter角色
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'partner', 'customer', 'waiter'));
