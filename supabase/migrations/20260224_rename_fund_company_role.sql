-- 将角色从"基金公司"改为"基金管理员"
-- 创建时间: 2026-02-24

-- 更新user_roles表中的角色名称
UPDATE user_roles 
SET name = '基金管理员', 
    description = '基金管理员，可以管理基金公司信息、发布基金产品、与客户对话、编辑内参公众号'
WHERE code = 'fund_company';

-- 更新users表的约束，确保角色代码保持一致（还是fund_company，只是显示名称改变）
-- 注意：角色代码保持为fund_company，只有显示名称改为"基金管理员"

-- 添加注释说明
COMMENT ON TABLE fund_company_profiles IS '基金公司资料表，通过电话号码与基金管理员关联';
