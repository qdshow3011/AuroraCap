-- 为news表的source_id字段添加唯一约束
ALTER TABLE news 
ADD CONSTRAINT IF NOT EXISTS news_source_id_unique UNIQUE (source_id);

-- 添加注释
COMMENT ON CONSTRAINT news_source_id_unique ON news IS '确保source_id字段的唯一性，避免重复新闻';
