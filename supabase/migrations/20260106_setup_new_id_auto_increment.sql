-- 设置news表new_id字段的自动递增功能
-- 功能：确保new_id字段实现1、2、3、4、5……自动连续编号
-- 执行方式：在Supabase SQL编辑器中直接执行

-- 步骤1：创建序列
CREATE SEQUENCE IF NOT EXISTS news_new_id_seq 
  START WITH 1 
  INCREMENT BY 1 
  NO MINVALUE 
  NO MAXVALUE 
  CACHE 1;

-- 步骤2：为现有数据分配new_id（按发布时间降序排列）
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

-- 步骤3：设置new_id字段的默认值为序列的下一个值
ALTER TABLE news 
ALTER COLUMN new_id 
SET DEFAULT nextval('news_new_id_seq');

-- 步骤4：将序列与news表的new_id字段关联
ALTER SEQUENCE news_new_id_seq 
OWNED BY news.new_id;

-- 步骤5：重置序列，确保下次插入从当前最大new_id+1开始
SELECT setval(
  'news_new_id_seq',
  COALESCE((SELECT MAX(new_id) FROM news), 0) + 1,
  false
);

-- 步骤6：添加注释
COMMENT ON SEQUENCE news_new_id_seq IS '新闻表new_id自增序列，确保new_id从1开始连续编号';
COMMENT ON COLUMN news.new_id IS '新闻的自增ID，用于实现1、2、3、4、5……自动编号';

-- 验证结果
SELECT 
  '当前最大new_id' as description,
  COALESCE(MAX(new_id), 0)::text as value
FROM news
UNION ALL
SELECT 
  '序列当前值' as description,
  last_value::text as value
FROM news_new_id_seq
UNION ALL
SELECT 
  '序列是否已设置' as description,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM pg_attrdef 
      WHERE adrelid = 'news'::regclass 
      AND adnum = (SELECT attnum FROM pg_attribute WHERE attname = 'new_id' AND attrelid = 'news'::regclass)
      AND pg_get_expr(adbin, adrelid) LIKE '%news_new_id_seq%'
    ) THEN '是'
    ELSE '否'
  END as value;
