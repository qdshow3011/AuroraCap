-- 更新 yahoo_indices 表的 data_source 约束，添加 alpha-vantage 作为有效的数据源

-- 移除旧的约束
ALTER TABLE yahoo_indices DROP CONSTRAINT IF EXISTS yahoo_indices_data_source_check;

-- 添加新的约束，包含 alpha-vantage
ALTER TABLE yahoo_indices 
ADD CONSTRAINT yahoo_indices_data_source_check 
CHECK (data_source IN ('yahoo-finance2', 'manual', 'finnhub', 'alpha-vantage'));

-- 为现有数据设置默认值（如果需要）
UPDATE yahoo_indices 
SET data_source = 'alpha-vantage' 
WHERE data_source = 'yahoo-finance2';

COMMIT;