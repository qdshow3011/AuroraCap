-- 创建内参分类表
CREATE TABLE IF NOT EXISTS internal_reference_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_internal_reference_categories_name ON internal_reference_categories(name);
CREATE INDEX IF NOT EXISTS idx_internal_reference_categories_sort_order ON internal_reference_categories(sort_order);

-- 添加注释
COMMENT ON TABLE internal_reference_categories IS '内参分类表';
COMMENT ON COLUMN internal_reference_categories.id IS '分类ID';
COMMENT ON COLUMN internal_reference_categories.name IS '分类名称';
COMMENT ON COLUMN internal_reference_categories.description IS '分类描述';
COMMENT ON COLUMN internal_reference_categories.sort_order IS '排序顺序';
COMMENT ON COLUMN internal_reference_categories.created_at IS '创建时间';
COMMENT ON COLUMN internal_reference_categories.updated_at IS '更新时间';

-- 添加触发器以自动更新 updated_at 字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_internal_reference_categories_updated_at
  BEFORE UPDATE ON internal_reference_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 插入默认分类数据
INSERT INTO internal_reference_categories (name, description, sort_order) VALUES
('研究报告', '各类研究报告和调研文档', 1),
('分析评论', '市场分析和评论文章', 2),
('投资策略', '投资策略和建议', 3),
('业绩报告', '业绩报告和统计数据', 4),
('其他', '其他类型的内参', 5)
ON CONFLICT DO NOTHING;
