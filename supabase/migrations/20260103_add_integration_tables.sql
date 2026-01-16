-- 创建IBKR Flex API相关表

-- IBKR资产表：存储从IBKR Flex API获取的资产数据
CREATE TABLE IF NOT EXISTS ibkr_assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id TEXT NOT NULL,
    symbol TEXT NOT NULL,
    description TEXT,
    quantity NUMERIC NOT NULL DEFAULT 0,
    market_value NUMERIC NOT NULL DEFAULT 0,
    cost_basis NUMERIC NOT NULL DEFAULT 0,
    is_abnormal BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(account_id, symbol)
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_ibkr_assets_account_id ON ibkr_assets(account_id);
CREATE INDEX IF NOT EXISTS idx_ibkr_assets_symbol ON ibkr_assets(symbol);
CREATE INDEX IF NOT EXISTS idx_ibkr_assets_updated_at ON ibkr_assets(updated_at);

-- 资产告警表：存储资产异常波动告警
CREATE TABLE IF NOT EXISTS asset_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol TEXT NOT NULL,
    account_id TEXT NOT NULL,
    alert_type TEXT NOT NULL,
    description TEXT,
    market_value NUMERIC NOT NULL DEFAULT 0,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_asset_alerts_symbol ON asset_alerts(symbol);
CREATE INDEX IF NOT EXISTS idx_asset_alerts_account_id ON asset_alerts(account_id);
CREATE INDEX IF NOT EXISTS idx_asset_alerts_timestamp ON asset_alerts(timestamp);

-- 创建Yahoo Finance API相关表

-- Yahoo指数表：存储当前指数数据
CREATE TABLE IF NOT EXISTS yahoo_indices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol TEXT NOT NULL UNIQUE,
    name TEXT,
    price NUMERIC NOT NULL DEFAULT 0,
    change NUMERIC NOT NULL DEFAULT 0,
    change_percent NUMERIC NOT NULL DEFAULT 0,
    previous_close NUMERIC NOT NULL DEFAULT 0,
    open NUMERIC NOT NULL DEFAULT 0,
    high NUMERIC NOT NULL DEFAULT 0,
    low NUMERIC NOT NULL DEFAULT 0,
    volume NUMERIC NOT NULL DEFAULT 0,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_yahoo_indices_symbol ON yahoo_indices(symbol);
CREATE INDEX IF NOT EXISTS idx_yahoo_indices_updated_at ON yahoo_indices(updated_at);

-- Yahoo指数历史表：存储指数历史数据
CREATE TABLE IF NOT EXISTS yahoo_indices_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol TEXT NOT NULL,
    price NUMERIC NOT NULL DEFAULT 0,
    change NUMERIC NOT NULL DEFAULT 0,
    change_percent NUMERIC NOT NULL DEFAULT 0,
    volume NUMERIC NOT NULL DEFAULT 0,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_yahoo_indices_history_symbol ON yahoo_indices_history(symbol);
CREATE INDEX IF NOT EXISTS idx_yahoo_indices_history_timestamp ON yahoo_indices_history(timestamp);

-- 指数告警表：存储指数异常变化告警
CREATE TABLE IF NOT EXISTS index_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol TEXT NOT NULL,
    alert_type TEXT NOT NULL,
    description TEXT,
    change_percent NUMERIC NOT NULL DEFAULT 0,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_index_alerts_symbol ON index_alerts(symbol);
CREATE INDEX IF NOT EXISTS idx_index_alerts_timestamp ON index_alerts(timestamp);

-- 创建基金相关表（用于基金净值计算）

-- 产品持仓表：存储基金持仓信息
CREATE TABLE IF NOT EXISTS product_holdings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    asset_id UUID REFERENCES ibkr_assets(id) ON DELETE SET NULL,
    quantity NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_product_holdings_product_id ON product_holdings(product_id);
CREATE INDEX IF NOT EXISTS idx_product_holdings_asset_id ON product_holdings(asset_id);

-- 基金净值历史表：存储基金净值历史记录
CREATE TABLE IF NOT EXISTS fund_nav_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    nav NUMERIC NOT NULL DEFAULT 0,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_fund_nav_history_product_id ON fund_nav_history(product_id);
CREATE INDEX IF NOT EXISTS idx_fund_nav_history_timestamp ON fund_nav_history(timestamp);

-- 更新时间戳的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为所有带updated_at字段的表添加触发器
DO $$ 
DECLARE 
    tbl_name text;
    trigger_name text;
BEGIN 
    FOR tbl_name IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
        AND table_schema = 'public'
    LOOP 
        trigger_name := format('update_%I_updated_at', tbl_name);
        
        -- 先检查触发器是否存在，如果存在则删除
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I;', trigger_name, tbl_name);
        
        -- 创建新的触发器
        EXECUTE format('CREATE TRIGGER %I 
                        BEFORE UPDATE ON %I 
                        FOR EACH ROW 
                        EXECUTE FUNCTION update_updated_at_column();', 
                        trigger_name, tbl_name);
    END LOOP;
END $$;
