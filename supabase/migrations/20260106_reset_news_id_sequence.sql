-- 重置news表的id序列，确保id从1开始连续排序

-- 重置序列到当前最大id + 1
SELECT setval(
  pg_get_serial_sequence('news', 'id'),
  COALESCE((SELECT MAX(id) FROM news), 0) + 1,
  false
);

-- 如果需要重新编号现有记录（可选，谨慎使用）
-- 注意：这会更新所有现有记录的id，可能影响外键关系
-- UPDATE news SET id = new_id FROM (
--   SELECT id, ROW_NUMBER() OVER (ORDER BY published_at DESC) as new_id
--   FROM news
-- ) as numbered WHERE news.id = numbered.id;

-- 添加注释
COMMENT ON FUNCTION setval IS '重置news表的id序列，确保id连续排序';
