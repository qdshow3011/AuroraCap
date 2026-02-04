const { createClient } = require('@supabase/supabase-js');

// 当前使用的配置
const url = 'https://mptprqlndfbhguqklnnx.supabase.co';
const currentKey = 'sb_publishable_x3J89NuOrsaIei0SsGMN_g_poYCwQnw';

// 测试数据库结构
async function testDatabaseStructure() {
  console.log('Testing database structure...');
  
  try {
    const supabase = createClient(url, currentKey);
    
    console.log('\n1. Supabase client created successfully');
    
    // 测试1: 查看users表的结构（通过查询数据查看字段）
    console.log('\n2. Retrieving users table structure:');
    try {
      // 直接查询表数据查看现有字段
      const { data, error: selectError } = await supabase.from('users').select('*').limit(1);
      if (selectError) {
        console.error('Error selecting from users table:', selectError.message);
      } else if (data && data.length > 0) {
        console.log('Users table has the following fields:', Object.keys(data[0]));
        console.log('Sample user data:', data[0]);
      } else {
        console.log('Users table exists but is empty');
      }
    } catch (error) {
      console.error('Exception retrieving table structure:', error.message);
    }
    
    // 测试2: 查看所有表的名称
    console.log('\n3. Retrieving all tables:');
    try {
      const { data, error } = await supabase
        .from('pg_catalog.pg_tables')
        .select('tablename')
        .eq('schemaname', 'public')
        .order('tablename');
      
      if (error) {
        console.error('Error retrieving table list:', error.message);
      } else {
        console.log('Public tables:', data?.map(table => table.tablename) || []);
      }
    } catch (error) {
      console.error('Exception retrieving table list:', error.message);
    }
    
    // 测试3: 查看现有用户记录
    console.log('\n4. Retrieving existing user records:');
    try {
      const { data, error } = await supabase.from('users').select('*');
      if (error) {
        console.error('Error retrieving users:', error.message);
      } else {
        console.log(`Found ${data.length} users:`);
        data.forEach((user, index) => {
          console.log(`User ${index + 1}:`, {
            id: user.id,
            email: user.email,
            phone: user.phone,
            id_number: user.id_number,
            role: user.role
          });
        });
      }
    } catch (error) {
      console.error('Exception retrieving users:', error.message);
    }
    
  } catch (error) {
    console.error('Overall exception:', error.message);
  }
}

testDatabaseStructure();
