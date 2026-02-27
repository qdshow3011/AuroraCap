-- 创建基金公司资料表
-- 创建时间: 2026-02-24

-- 创建基金公司资料表
CREATE TABLE IF NOT EXISTS fund_company_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    company_name TEXT NOT NULL,
    license_number TEXT,
    company_description TEXT,
    contact_person TEXT,
    contact_phone TEXT UNIQUE, -- 电话号码，用于关联基金管理员
    company_address TEXT,
    established_date DATE,
    aum DECIMAL(20, 2), -- 管理资产规模
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 添加注释
COMMENT ON TABLE fund_company_profiles IS '基金公司资料表，通过电话号码与基金管理员关联';
COMMENT ON COLUMN fund_company_profiles.user_id IS '关联的用户ID（基金管理员）';
COMMENT ON COLUMN fund_company_profiles.contact_phone IS '联系电话，用于关联基金管理员';
COMMENT ON COLUMN fund_company_profiles.company_name IS '公司名称';
COMMENT ON COLUMN fund_company_profiles.license_number IS '执照编号';
COMMENT ON COLUMN fund_company_profiles.aum IS '管理资产规模(Assets Under Management)';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_fund_company_profiles_user_id ON fund_company_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_fund_company_profiles_contact_phone ON fund_company_profiles(contact_phone);
CREATE INDEX IF NOT EXISTS idx_fund_company_profiles_status ON fund_company_profiles(status);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_fund_company_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_fund_company_profiles_updated_at ON fund_company_profiles;

CREATE TRIGGER trigger_update_fund_company_profiles_updated_at
    BEFORE UPDATE ON fund_company_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_fund_company_profiles_updated_at();

-- 创建RLS策略
ALTER TABLE fund_company_profiles ENABLE ROW LEVEL SECURITY;

-- 管理员可以查看所有记录
DROP POLICY IF EXISTS "Admin can view all fund company profiles" ON fund_company_profiles;
CREATE POLICY "Admin can view all fund company profiles"
    ON fund_company_profiles
    FOR SELECT
    TO authenticated
    USING (auth.role() = 'admin');

-- 管理员可以插入记录
DROP POLICY IF EXISTS "Admin can insert fund company profiles" ON fund_company_profiles;
CREATE POLICY "Admin can insert fund company profiles"
    ON fund_company_profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.role() = 'admin');

-- 管理员可以更新记录
DROP POLICY IF EXISTS "Admin can update fund company profiles" ON fund_company_profiles;
CREATE POLICY "Admin can update fund company profiles"
    ON fund_company_profiles
    FOR UPDATE
    TO authenticated
    USING (auth.role() = 'admin');

-- 管理员可以删除记录
DROP POLICY IF EXISTS "Admin can delete fund company profiles" ON fund_company_profiles;
CREATE POLICY "Admin can delete fund company profiles"
    ON fund_company_profiles
    FOR DELETE
    TO authenticated
    USING (auth.role() = 'admin');

-- 基金公司用户可以查看自己的记录
DROP POLICY IF EXISTS "Fund company can view own profile" ON fund_company_profiles;
CREATE POLICY "Fund company can view own profile"
    ON fund_company_profiles
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- 基金公司用户可以更新自己的记录
DROP POLICY IF EXISTS "Fund company can update own profile" ON fund_company_profiles;
CREATE POLICY "Fund company can update own profile"
    ON fund_company_profiles
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());
