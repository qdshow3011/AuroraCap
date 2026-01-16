-- 简单修复：只解除角色约束
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
