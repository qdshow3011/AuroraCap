-- 为 yahoo_indices 表添加管理字段
-- 这些字段用于监控和管理指数数据的同步状态

ALTER TABLE yahoo_indices 
ADD COLUMN IF NOT EXISTS market_type TEXT NOT NULL DEFAULT 'other' 
CHECK (market_type IN ('us', 'cn', 'hk', 'crypto', 'commodity', 'other'));

ALTER TABLE yahoo_indices 
ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE yahoo_indices 
ADD COLUMN IF NOT EXISTS sync_status TEXT NOT NULL DEFAULT 'pending' 
CHECK (sync_status IN ('success', 'failed', 'pending'));

ALTER TABLE yahoo_indices 
ADD COLUMN IF NOT EXISTS last_sync_time TIMESTAMPTZ;

ALTER TABLE yahoo_indices 
ADD COLUMN IF NOT EXISTS sync_error_message TEXT;

ALTER TABLE yahoo_indices 
ADD COLUMN IF NOT EXISTS data_source TEXT NOT NULL DEFAULT 'yahoo-finance2' 
CHECK (data_source IN ('yahoo-finance2', 'manual'));

-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_yahoo_indices_market_type ON yahoo_indices(market_type);
CREATE INDEX IF NOT EXISTS idx_yahoo_indices_is_enabled ON yahoo_indices(is_enabled);
CREATE INDEX IF NOT EXISTS idx_yahoo_indices_sync_status ON yahoo_indices(sync_status);
CREATE INDEX IF NOT EXISTS idx_yahoo_indices_last_sync_time ON yahoo_indices(last_sync_time);

-- 为现有数据设置默认值
UPDATE yahoo_indices 
SET 
  market_type = CASE 
    WHEN symbol LIKE '^%' THEN 'us'
    WHEN symbol LIKE '%.SH' OR symbol LIKE '%.SZ' THEN 'cn'
    WHEN symbol LIKE '^HS%' THEN 'hk'
    WHEN symbol LIKE '%-USD' THEN 'crypto'
    WHEN symbol LIKE '%=F' THEN 'commodity'
    ELSE 'other'
  END,
  is_enabled = true,
  sync_status = 'success',
  data_source = 'yahoo-finance2'
WHERE market_type = 'other' OR sync_status = 'pending';
