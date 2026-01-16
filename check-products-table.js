const { createClient } = require('@supabase/supabase-js');

// 直接使用从.env文件中获取的Supabase配置
const supabaseUrl = 'https://mptprqlndfbhguqklnnx.supabase.co';
const supabaseKey = 'sb_publishable_x3J89NuOrsaIei0SsGMN_g_poYCwQnw';

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase配置信息不完整');
  process.exit(1);
}

// 创建Supabase客户端
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProductsTable() {
  try {
    // 查询products表的前几条记录，查看字段结构
    const { data, error } = await supabase.from('products').select('*').limit(5);
    
    if (error) {
      console.error('查询products表失败:', error);
      return;
    }
    
    console.log('products表的前5条记录:');
    console.log(JSON.stringify(data, null, 2));
    
    // 如果有数据，打印第一条记录的字段名
    if (data && data.length > 0) {
      console.log('\nproducts表的字段名:');
      console.log(Object.keys(data[0]));
    }
  } catch (err) {
    console.error('检查products表时发生错误:', err);
  }
}

checkProductsTable();
