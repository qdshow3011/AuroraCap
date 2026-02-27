// 检查产品ID是否存在的脚本
const { createClient } = require('@supabase/supabase-js');

// 使用环境变量中的Supabase配置
const SUPABASE_URL = 'https://mptprqlndfbhguqklnnx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_x3J89NuOrsaIei0SsGMN_g_poYCwQnw';

// 创建Supabase客户端
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 要检查的产品ID
const productIdToCheck = '08d9c298-0c2b-4d96-b47e-f98c615a1774';

async function checkProductExists() {
  try {
    console.log(`检查产品ID ${productIdToCheck} 是否存在于products表中...`);
    
    // 查询指定ID的产品
    const { data: product, error } = await supabase
      .from('products')
      .select('id, name_cn, name_en')
      .eq('id', productIdToCheck)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log(`产品ID ${productIdToCheck} 在products表中不存在`);
      } else {
        console.error('查询产品失败:', error);
      }
    } else {
      console.log(`产品ID ${productIdToCheck} 存在于products表中:`);
      console.log('产品信息:', product);
    }
    
    // 查询所有产品，检查可用的产品ID
    console.log('\n所有可用的产品ID:');
    const { data: allProducts, error: allError } = await supabase
      .from('products')
      .select('id, name_cn, name_en');
    
    if (allError) {
      console.error('查询所有产品失败:', allError);
    } else {
      allProducts.forEach((product, index) => {
        console.log(`${index + 1}. ID: ${product.id}, 名称: ${product.name_cn || product.name_en}`);
      });
      
      console.log(`\n共有 ${allProducts.length} 个产品在products表中`);
    }
    
  } catch (error) {
    console.error('执行脚本时发生错误:', error);
  }
}

// 运行脚本
checkProductExists();