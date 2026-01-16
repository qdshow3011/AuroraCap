import { supabase } from '../../lib/supabase';

export interface GetInviterByCodeParams {
  inviteCode: string;
}

export interface GetInviterByCodeResponse {
  message: string;
  data?: {
    inviter: {
      id: string;
      name: string;
      email: string;
      role: string;
    };
    inviteCode: string;
  };
  error?: string;
  details?: string;
}

export async function getInviterByCode(params: GetInviterByCodeParams): Promise<GetInviterByCodeResponse> {
  try {
    const { inviteCode } = params;

    // Validate required fields
    if (!inviteCode) {
      return {
        message: 'Query failed',
        error: 'Invite code is required'
      };
    }

    if (!supabase) {
      return {
        message: 'Query failed',
        error: 'Database connection error'
      };
    }

    // Query the invite code to get the pushed_by (inviter) ID
    const { data: inviteCodeData, error: inviteCodeError } = await supabase
      .from('invite_codes')
      .select('pushed_by')
      .eq('code', inviteCode)
      .single();

    if (inviteCodeError || !inviteCodeData) {
      return {
        message: 'Query failed',
        error: 'Invite code not found',
        details: inviteCodeError?.message
      };
    }

    // If no inviter is associated with this code
    if (!inviteCodeData.pushed_by) {
      return {
        message: 'Query failed',
        error: 'No inviter associated with this code'
      };
    }

    // Query the user table to get the inviter's details
    const { data: inviterData, error: inviterError } = await supabase
      .from('users')
      .select('id, name, email, role')
      .eq('id', inviteCodeData.pushed_by)
      .single();

    if (inviterError || !inviterData) {
      return {
        message: 'Query failed',
        error: 'Inviter not found',
        details: inviterError?.message
      };
    }

    return {
      message: 'Query successful',
      data: {
        inviter: {
          id: inviterData.id,
          name: inviterData.name,
          email: inviterData.email,
          role: inviterData.role
        },
        inviteCode
      }
    };
  } catch (error: any) {
    console.error('Get inviter by code error:', error);
    return {
      message: 'Query failed',
      error: 'Failed to get inviter information',
      details: error.message
    };
  }
}

export interface GetUsedInviteCodesParams {
  pushedBy?: string;
}

export interface UsedInviteCode {
  code: string;
  inviter: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  invitedUser: {
    id: string;
    name: string;
    email: string;
    phone: string;
    registeredAt: string;
  };
  createdAt: string;
}

export interface GetUsedInviteCodesResponse {
  message: string;
  data?: {
    codes: UsedInviteCode[];
    total: number;
  };
  error?: string;
  details?: string;
}

export async function getUsedInviteCodes(params?: GetUsedInviteCodesParams): Promise<GetUsedInviteCodesResponse> {
  try {
    if (!supabase) {
      return {
        message: 'Query failed',
        error: 'Database connection error'
      };
    }

    // Build the query for used invite codes
    let query = supabase
      .from('invite_codes')
      .select('code, pushed_by, created_at, used_by_user:users!used_by(*), invited_users:users!inner(invite_code)')
      .eq('status', 'used');

    // Apply filters if provided
    if (params?.pushedBy) {
      query = query.eq('pushed_by', params.pushedBy);
    }

    // Execute the query
    const { data, error } = await query;

    if (error) {
      return {
        message: 'Query failed',
        error: 'Failed to get used invite codes',
        details: error.message
      };
    }

    // Transform the data into the desired format
    const usedCodes: UsedInviteCode[] = (data || []).map((item: any) => {
      // Find the invited user from the invited_users array
      const invitedUser = (item.invited_users || []).find((user: any) => user.invite_code === item.code);

      return {
        code: item.code,
        inviter: {
          id: item.pushed_by,
          name: '', // Will be populated if inviter data is available
          email: '',
          role: ''
        },
        invitedUser: invitedUser
          ? {
              id: invitedUser.id,
              name: invitedUser.name,
              email: invitedUser.email,
              phone: invitedUser.phone,
              registeredAt: invitedUser.created_at
            }
          : {
              id: '',
              name: '',
              email: '',
              phone: '',
              registeredAt: ''
            },
        createdAt: item.created_at
      };
    });

    // Get inviter details for each used code
    const codesWithInviterDetails: UsedInviteCode[] = await Promise.all(
      usedCodes.map(async (code) => {
        if (code.inviter.id) {
          const { data: inviterData } = await supabase
            .from('users')
            .select('id, name, email, role')
            .eq('id', code.inviter.id)
            .single();

          if (inviterData) {
            code.inviter = {
              id: inviterData.id,
              name: inviterData.name,
              email: inviterData.email,
              role: inviterData.role
            };
          }
        }
        return code;
      })
    );

    return {
      message: 'Query successful',
      data: {
        codes: codesWithInviterDetails,
        total: codesWithInviterDetails.length
      }
    };
  } catch (error: any) {
    console.error('Get used invite codes error:', error);
    return {
      message: 'Query failed',
      error: 'Failed to get used invite codes',
      details: error.message
    };
  }
}