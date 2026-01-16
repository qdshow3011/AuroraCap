-- 创建触发器函数，自动计算positions表的current_value字段

CREATE OR REPLACE FUNCTION public.calculate_positions_current_value()
RETURNS TRIGGER AS $$
BEGIN
    -- 计算current_value为shares和avg_cost的乘积，保留两位小数
    NEW.current_value := ROUND(NEW.shares * NEW.avg_cost, 2);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 在positions表上创建触发器，在INSERT和UPDATE时执行计算
CREATE TRIGGER update_positions_current_value
BEFORE INSERT OR UPDATE ON public.positions
FOR EACH ROW
EXECUTE FUNCTION public.calculate_positions_current_value();
