-- 在内参表中添加分类关联字段
ALTER TABLE internal_references
ADD COLUMN category_id UUID REFERENCES internal_reference_categories(id) ON DELETE SET NULL;

-- 为现有数据设置默认分类ID（假设ID为'研究报告'的分类ID）
-- 注意：需要先执行 create_internal_reference_categories.sql 创建分类表和默认数据

-- 可选：添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_internal_references_category_id ON internal_references(category_id);

-- 添加注释
COMMENT ON COLUMN internal_references.category_id IS '分类ID，关联internal_reference_categories表';
