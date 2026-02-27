-- 添加内参表缺少的字段
ALTER TABLE internal_references
ADD COLUMN author TEXT,
ADD COLUMN summary TEXT,
ADD COLUMN cover_image TEXT;

-- 可选：为现有数据设置默认值
UPDATE internal_references
SET author = '未知作者',
    summary = '无摘要',
    cover_image = ''
WHERE author IS NULL;

-- 可选：添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_internal_references_author ON internal_references(author);
CREATE INDEX IF NOT EXISTS idx_internal_references_status ON internal_references(status);