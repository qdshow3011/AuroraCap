import { supabase } from '../../lib/supabase';

interface CreateCommentData {
  article_id: string;
  content: string;
  parent_id?: string;
}

// 发表留言
export const createComment = async (data: CreateCommentData & { userInfo?: any }) => {
  console.log('createComment called, checking auth status...');
  const { data: userData, error: authError } = await supabase.auth.getUser();
  console.log('Auth check result:', { userData, authError });
  console.log('User exists:', !!userData?.user);
  console.log('User info from frontend:', data.userInfo);
  
  let currentUser;
  
  if (userData.user) {
    currentUser = userData.user;
    console.log('Using Supabase authenticated user:', currentUser.id);
  } else if (data.userInfo?.id) {
    // 作为备用方案，使用前端传递的用户信息
    currentUser = {
      id: data.userInfo.id,
      email: data.userInfo.email || 'user@example.com'
    };
    console.log('Using frontend user info:', currentUser.id);
  } else {
    console.error('User not authenticated, throwing error');
    throw new Error('用户未登录');
  }

  console.log('Attempting to insert comment into article_comments table...');
  console.log('Comment data:', {
    article_id: data.article_id,
    user_id: currentUser.id,
    content: data.content.substring(0, 50) + '...',
    parent_id: data.parent_id,
    status: 'approved',
  });
  
  const { data: comment, error } = await supabase
    .from('article_comments')
    .insert({
      article_id: data.article_id,
      user_id: currentUser.id,
      content: data.content,
      parent_id: data.parent_id,
      status: 'approved',
    })
    .select('*, users(email)')
    .single();

  console.log('Insert result:', { comment, error });

  if (error) {
    console.error('Error inserting comment:', error);
    throw new Error(error.message);
  }

  return comment;
};

// 获取文章留言列表
export const getArticleComments = async (articleId: string) => {
  const { data: comments, error } = await supabase
    .from('article_comments')
    .select('*, users(email)')
    .eq('article_id', articleId)
    .eq('status', 'approved')
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  // 构建留言树结构，支持回复功能
  const commentMap: Record<string, any> = {};
  const rootComments: any[] = [];

  // 首先将所有留言放入map
  comments.forEach(comment => {
    commentMap[comment.id] = {
      ...comment,
      replies: [],
    };
  });

  // 然后构建树结构
  comments.forEach(comment => {
    if (comment.parent_id) {
      // 这是一个回复
      if (commentMap[comment.parent_id]) {
        commentMap[comment.parent_id].replies.push(commentMap[comment.id]);
      }
    } else {
      // 这是一个根留言
      rootComments.push(commentMap[comment.id]);
    }
  });

  return rootComments;
};

// 更新留言
export const updateComment = async (commentId: string, content: string) => {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    throw new Error('用户未登录');
  }

  // 检查留言是否属于当前用户
  const { data: comment } = await supabase
    .from('article_comments')
    .select('user_id')
    .eq('id', commentId)
    .single();

  if (!comment || comment.user_id !== userData.user.id) {
    throw new Error('无权限更新此留言');
  }

  const { data: updatedComment, error } = await supabase
    .from('article_comments')
    .update({ content })
    .eq('id', commentId)
    .select('*, users(email)')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return updatedComment;
};

// 删除留言
export const deleteComment = async (commentId: string) => {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    throw new Error('用户未登录');
  }

  // 检查留言是否属于当前用户
  const { data: comment } = await supabase
    .from('article_comments')
    .select('user_id')
    .eq('id', commentId)
    .single();

  if (!comment || comment.user_id !== userData.user.id) {
    throw new Error('无权限删除此留言');
  }

  const { error } = await supabase
    .from('article_comments')
    .delete()
    .eq('id', commentId);

  if (error) {
    throw new Error(error.message);
  }

  return { success: true };
};
