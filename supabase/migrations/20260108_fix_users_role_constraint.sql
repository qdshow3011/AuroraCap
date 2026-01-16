-- 修复users表的role字段约束

-- 1. 先解除现有的role字段check约束
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- 2. 添加新的role字段约束，允许admin, partner, customer, waiter角色
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'partner', 'customer', 'waiter'));
