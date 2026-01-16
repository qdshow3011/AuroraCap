-- 添加source_id和source字段到news表
ALTER TABLE news 
ADD COLUMN IF NOT EXISTS source TEXT,
ADD COLUMN IF NOT EXISTS source_id TEXT;

-- 创建唯一约束以避免重复新闻
CREATE UNIQUE INDEX IF NOT EXISTS news_source_id_idx ON news(source_id);

-- 添加注释
COMMENT ON COLUMN news.source IS '新闻来源（如：finnhub）';
COMMENT ON COLUMN news.source_id IS '来源新闻ID';
