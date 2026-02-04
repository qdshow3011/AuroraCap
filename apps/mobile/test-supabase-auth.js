const { createClient } = require('@supabase/supabase-js');

// 当前使用的配置
const url = 'https://mptprqlndfbhguqklnnx.supabase.co';
const currentKey = 'sb_publishable_x3J89NuOrsaIei0SsGMN_g_poYCwQnw';

// 测试当前配置
async function testSupabaseAuth() {
  console.log('Testing Supabase Auth with current configuration:');
  console.log('URL:', url);
  console.log('Key:', currentKey);
  console.log('Key length:', currentKey.length);
  
  try {
    const supabase = createClient(url, currentKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false
      }
    });
    
    console.log('\n1. Supabase client created successfully');
    
    // 测试1: 检查用户表是否可访问
    console.log('\n2. Testing users table access:');
    try {
      const { data, error } = await supabase.from('users').select('*').limit(1);
      if (error) {
        console.error('Error accessing users table:', error.message, error.code);
      } else {
        console.log('Successfully accessed users table:', data ? `Found ${data.length} records` : 'No records found');
      }
    } catch (error) {
      console.error('Exception accessing users table:', error.message);
    }
    
    // 测试2: 尝试登录（使用已知的手机号码转换为邮箱）
    console.log('\n3. Testing login functionality:');
    const phone = '13800138000';
    const email = `${phone}@auroracm.net`;
    const password = 'test1234';
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('Login error:', error.message, error.code);
      } else {
        console.log('Login successful:', data);
      }
    } catch (error) {
      console.error('Exception during login:', error.message);
    }
    
    // 测试3: 尝试注册（使用测试数据）
    console.log('\n4. Testing signup functionality:');
    const testPhone = '13800138001';
    const testEmail = `${testPhone}@auroracm.net`;
    const testPassword = 'test1234';
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword
      });
      
      if (error) {
        console.error('Signup error:', error.message, error.code);
      } else {
        console.log('Signup successful:', data);
        
        // 如果注册成功，清理测试数据
        if (data.user) {
          console.log('\n5. Cleaning up test user...');
          const { error: deleteError } = await supabase.auth.admin.deleteUser(data.user.id);
          if (deleteError) {
            console.error('Error deleting test user:', deleteError.message);
          } else {
            console.log('Test user deleted successfully');
          }
        }
      }
    } catch (error) {
      console.error('Exception during signup:', error.message);
    }
    
  } catch (error) {
    console.error('Overall exception:', error.message);
  }
}

testSupabaseAuth();
