-- 更新users表的role约束，添加fund_company角色
-- 创建时间: 2026-02-24

-- 先删除旧的约束
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- 添加新的约束，包含fund_company角色
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'partner', 'fund_company', 'waiter', 'customer'));

-- 添加注释
COMMENT ON CONSTRAINT users_role_check ON users IS '用户角色约束，允许的角色: admin, partner, fund_company, waiter, customer';
