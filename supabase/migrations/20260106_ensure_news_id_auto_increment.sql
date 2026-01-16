-- 确保news表的id字段为自增整数
-- 执行此迁移前请确保已备份数据

-- 步骤1: 检查并删除现有的序列（如果存在）
DROP SEQUENCE IF EXISTS news_id_seq CASCADE;

-- 步骤2: 创建新的序列
CREATE SEQUENCE news_id_seq START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

-- 步骤3: 将id列设置为使用新序列
ALTER TABLE news ALTER COLUMN id SET DEFAULT nextval('news_id_seq');

-- 步骤4: 设置序列的所有者
ALTER SEQUENCE news_id_seq OWNED BY news.id;

-- 步骤5: 重置序列到当前最大id + 1
SELECT setval('news_id_seq', COALESCE((SELECT MAX(id) FROM news), 0) + 1, false);

-- 步骤6: 验证设置
SELECT 
  '当前最大id' as description,
  COALESCE(MAX(id), 0) as value
FROM news
UNION ALL
SELECT 
  '序列当前值' as description,
  last_value as value
FROM news_id_seq;

-- 步骤7: 添加注释
COMMENT ON SEQUENCE news_id_seq IS 'news表id的自增序列';
COMMENT ON COLUMN news.id IS '新闻ID（自动递增）';
