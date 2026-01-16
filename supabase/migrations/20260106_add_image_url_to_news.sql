-- 添加image_url字段到news表
ALTER TABLE news 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 添加注释
COMMENT ON COLUMN news.image_url IS '新闻图片URL';
