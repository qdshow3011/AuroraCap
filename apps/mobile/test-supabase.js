const { createClient } = require('@supabase/supabase-js');

// 使用与项目中相同的Supabase配置
const supabaseUrl = 'https://mptprqlndfbhguqklnnx.supabase.co';
const supabaseAnonKey = 'sb_publishable_x3J89NuOrsaIei0SsGMN_g_poYCwQnw';

// 创建Supabase客户端
const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('Supabase客户端创建成功:', !!supabase);

// 测试连接和数据获取
async function testSupabase() {
  try {
    console.log('\n测试获取products表数据...');
    
    // 先测试查询所有字段，了解表结构
    console.log('\n1. 查询所有字段...');
    const { data: allData, error: allError } = await supabase
      .from('products')
      .select('*')
      .limit(1);

    if (allError) {
      console.error('查询所有字段错误:', allError);
      // 如果查询所有字段失败，尝试查询基本字段
      console.log('\n2. 查询基本字段...');
      const { data: basicData, error: basicError } = await supabase
        .from('products')
        .select('id, name_cn, name_en')
        .limit(3);
      if (basicError) {
        console.error('查询基本字段错误:', basicError);
      } else {
        console.log('基本字段查询结果:', basicData);
        if (basicData.length > 0) {
          console.log('基本字段结构:', Object.keys(basicData[0]));
        }
      }
    } else {
      console.log('所有字段查询成功，表结构:', Object.keys(allData[0]));
      console.log('第一条数据:', allData[0]);
      
      // 然后测试具体需要的字段
      console.log('\n3. 查询需要的字段...');
      const { data: neededData, error: neededError } = await supabase
        .from('products')
        .select('id, name_cn, name_en')
        .order('created_at', { ascending: false })
        .limit(3);
      if (neededError) {
        console.error('查询需要的字段错误:', neededError);
      } else {
        console.log('需要的字段查询结果:', neededData);
      }
    }

  } catch (err) {
    console.error('发生异常:', err);
  }
}

// 运行测试
testSupabase();
