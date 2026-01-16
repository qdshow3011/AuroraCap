-- 为news表添加new_id字段，实现自动递增功能
-- 执行此迁移前请确保已备份数据

-- 步骤1: 添加new_id字段（整数）
ALTER TABLE news ADD COLUMN IF NOT EXISTS new_id BIGINT;

-- 步骤2: 创建序列
CREATE SEQUENCE IF NOT EXISTS news_new_id_seq START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

-- 步骤3: 为现有记录分配new_id值（按published_at降序排列）
UPDATE news 
SET new_id = subquery.row_num
FROM (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY published_at DESC NULLS LAST, created_at DESC) as row_num
  FROM news
  WHERE new_id IS NULL
) subquery
WHERE news.id = subquery.id;

-- 步骤4: 设置new_id的默认值为序列的下一个值
ALTER TABLE news ALTER COLUMN new_id SET DEFAULT nextval('news_new_id_seq');

-- 步骤5: 设置序列的所有者
ALTER SEQUENCE news_new_id_seq OWNED BY news.new_id;

-- 步骤6: 重置序列到当前最大new_id + 1
SELECT setval('news_new_id_seq', COALESCE((SELECT MAX(new_id) FROM news), 0) + 1, false);

-- 步骤7: 添加唯一约束（可选）
ALTER TABLE news ADD CONSTRAINT IF NOT EXISTS news_new_id_unique UNIQUE (new_id);

-- 步骤8: 验证设置
SELECT 
  '当前最大new_id' as description,
  COALESCE(MAX(new_id), 0) as value
FROM news
UNION ALL
SELECT 
  '序列当前值' as description,
  last_value as value
FROM news_new_id_seq;

-- 步骤9: 添加注释
COMMENT ON COLUMN news.new_id IS '新闻序号（自动递增，从1开始）';
COMMENT ON SEQUENCE news_new_id_seq IS 'news表new_id的自增序列';
