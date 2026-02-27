-- 修复id_number字段的非空约束，允许为空
-- 创建时间: 2026-02-24

-- 移除id_number的NOT NULL约束
ALTER TABLE users ALTER COLUMN id_number DROP NOT NULL;

-- 添加注释说明
COMMENT ON COLUMN users.id_number IS '身份证号/护照号码，可选字段';
