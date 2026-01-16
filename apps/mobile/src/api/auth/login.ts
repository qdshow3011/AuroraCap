import { supabase } from '../../lib/supabase';

export interface LoginData {
  loginId: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  data?: {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      created_at: string;
    };
    session?: any;
  };
  error?: string;
  details?: string;
}

export async function loginUser(loginData: LoginData): Promise<LoginResponse> {
  try {
    const { loginId, password } = loginData;

    // Validate required fields
    if (!loginId || !password) {
      return {
        message: 'Login failed',
        error: 'ID/Passport/Phone and password are required'
      };
    }

    if (!supabase) {
      return {
        message: 'Login failed',
        error: 'Database connection error'
      };
    }

    // Debug info
    console.log('Login attempt with loginId:', loginId);
    console.log('Password:', password);

    let userProfile: any;
    
    // 检查loginId是否为手机号码格式（以1开头的11位数字）
    const isPhoneNumber = loginId.match(/^1\d{10}$/);
    console.log('Is phone number:', isPhoneNumber);
    
    if (isPhoneNumber) {
      // 如果是手机号码，查询对应的用户
      console.log('Querying users by phone:', loginId);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('phone', loginId)
        .single();
      
      console.log('Query result:', { data, error });
      
      if (error || !data) {
        console.log('No user found by phone:', error?.message);
        return {
          message: 'Login failed',
          error: 'Invalid phone number or password'
        };
      }
      
      userProfile = data;
    } else {
      // 如果是身份证号或护照号码，查询对应的用户
      console.log('Querying users by id_number:', loginId);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id_number', loginId)
        .single();
      
      console.log('Query result:', { data, error });
      
      if (error || !data) {
        console.log('No user found by id_number:', error?.message);
        return {
          message: 'Login failed',
          error: 'Invalid ID/Passport number or password'
        };
      }
      
      userProfile = data;
    }
    
    console.log('Found user profile:', userProfile);
    console.log('Stored password:', userProfile.password);
    console.log('Input password:', password);
    
    // 验证密码（注意：这里应该使用密码哈希比较，暂时简化处理）
    // 由于数据库中密码是hashed_password，这里暂时直接比较
    if (userProfile.password !== password) {
      console.log('Password mismatch');
      return {
        message: 'Login failed',
        error: 'Invalid ID/Passport/Phone number or password'
      };
    }

    // Return success response
    return {
      message: 'Login successful',
      data: {
        user: {
          id: userProfile.id,
          email: userProfile.email,
          name: userProfile.name || 'User',
          role: userProfile.role || '客户',
          created_at: userProfile.created_at || ''
        }
      }
    };

  } catch (error: any) {
    console.error('User login error:', error);
    return {
      message: 'Login failed',
      error: 'Failed to login user',
      details: error.message
    };
  }
}