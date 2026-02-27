-- 修复fund_company_profiles表的RLS策略
-- 创建时间: 2026-02-24

-- 先禁用RLS，确保可以操作
ALTER TABLE fund_company_profiles DISABLE ROW LEVEL SECURITY;

-- 重新启用RLS
ALTER TABLE fund_company_profiles ENABLE ROW LEVEL SECURITY;

-- 删除所有现有策略
DROP POLICY IF EXISTS "Admin can view all fund company profiles" ON fund_company_profiles;
DROP POLICY IF EXISTS "Admin can insert fund company profiles" ON fund_company_profiles;
DROP POLICY IF EXISTS "Admin can update fund company profiles" ON fund_company_profiles;
DROP POLICY IF EXISTS "Admin can delete fund company profiles" ON fund_company_profiles;
DROP POLICY IF EXISTS "Fund company can view own profile" ON fund_company_profiles;
DROP POLICY IF EXISTS "Fund company can update own profile" ON fund_company_profiles;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON fund_company_profiles;
DROP POLICY IF EXISTS "Allow all operations for service role" ON fund_company_profiles;

-- 创建允许所有已认证用户进行所有操作的策略（简化版，适用于开发环境）
-- 注意：生产环境应该使用更严格的策略
CREATE POLICY "Allow all operations for authenticated users"
    ON fund_company_profiles
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 或者使用基于用户角色的策略（需要配合users表的role字段）
-- 这个策略允许任何已认证用户查看所有记录
CREATE POLICY "Allow select for all authenticated"
    ON fund_company_profiles
    FOR SELECT
    TO authenticated
    USING (true);

-- 添加注释
COMMENT ON POLICY "Allow all operations for authenticated users" ON fund_company_profiles IS '允许所有已认证用户进行所有操作（开发环境使用）';
COMMENT ON POLICY "Allow select for all authenticated" ON fund_company_profiles IS '允许所有已认证用户查看记录';
