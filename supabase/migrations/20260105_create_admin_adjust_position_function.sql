-- 创建admin_adjust_position函数用于管理员调整用户持仓

CREATE OR REPLACE FUNCTION public.admin_adjust_position(
    position_id UUID, 
    new_shares NUMERIC, 
    new_avg_cost NUMERIC
) RETURNS JSONB AS $$
DECLARE
    updated_position RECORD;
    result JSONB;
BEGIN
    -- 更新持仓表中的份额和平均成本
    UPDATE positions
    SET 
        shares = new_shares,
        avg_cost = new_avg_cost,
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
            'created_at', updated_position.created_at,
            'updated_at', updated_position.updated_at
        )
    );
END;
$$ LANGUAGE plpgsql;

-- 设置函数的执行权限
ALTER FUNCTION public.admin_adjust_position(UUID, NUMERIC, NUMERIC) 
    SET search_path = public;  

-- 允许authenticated用户执行此函数
GRANT EXECUTE ON FUNCTION public.admin_adjust_position(UUID, NUMERIC, NUMERIC) 
    TO authenticated;
