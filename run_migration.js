// 运行Supabase迁移脚本
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({
  path: './apps/admin/.env'
});

// 从环境变量获取Supabase配置
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration. Please check your .env file.');
  process.exit(1);
}

// 创建Supabase客户端
const supabase = createClient(supabaseUrl, supabaseKey);

// 迁移SQL
const migrationSql = `
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
`;

// 执行迁移
async function runMigration() {
  try {
    console.log('Running migration...');
    const { error } = await supabase.rpc('execute_sql', {
      sql: migrationSql
    });

    if (error) {
      throw error;
    }

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
