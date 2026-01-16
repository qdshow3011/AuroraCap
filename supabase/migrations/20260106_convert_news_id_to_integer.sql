-- 将news表的id从UUID转换为整数自增
-- 执行此迁移前请确保已备份数据

-- 步骤1: 创建新的news表，使用整数ID
CREATE TABLE IF NOT EXISTS news_new (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  category TEXT DEFAULT 'market',
  status TEXT DEFAULT 'published',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE,
  title_cn TEXT,
  content_cn TEXT,
  category_cn TEXT,
  image_url TEXT,
  source TEXT,
  source_id TEXT,
  url TEXT
);

-- 步骤2: 复制数据到新表，按published_at降序排列，ID从1开始
INSERT INTO news_new (id, title, content, category, status, created_at, updated_at, published_at, title_cn, content_cn, category_cn, image_url, source, source_id, url)
SELECT 
  ROW_NUMBER() OVER (ORDER BY published_at DESC NULLS LAST) as id,
  title,
  content,
  category,
  status,
  created_at,
  updated_at,
  published_at,
  title_cn,
  content_cn,
  category_cn,
  image_url,
  source,
  source_id,
  url
FROM news;

-- 步骤3: 删除旧表
DROP TABLE news;

-- 步骤4: 重命名新表为news
ALTER TABLE news_new RENAME TO news;

-- 步骤5: 添加唯一约束
ALTER TABLE news 
ADD CONSTRAINT IF NOT EXISTS news_source_id_unique UNIQUE (source_id);

-- 步骤6: 重置序列，确保下次插入从正确的ID开始
SELECT setval(
  pg_get_serial_sequence('news', 'id'),
  COALESCE((SELECT MAX(id) FROM news), 0) + 1,
  false
);

-- 步骤7: 添加注释
COMMENT ON TABLE news IS '新闻表';
COMMENT ON COLUMN news.id IS '新闻ID（整数自增）';
COMMENT ON COLUMN news.title IS '新闻标题';
COMMENT ON COLUMN news.content IS '新闻内容';
COMMENT ON COLUMN news.category IS '新闻分类';
COMMENT ON COLUMN news.status IS '新闻状态';
COMMENT ON COLUMN news.title_cn IS '标题（中文翻译）';
COMMENT ON COLUMN news.content_cn IS '内容（中文翻译）';
COMMENT ON COLUMN news.category_cn IS '分类（中文翻译）';
COMMENT ON COLUMN news.image_url IS '新闻图片URL';
COMMENT ON COLUMN news.source IS '新闻来源';
COMMENT ON COLUMN news.source_id IS '新闻来源ID';
COMMENT ON COLUMN news.url IS '新闻链接';
