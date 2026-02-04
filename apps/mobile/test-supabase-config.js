// Test script to verify Supabase configuration
require('dotenv').config();

console.log('Environment variables:');
console.log('EXPO_PUBLIC_SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
console.log('EXPO_PUBLIC_SUPABASE_ANON_KEY:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
console.log('API key length:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY.length : 0);
console.log('API key contains "...":', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY.includes('...') : false);

// Test Supabase client creation
const { createClient } = require('@supabase/supabase-js');

try {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    console.error('Missing Supabase configuration');
  } else {
    console.log('Creating Supabase client...');
    const supabase = createClient(url, key);
    console.log('Supabase client created successfully');
    
    // Test a simple API call
    console.log('Testing API call...');
    supabase.auth.getUser()
      .then(response => {
        console.log('API call response:', response);
      })
      .catch(error => {
        console.error('API call error:', error);
      });
  }
} catch (error) {
  console.error('Error creating Supabase client:', error);
}
