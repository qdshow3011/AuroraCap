// Test script to check Supabase API key validity
const { createClient } = require('@supabase/supabase-js');

// Current key from the code
const currentKey = 'sb_publishable_x3J89NuOrsaIei0SsGMN_g_poYCwQnw';
const url = 'https://mptprqlndfbhguqklnnx.supabase.co';

console.log('Checking Supabase API key validity...');
console.log('URL:', url);
console.log('Key length:', currentKey.length);
console.log('Key starts with:', currentKey.substring(0, 50) + '...');

// Try to create client and test
async function testKey() {
  try {
    const supabase = createClient(url, currentKey);
    console.log('Client created successfully');
    
    // Try a simple API call
    const { data, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('API call error:', error);
      return false;
    }
    
    console.log('API call successful, key is valid!');
    return true;
  } catch (error) {
    console.error('Error testing key:', error);
    return false;
  }
}

testKey();