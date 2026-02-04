import { supabase } from '../../lib/supabase';

interface CreateAccountData {
  name: string;
  description?: string;
  avatar?: string;
  cover_image?: string;
}

interface UpdateAccountData {
  name?: string;
  description?: string;
  avatar?: string;
  cover_image?: string;
  status?: 'active' | 'inactive';
}

// 创建公众号
export const createAccount = async (data: CreateAccountData) => {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    throw new Error('用户未登录');
  }

  const { data: account, error } = await supabase
    .from('wechat_official_accounts')
    .insert({
      user_id: userData.user.id,
      name: data.name,
      description: data.description,
      avatar: data.avatar,
      cover_image: data.cover_image,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return account;
};

// 获取用户的公众号列表
export const getUserAccounts = async () => {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    throw new Error('用户未登录');
  }

  const { data: accounts, error } = await supabase
    .from('wechat_official_accounts')
    .select('*')
    .eq('user_id', userData.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return accounts;
};

// 获取公众号详情
export const getAccountById = async (accountId: string) => {
  const { data: account, error } = await supabase
    .from('wechat_official_accounts')
    .select('*')
    .eq('id', accountId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return account;
};

// 更新公众号信息
export const updateAccount = async (accountId: string, data: UpdateAccountData) => {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    throw new Error('用户未登录');
  }

  // 检查公众号是否属于当前用户
  const { data: account } = await supabase
    .from('wechat_official_accounts')
    .select('user_id')
    .eq('id', accountId)
    .single();

  if (!account || account.user_id !== userData.user.id) {
    throw new Error('无权限更新此公众号');
  }

  const { data: updatedAccount, error } = await supabase
    .from('wechat_official_accounts')
    .update(data)
    .eq('id', accountId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return updatedAccount;
};

// 删除公众号
export const deleteAccount = async (accountId: string) => {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    throw new Error('用户未登录');
  }

  // 检查公众号是否属于当前用户
  const { data: account } = await supabase
    .from('wechat_official_accounts')
    .select('user_id')
    .eq('id', accountId)
    .single();

  if (!account || account.user_id !== userData.user.id) {
    throw new Error('无权限删除此公众号');
  }

  const { error } = await supabase
    .from('wechat_official_accounts')
    .delete()
    .eq('id', accountId);

  if (error) {
    throw new Error(error.message);
  }

  return { success: true };
};

// 关注公众号
export const followAccount = async (accountId: string) => {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    throw new Error('用户未登录');
  }

  const { data: follow, error } = await supabase
    .from('account_follows')
    .insert({
      user_id: userData.user.id,
      account_id: accountId,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return follow;
};

// 取消关注公众号
export const unfollowAccount = async (accountId: string) => {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    throw new Error('用户未登录');
  }

  const { error } = await supabase
    .from('account_follows')
    .delete()
    .eq('user_id', userData.user.id)
    .eq('account_id', accountId);

  if (error) {
    throw new Error(error.message);
  }

  return { success: true };
};

// 获取用户关注的公众号列表
export const getFollowedAccounts = async () => {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    throw new Error('用户未登录');
  }

  const { data: follows, error } = await supabase
    .from('account_follows')
    .select('account_id')
    .eq('user_id', userData.user.id);

  if (error) {
    throw new Error(error.message);
  }

  if (follows.length === 0) {
    return [];
  }

  const accountIds = follows.map(follow => follow.account_id);

  const { data: accounts } = await supabase
    .from('wechat_official_accounts')
    .select('*')
    .in('id', accountIds)
    .order('created_at', { ascending: false });

  return accounts || [];
};

// 检查用户是否关注了某个公众号
export const checkIfFollowed = async (accountId: string) => {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return false;
  }

  const { data: follow } = await supabase
    .from('account_follows')
    .select('id')
    .eq('user_id', userData.user.id)
    .eq('account_id', accountId)
    .single();

  return !!follow;
};
