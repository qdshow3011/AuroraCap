-- 修改 yahoo_indices 表的 data_source 约束，添加 'mock' 选项

-- 1. 删除旧的 check constraint
ALTER TABLE yahoo_indices DROP CONSTRAINT IF EXISTS yahoo_indices_data_source_check;

-- 2. 添加新的 check constraint，包含 'mock' 选项
ALTER TABLE yahoo_indices 
ADD CONSTRAINT yahoo_indices_data_source_check 
CHECK (data_source IN ('yahoo-finance2', 'manual', 'mock'));