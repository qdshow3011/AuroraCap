import { supabase } from '../../lib/supabase';

interface CreateArticleData {
  title: string;
  content: string;
  account_id: string;
  cover_image?: string;
  pdf_url?: string;
  summary?: string;
  category_id?: string;
}

interface UpdateArticleData {
  title?: string;
  content?: string;
  cover_image?: string;
  pdf_url?: string;
  summary?: string;
  category_id?: string;
  status?: 'draft' | 'published' | 'archived';
}

// 创建文章
export const createArticle = async (data: CreateArticleData) => {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    throw new Error('用户未登录');
  }

  // 检查公众号是否属于当前用户
  const { data: account } = await supabase
    .from('wechat_official_accounts')
    .select('user_id')
    .eq('id', data.account_id)
    .single();

  if (!account || account.user_id !== userData.user.id) {
    throw new Error('无权限在此公众号发布文章');
  }

  const { data: article, error } = await supabase
    .from('internal_references')
    .insert({
      title: data.title,
      content: data.content,
      account_id: data.account_id,
      cover_image: data.cover_image,
      pdf_url: data.pdf_url,
      summary: data.summary,
      category_id: data.category_id,
      status: 'published',
      author: account.name,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return article;
};

// 获取文章列表
export const getArticles = async (params?: {
  page?: number;
  limit?: number;
  account_id?: string;
  sortBy?: 'created_at' | 'read_count' | 'like_count';
  order?: 'asc' | 'desc';
}) => {
  const { page = 1, limit = 10, account_id, sortBy = 'created_at', order = 'desc' } = params || {};

  let query = supabase
    .from('internal_references')
    .select('*')
    .eq('status', 'published');

  if (account_id) {
    query = query.eq('account_id', account_id);
  }

  const { data: articles, error, count } = await query
    .order(sortBy, { ascending: order === 'asc' })
    .range((page - 1) * limit, page * limit - 1)
    .select('*, wechat_official_accounts(name, avatar)', { count: 'exact' });

  if (error) {
    throw new Error(error.message);
  }

  return {
    articles,
    total: count || 0,
    page,
    limit,
  };
};

// 获取文章详情
export const getArticleById = async (articleId: string) => {
  const { data: article, error } = await supabase
    .from('internal_references')
    .select('*, wechat_official_accounts(name, avatar)')
    .eq('id', articleId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  // 增加阅读量
  await supabase
    .from('internal_references')
    .update({ read_count: (article.read_count || 0) + 1 })
    .eq('id', articleId);

  return article;
};

// 更新文章
export const updateArticle = async (articleId: string, data: UpdateArticleData) => {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    throw new Error('用户未登录');
  }

  // 获取文章信息，检查权限
  const { data: article } = await supabase
    .from('internal_references')
    .select('account_id')
    .eq('id', articleId)
    .single();

  if (!article) {
    throw new Error('文章不存在');
  }

  // 检查公众号是否属于当前用户
  const { data: account } = await supabase
    .from('wechat_official_accounts')
    .select('user_id')
    .eq('id', article.account_id)
    .single();

  if (!account || account.user_id !== userData.user.id) {
    throw new Error('无权限更新此文章');
  }

  const { data: updatedArticle, error } = await supabase
    .from('internal_references')
    .update(data)
    .eq('id', articleId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return updatedArticle;
};

// 删除文章
export const deleteArticle = async (articleId: string) => {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    throw new Error('用户未登录');
  }

  // 获取文章信息，检查权限
  const { data: article } = await supabase
    .from('internal_references')
    .select('account_id')
    .eq('id', articleId)
    .single();

  if (!article) {
    throw new Error('文章不存在');
  }

  // 检查公众号是否属于当前用户
  const { data: account } = await supabase
    .from('wechat_official_accounts')
    .select('user_id')
    .eq('id', article.account_id)
    .single();

  if (!account || account.user_id !== userData.user.id) {
    throw new Error('无权限删除此文章');
  }

  const { error } = await supabase
    .from('internal_references')
    .delete()
    .eq('id', articleId);

  if (error) {
    throw new Error(error.message);
  }

  return { success: true };
};

// 点赞文章
export const likeArticle = async (articleId: string, userInfo?: any) => {
  console.log('likeArticle called for article:', articleId);
  console.log('User info provided:', userInfo);
  
  // 简化处理：不管用户是否登录，都允许增加点赞数
  // 实际项目中应该创建一个点赞表来记录用户的点赞状态
  const { data: article, error } = await supabase
    .from('internal_references')
    .select('like_count')
    .eq('id', articleId)
    .single();

  if (error) {
    console.error('Error fetching article for like:', error);
    throw new Error(error.message);
  }

  console.log('Current like count:', article.like_count);
  console.log('New like count:', (article.like_count || 0) + 1);
  
  const { data: updatedArticle, error: updateError } = await supabase
    .from('internal_references')
    .update({ like_count: (article.like_count || 0) + 1 })
    .eq('id', articleId)
    .select()
    .single();

  if (updateError) {
    console.error('Error updating like count:', updateError);
    throw new Error(updateError.message);
  }

  console.log('Like count updated successfully:', updatedArticle);
  return updatedArticle;
};

// 获取用户的文章列表
export const getUserArticles = async () => {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    throw new Error('用户未登录');
  }

  // 获取用户的公众号列表
  const { data: accounts } = await supabase
    .from('wechat_official_accounts')
    .select('id')
    .eq('user_id', userData.user.id);

  if (!accounts || accounts.length === 0) {
    return [];
  }

  const accountIds = accounts.map(account => account.id);

  // 获取这些公众号的文章
  const { data: articles, error } = await supabase
    .from('internal_references')
    .select('*')
    .in('account_id', accountIds)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return articles;
};
