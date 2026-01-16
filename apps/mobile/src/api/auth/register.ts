import { supabase } from '../../lib/supabase';
import { messageGenerator } from '../../utils/message-generator';

export interface RegisterData {
  password: string;
  name: string;
  phone: string;
  id_number: string;
  invitation_code: string;
}

export interface RegisterResponse {
  message: string;
  data?: {
    user_id: string;
    email: string;
    name: string;
    phone: string;
    id_number: string;
    role: string;
  };
  error?: string;
  details?: string;
}

export async function registerUser(registerData: RegisterData): Promise<RegisterResponse> {
  try {
    const { password, name, phone, id_number, invitation_code } = registerData;

    // Validate required fields
    if (!password || !name || !phone || !id_number) {
      return {
        message: 'Registration failed',
        error: 'All required fields must be provided'
      };
    }

    // Validate password strength (at least 6 characters)
    if (password.length < 6) {
      return {
        message: 'Registration failed',
        error: 'Password must be at least 6 characters long'
      };
    }

    // Validate invitation code
    const { data: inviteCode, error: inviteCodeError } = await supabase
      .from('invite_codes')
      .select('*')
      .eq('code', invitation_code)
      .single();
    
    if (inviteCodeError || !inviteCode) {
      return {
        message: 'Registration failed',
        error: 'Invalid invitation code'
      };
    }
    
    // Check if invitation code is active
    if (inviteCode.status !== 'active') {
      return {
        message: 'Registration failed',
        error: 'Invitation code is not active'
      };
    }
    
    // Check if invitation code has expired
    if (inviteCode.expiry_date && new Date(inviteCode.expiry_date) < new Date()) {
      return {
        message: 'Registration failed',
        error: 'Invitation code has expired'
      };
    }
    
    // Check if invitation code has already been used
    if (inviteCode.used_by) {
      return {
        message: 'Registration failed',
        error: 'Invitation code has already been used'
      };
    }

    if (!supabase) {
      return {
        message: 'Registration failed',
        error: 'Database connection error'
      };
    }

    // Construct email from phone number
    const email = `${phone}@auroracm.net`;
    
    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .or(`phone.eq.${phone},id_number.eq.${id_number},email.eq.${email}`)
      .single();
    
    if (!checkError && existingUser) {
      console.log('User already exists:', existingUser);
      return {
        message: 'Registration failed',
        error: 'Phone number, ID number or email already registered'
      };
    }
    
    // Generate a reliable UUID (RFC 4122 compliant)
    function generateUUID() {
      // Use a more straightforward UUID generation approach
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
    
    const userId = generateUUID();
    console.log('Generated UUID:', userId);
    console.log('UUID format check:', /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId));
    
    // Verify UUID length
    console.log('UUID length:', userId.length);
    
    // Generate customer number in format: C+年月日+序号 (e.g., C20260104001)
    const today = new Date();
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const prefix = `C${dateStr}`;
    
    // Query the maximum sequence number for today
    const { data: maxSeqData, error: maxSeqError } = await supabase
      .from('users')
      .select('customer_number')
      .like('customer_number', `${prefix}%`)
      .order('customer_number', { ascending: false })
      .limit(1)
      .single();
    
    let sequenceNumber = 1;
    if (maxSeqData && maxSeqData.customer_number) {
      // Extract the sequence number part (last 3 digits)
      const seqPart = maxSeqData.customer_number.slice(-3);
      sequenceNumber = parseInt(seqPart, 10) + 1;
    }
    
    // Format sequence number with leading zeros (3 digits)
    const formattedSeq = String(sequenceNumber).padStart(3, '0');
    
    // Generate final customer number
    const customerNumber = `${prefix}${formattedSeq}`;
    
    // Define role explicitly as 'customer' to match database constraints
    const userRole = 'customer';
    console.log('=== Role Debug Info ===');
    console.log('Role value:', userRole);
    console.log('Role length:', userRole.length);
    console.log('Role is "customer":', userRole === 'customer');
    
    // Insert user directly into users table
    console.log('\n=== Insert Data Debug ===');
    console.log('Attempting to insert user with data:');
    console.log('id:', userId);
    console.log('email:', email);
    console.log('name:', name);
    console.log('phone:', phone);
    console.log('id_number:', id_number);
    console.log('role:', userRole);
    console.log('customer_number:', customerNumber);
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email,
        name,
        phone,
        id_number,
        password, // Note: In production, this should be hashed
        role: userRole, // Use the explicitly defined role
        invite_code: invitation_code,
        customer_number: customerNumber,
        status: 'active',
        created_at: new Date().toISOString()
      })
      .select('*')
      .single();
    
    if (userError) {
      console.error('Error saving user to database:', userError);
      return {
        message: 'Registration failed',
        error: 'Failed to save user information',
        details: userError.message
      };
    }
    
    // Update invitation code status to used
    const { error: updateInviteCodeError } = await supabase
      .from('invite_codes')
      .update({
        status: 'used',
        used_by: userId
      })
      .eq('code', invitation_code);
    
    if (updateInviteCodeError) {
      console.error('Error updating invitation code status:', updateInviteCodeError);
      // Continue with registration even if updating invite code fails
    }
    
    // Generate registration messages
    await messageGenerator.generateRegistrationMessages(
      userId,
      name,
      inviteCode.created_by,
      inviteCode.created_by_name
    );
    
    return {
      message: 'User registered successfully',
      data: {
        user_id: userData.id,
        email: userData.email,
        name: userData.name,
        phone: userData.phone,
        id_number: userData.id_number,
        role: userData.role
      }
    };

  } catch (error: any) {
    console.error('User registration error:', error);
    
    return {
      message: 'Registration failed',
      error: 'Failed to register user',
      details: error.message
    };
  }
}