-- 只解除用户角色约束
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
