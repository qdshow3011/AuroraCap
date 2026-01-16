-- 添加特约观察员用户
INSERT INTO users (
    id,
    client_id,
    phone_number,
    email,
    password,
    nickname,
    role,
    created_at,
    updated_at
) VALUES (
    uuid_generate_v4(),
    'O000000001',
    '',
    'observer@auroracap.com',
    '',
    '特约观察员',
    'observer',
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- 为特约观察员用户创建一些示例持仓数据
INSERT INTO client_holdings (
    client_id,
    asset_id,
    quantity,
    created_at,
    updated_at
) VALUES (
    (SELECT id FROM users WHERE email = 'observer@auroracap.com'),
    (SELECT id FROM ibkr_assets WHERE symbol = 'AAPL' LIMIT 1),
    100,
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;

INSERT INTO client_holdings (
    client_id,
    asset_id,
    quantity,
    created_at,
    updated_at
) VALUES (
    (SELECT id FROM users WHERE email = 'observer@auroracap.com'),
    (SELECT id FROM ibkr_assets WHERE symbol = 'MSFT' LIMIT 1),
    50,
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;

-- 为特约观察员用户创建一些示例交易数据
INSERT INTO trades (
    client_id,
    symbol,
    quantity,
    price,
    trade_date,
    trade_type,
    created_at,
    updated_at
) VALUES (
    (SELECT id FROM users WHERE email = 'observer@auroracap.com'),
    'AAPL',
    100,
    180.50,
    NOW() - INTERVAL '1 day',
    'buy',
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;

INSERT INTO trades (
    client_id,
    symbol,
    quantity,
    price,
    trade_date,
    trade_type,
    created_at,
    updated_at
) VALUES (
    (SELECT id FROM users WHERE email = 'observer@auroracap.com'),
    'MSFT',
    50,
    380.25,
    NOW() - INTERVAL '2 days',
    'buy',
    NOW(),
    NOW()
) ON CONFLICT DO NOTHING;
