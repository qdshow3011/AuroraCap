-- 为fund_company_profiles表添加缺失的字段
-- 创建时间: 2026-02-24

-- 添加company_email字段
ALTER TABLE fund_company_profiles ADD COLUMN IF NOT EXISTS company_email TEXT;

-- 添加注释
COMMENT ON COLUMN fund_company_profiles.company_email IS '公司邮箱';

-- 移除contact_phone的唯一约束（如果存在），允许电话重复
-- 注意：如果已有数据违反唯一性约束，需要先处理这些数据
-- ALTER TABLE fund_company_profiles DROP CONSTRAINT IF EXISTS fund_company_profiles_contact_phone_key;
