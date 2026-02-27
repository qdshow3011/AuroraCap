-- 为fund_company_profiles表添加控制用户字段
-- 创建时间: 2026-02-24

-- 添加control_user_id字段，用于关联基金管理员
ALTER TABLE fund_company_profiles ADD COLUMN IF NOT EXISTS control_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- 添加注释
COMMENT ON COLUMN fund_company_profiles.control_user_id IS '控制用户ID，关联users表中role为fund_company的用户（基金管理人）';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_fund_company_profiles_control_user_id ON fund_company_profiles(control_user_id);
