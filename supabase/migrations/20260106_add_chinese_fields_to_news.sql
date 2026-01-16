-- 添加中文翻译字段到news表
ALTER TABLE news 
ADD COLUMN IF NOT EXISTS title_cn TEXT,
ADD COLUMN IF NOT EXISTS content_cn TEXT,
ADD COLUMN IF NOT EXISTS category_cn TEXT;

-- 添加注释
COMMENT ON COLUMN news.title_cn IS '标题（中文翻译）';
COMMENT ON COLUMN news.content_cn IS '内容（中文翻译）';
COMMENT ON COLUMN news.category_cn IS '分类（中文翻译）';
