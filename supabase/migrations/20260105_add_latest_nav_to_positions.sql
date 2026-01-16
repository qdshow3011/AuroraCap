-- Add latest_nav column to positions table
ALTER TABLE positions ADD COLUMN latest_nav NUMERIC(10, 2) DEFAULT 0;

-- Update existing trigger function to use latest_nav for current_value calculation
CREATE OR REPLACE FUNCTION public.calculate_positions_current_value()
RETURNS TRIGGER AS $$
BEGIN
    NEW.current_value := ROUND(NEW.shares * NEW.latest_nav, 2); -- Updated from avg_cost to latest_nav
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update admin_adjust_position function to use latest_nav instead of avg_cost
CREATE OR REPLACE FUNCTION public.admin_adjust_position(
    position_id UUID, 
    new_shares NUMERIC, 
    new_latest_nav NUMERIC
) RETURNS JSONB AS $$
DECLARE
    updated_position RECORD;
    result JSONB;
BEGIN
    -- 更新持仓表中的份额和最新净值
    UPDATE positions
    SET 
        shares = new_shares,
        latest_nav = new_latest_nav,
        updated_at = NOW()
    WHERE id = position_id
    RETURNING * INTO updated_position;
    
    -- 检查是否找到并更新了持仓
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', '未找到指定的持仓记录'
        );
    END IF;
    
    -- 返回成功结果
    RETURN jsonb_build_object(
        'success', true,
        'position', jsonb_build_object(
            'id', updated_position.id,
            'user_id', updated_position.user_id,
            'fund_id', updated_position.fund_id,
            'shares', updated_position.shares,
            'avg_cost', updated_position.avg_cost,
            'latest_nav', updated_position.latest_nav,
            'created_at', updated_position.created_at,
            'updated_at', updated_position.updated_at
        )
    );
END;
$$ LANGUAGE plpgsql;

-- 更新函数的执行权限
ALTER FUNCTION public.admin_adjust_position(UUID, NUMERIC, NUMERIC) 
    SET search_path = public;  

-- 允许authenticated用户执行此函数
GRANT EXECUTE ON FUNCTION public.admin_adjust_position(UUID, NUMERIC, NUMERIC) 
    TO authenticated;
