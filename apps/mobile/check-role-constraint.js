const { createClient } = require('@supabase/supabase-js');

// Use the same config as in your app
const url = 'https://mptprqlndfbhguqklnnx.supabase.co';
const key = 'sb_publishable_x3J89NuOrsaIei0SsGMN_g_poYCwQnw';

// Create Supabase client
const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`
    }
  }
});

async function checkRoleConstraint() {
  try {
    console.log('=== Checking Role Constraint ===\n');
    
    // 1. Check existing users and their roles
    console.log('1. Checking existing users:');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, role, name, email');
    
    if (usersError) {
      console.error('Error getting users:', usersError);
    } else {
      console.log(`Found ${users.length} users:`);
      users.forEach((user, index) => {
        console.log(`${index + 1}. ID: ${user.id}, Role: '${user.role}', Name: ${user.name}, Email: ${user.email}`);
      });
    }
    
    // 2. Try to execute a raw SQL query to get constraint definition
    console.log('\n2. Trying to get constraint definition:');
    // Note: This might not work if direct SQL access is restricted
    try {
      const { data: constraint, error: constraintError } = await supabase
        .rpc('execute_sql', {
          sql: "SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'users_role_check'"
        });
      
      if (constraintError) {
        console.error('Error getting constraint:', constraintError);
      } else {
        console.log('Constraint definition:', constraint);
      }
    } catch (error) {
      console.log('Direct SQL execution not available, trying alternative methods...');
    }
    
    // 3. Test exact role values from existing users
    console.log('\n3. Testing exact role values from existing users:');
    if (users && users.length > 0) {
      const testRoles = [...new Set(users.map(user => user.role))];
      
      for (const role of testRoles) {
        console.log(`\nTesting role: '${role}'`);
        console.log(`Role length: ${role.length}`);
        console.log(`Role trimmed: '${role.trim()}'`);
        console.log(`Role trimmed length: ${role.trim().length}`);
        
        try {
          // Generate proper UUID
          const generateUUID = () => {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
              const r = Math.random() * 16 | 0;
              const v = c === 'x' ? r : (r & 0x3 | 0x8);
              return v.toString(16);
            });
          };
          
          const userId = generateUUID();
          const { data: newUser, error: insertError } = await supabase
            .from('users')
            .insert({
              id: userId,
              email: `${Date.now()}@auroracm.net`,
              name: 'Test User',
              phone: `138${Math.floor(Math.random() * 10000000)}`,
              id_number: `36252419721109${Math.floor(Math.random() * 10000)}`,
              password: 'test123',
              role: role, // Use exact role from existing user
              invite_code: 'testcode',
              customer_number: `TEST${Date.now()}`,
              status: 'active',
              created_at: new Date().toISOString()
            })
            .select('*')
            .single();
          
          if (insertError) {
            console.error(`❌ Failed:`, insertError.message);
          } else {
            console.log(`✅ Success! User created with role '${role}'`);
            
            // Clean up test user
            await supabase
              .from('users')
              .delete()
              .eq('id', userId);
            console.log(`🗑️  Test user deleted`);
          }
        } catch (error) {
          console.error(`❌ Exception:`, error.message);
        }
      }
    }
    
  } catch (error) {
    console.error('General error:', error);
  }
}

// Run the test
checkRoleConstraint();