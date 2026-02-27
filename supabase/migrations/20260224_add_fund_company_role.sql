-- 添加基金公司角色到user_roles表
-- 创建时间: 2026-02-24

-- 插入基金公司角色
INSERT INTO user_roles (name, code, description) VALUES
('基金公司', 'fund_company', '基金公司用户，可以发布基金产品、与客户对话、编辑内参公众号')
ON CONFLICT (code) DO NOTHING;

-- 更新users表中role字段的约束（如果存在）
-- 注意：这里不做强制约束，保持灵活性

-- 添加注释说明
COMMENT ON TABLE user_roles IS '用户角色表，存储系统支持的所有角色类型';
COMMENT ON COLUMN user_roles.code IS '角色代码，用于程序识别，如: admin, partner, client, waiter, fund_company';
