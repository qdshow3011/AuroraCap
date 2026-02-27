// 修复positions表的外键约束脚本
const { createClient } = require('@supabase/supabase-js');

// 使用环境变量中的Supabase配置
const SUPABASE_URL = 'https://mptprqlndfbhguqklnnx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_x3J89NuOrsaIei0SsGMN_g_poYCwQnw';

// 创建Supabase客户端
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 执行SQL命令修复外键约束
async function fixForeignKey() {
  try {
    // 首先检查是否有足够的权限执行这些操作
    // 注意：使用anon key可能没有足够的权限执行DDL操作
    // 如果失败，可能需要使用service role key
    
    console.log('开始修复外键约束...');
    
    // 删除现有的外键约束
    const { error: dropError } = await supabase.rpc('pg_safer_ddl_script', {
      sql: 'ALTER TABLE positions DROP CONSTRAINT IF EXISTS positions_fund_id_fkey;'
    });
    
    if (dropError) {
      console.error('删除外键约束失败:', dropError);
    } else {
      console.log('成功删除现有的外键约束');
    }
    
    // 添加新的外键约束，指向products表
    const { error: addError } = await supabase.rpc('pg_safer_ddl_script', {
      sql: 'ALTER TABLE positions ADD CONSTRAINT positions_fund_id_fkey FOREIGN KEY (fund_id) REFERENCES products(id) ON DELETE CASCADE;'
    });
    
    if (addError) {
      console.error('添加新的外键约束失败:', addError);
    } else {
      console.log('成功添加新的外键约束');
    }
    
    if (!dropError && !addError) {
      console.log('外键约束修复成功！');
    }
    
  } catch (error) {
    console.error('执行脚本时发生错误:', error);
    console.log('\n注意：使用anon key可能没有足够的权限执行DDL操作。');
    console.log('您可能需要使用service role key或直接在Supabase控制台执行以下SQL命令：');
    console.log('\nALTER TABLE positions DROP CONSTRAINT IF EXISTS positions_fund_id_fkey;');
    console.log('ALTER TABLE positions ADD CONSTRAINT positions_fund_id_fkey FOREIGN KEY (fund_id) REFERENCES products(id) ON DELETE CASCADE;');
  }
}

// 运行脚本
fixForeignKey();