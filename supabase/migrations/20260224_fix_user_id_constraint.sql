-- 修复fund_company_profiles表的user_id字段约束
-- 创建时间: 2026-02-24

-- 移除user_id的NOT NULL约束
ALTER TABLE fund_company_profiles ALTER COLUMN user_id DROP NOT NULL;

-- 添加注释
COMMENT ON COLUMN fund_company_profiles.user_id IS '关联的用户ID（基金管理员），可为空';
