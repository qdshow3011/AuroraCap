// 使用Supabase客户端修复用户角色约束问题
const { createClient } = require('@supabase/supabase-js');

// 从环境变量获取Supabase配置
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('请设置EXPO_PUBLIC_SUPABASE_URL和EXPO_PUBLIC_SUPABASE_ANON_KEY环境变量');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixUserRoles() {
  try {
    console.log('开始修复用户角色约束...');

    // 1. 先解除现有的role字段check约束
    console.log('1. 解除现有的role字段check约束...');
    await supabase.rpc('execute_sql', { sql: 'ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;' });
    console.log('✓ 已解除现有约束');

    // 2. 确保所有角色值都是正确的英文角色值
    console.log('2. 更新中文角色值为英文...');
    await supabase.rpc('execute_sql', { sql: "UPDATE users SET role = 'admin' WHERE role IN ('管理员', '系统管理员');" });
    await supabase.rpc('execute_sql', { sql: "UPDATE users SET role = 'partner' WHERE role IN ('合伙人');" });
    await supabase.rpc('execute_sql', { sql: "UPDATE users SET role = 'customer' WHERE role IN ('客户', '特约观察员');" });
    await supabase.rpc('execute_sql', { sql: "UPDATE users SET role = 'waiter' WHERE role IN ('服务员');" });
    console.log('✓ 已更新中文角色值');

    // 3. 再次确保所有角色值都是英文
    console.log('3. 确保所有角色值都是英文...');
    await supabase.rpc('execute_sql', { sql: "UPDATE users SET role = 'customer' WHERE role NOT IN ('admin', 'partner', 'customer', 'waiter');" });
    console.log('✓ 已确保所有角色值都是英文');

    // 4. 添加新的role字段约束，只允许英文角色值
    console.log('4. 添加新的role字段约束...');
    await supabase.rpc('execute_sql', { sql: "ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'partner', 'customer', 'waiter'));" });
    console.log('✓ 已添加新约束');

    console.log('\n🎉 用户角色约束修复成功！');
  } catch (error) {
    console.error('❌ 修复过程中发生错误:', error.message);
    console.error('详细错误:', error);
  }
}

fixUserRoles();
