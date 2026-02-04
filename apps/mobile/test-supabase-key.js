const { createClient } = require('@supabase/supabase-js');

// 当前使用的配置
const url = 'https://mptprqlndfbhguqklnnx.supabase.co';
const currentKey = 'sb_publishable_x3J89NuOrsaIei0SsGMN_g_poYCwQnw';

// 测试当前密钥
async function testCurrentKey() {
  console.log('Testing current key:', currentKey);
  console.log('Key length:', currentKey.length);
  
  try {
    const supabase = createClient(url, currentKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false
      }
    });
    
    console.log('Supabase client created');
    
    // 尝试进行简单的认证操作
    const { data, error } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'test1234'
    });
    
    if (error) {
      console.error('SignUp error:', error.message, error.code);
    } else {
      console.log('SignUp successful:', data);
    }
    
  } catch (error) {
    console.error('Exception:', error.message);
  }
}

testCurrentKey();
