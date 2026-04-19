'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';


export default function InsightDetail() {
  const { t } = useTranslation('common');
  const { insightId } = useParams();
  const [insight, setInsight] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [insightLoading, setInsightLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [observerExpired, setObserverExpired] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const router = useRouter();

  // Fetch user data
  useEffect(() => {
    const checkMockSession = () => {
      const mockSessionStr = localStorage.getItem('mock_session');
      if (mockSessionStr) {
        try {
          const mockSession = JSON.parse(mockSessionStr);
          return mockSession.user;
        } catch (error) {
          console.error('Error parsing mock session:', error);
          localStorage.removeItem('mock_session');
          return null;
        }
      }
      return null;
    };

    const fetchUser = async () => {
      let userToSet = null;
      
      try {
        // First check Supabase auth
        const { data, error } = await supabase.auth.getUser();
        
        if (!error && data?.user) {
          userToSet = data.user;
        } else {
          // If no Supabase user found or error occurred, check for mock session
          userToSet = checkMockSession();
        }
      } catch (error) {
        console.error('Error fetching user:', error);
        // If exception occurred, check for mock session
        userToSet = checkMockSession();
      } finally {
        // Set user and mark user loading as complete
        setUser(userToSet);
        setUserLoading(false);
        
        // Check if observer access has expired
        if (userToSet?.user_metadata?.role === 'observer') {
          const observerSince = new Date(userToSet.user_metadata?.observer_since || 0);
          const now = new Date();
          const daysSinceObserver = Math.floor((now.getTime() - observerSince.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysSinceObserver > 7) {
            setObserverExpired(true);
          }
        }
      }
    };

    fetchUser();

    // Subscribe to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        // Check mock session when auth state changes to null
        const mockUser = checkMockSession();
        setUser(mockUser);
      }
    });

    // Add event listener for storage changes (in case mock session is updated in another tab)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'mock_session') {
        const mockUser = checkMockSession();
        setUser(mockUser);
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      authListener?.subscription.unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Fetch insight detail
  useEffect(() => {
    const fetchInsight = async () => {
      if (!insightId) return;

      try {
        setInsightLoading(true);
        console.log('Fetching insight detail from Supabase...');
        
        const { data, error } = await supabase
          .from('internal_references')
          .select('*, account:account_id(*)')
          .eq('id', insightId)
          .single();
        
        if (error) {
          console.error('Supabase error fetching insight detail:', error);
          router.push('/insights');
          return;
        }
        
        console.log('Successfully fetched insight detail:', data);
        setInsight(data);
      } catch (error) {
        console.error('Unexpected error fetching insight detail:', error);
        router.push('/insights');
      } finally {
        setInsightLoading(false);
      }
    };

    fetchInsight();
  }, [insightId, router]);

  // Fetch comments
  useEffect(() => {
    const fetchComments = async () => {
      if (!insightId) return;

      try {
        setCommentsLoading(true);
        console.log('Fetching comments for insight:', insightId);
        
        const url = new URL('/api/comments', window.location.origin);
        url.searchParams.append('article_id', Array.isArray(insightId) ? insightId[0] : insightId);
        
        const response = await fetch(url.toString());
        
        if (!response.ok) {
          throw new Error('Failed to fetch comments');
        }
        
        const result = await response.json();
        const { data } = result;
        
        console.log('Successfully fetched comments:', data?.length || 0, 'comments found');
        setComments(data || []);
      } catch (error) {
        console.error('Error fetching comments:', error);
        setComments([]);
      } finally {
        setCommentsLoading(false);
      }
    };

    fetchComments();
  }, [insightId]);

  // Submit comment function
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!commentContent.trim() || !user || !insightId) {
      return;
    }

    try {
      setCommentSubmitting(true);
      
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          article_id: Array.isArray(insightId) ? insightId[0] : insightId,
          content: commentContent.trim(),
          user_id: user.id,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit comment');
      }
      
      const result = await response.json();
      const { data: newComment } = result;
      
      if (newComment) {
        setComments(prevComments => [newComment, ...prevComments]);
        setCommentContent('');
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setCommentSubmitting(false);
    }
  };

  // Show loading if either insight or user is still loading
  if (insightLoading || userLoading) {
    return <div className="container mx-auto px-4 py-8">{t('loading')}</div>;
  }

  if (!insight) {
    return <div className="container mx-auto px-4 py-8">{t('insightNotFound')}</div>;
  }

  // Now that both insight and user loading are complete,
  // check if user is logged in, redirect to login if not
  if (!user) {
    router.push(`/login?redirect=/insights/${insightId}`);
    return null;
  }

  if (observerExpired) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 bg-[var(--background)] min-h-screen">
        <div className="text-center py-20">
          <h2 className="text-3xl font-bold mb-6 text-[var(--text-primary)]">
            {t('observerExpiredTitle')}
          </h2>
          <p className="text-lg text-[var(--text-secondary)] mb-8">
            {t('observerExpiredDesc')}
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register" className="btn btn-primary btn-md">
              {t('upgradeAccount')}
            </Link>
            <Link href="/insights" className="btn btn-secondary btn-md">
              {t('backToInsights')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 bg-[var(--background)] min-h-screen">
      {/* Back Button */}
      <div className="mb-8">
        <Link 
          href="/insights" 
          className="inline-flex items-center gap-2 text-[var(--primary)] hover:text-[var(--primary-dark)] transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          {t('backToInsights')}
        </Link>
      </div>

      {/* Insight Detail */}
      <div className="bg-[var(--surface)] rounded-xl shadow-lg overflow-hidden">
        {/* Cover Image */}
        {insight.cover_image && (
          <div className="relative h-64 md:h-80 overflow-hidden">
            <img
              src={insight.cover_image}
              alt={insight.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Account Info */}
        {insight.account && (
          <div className="p-8 border-b border-[var(--border)] flex items-center gap-4">
            {insight.account.avatar && (
              <img
                src={insight.account.avatar}
                alt={insight.account.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            )}
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                {insight.account.name}
              </h3>
              {insight.account.description && (
                <p className="text-sm text-[var(--text-secondary)]">
                  {insight.account.description}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Category and Date */}
        <div className="p-8 border-b border-[var(--border)]">
          {insight.category && (
            <span className="inline-block px-4 py-2 bg-[var(--primary)]/10 text-[var(--primary)] text-sm font-medium rounded-full mb-4">
              {insight.category}
            </span>
          )}
          <div className="flex items-center gap-4 text-sm text-[var(--text-muted)]">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                <line x1="16" x2="16" y1="2" y2="6" />
                <line x1="8" x2="8" y1="2" y2="6" />
                <line x1="3" x2="21" y1="10" y2="10" />
              </svg>
              {new Date(insight.created_at).toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
            {insight.read_count !== undefined && (
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                {insight.read_count} {t('reads')}
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <div className="p-8 border-b border-[var(--border)]">
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)]">
            {insight.title}
          </h1>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="prose prose-lg max-w-none text-[var(--text-primary)]">
            {/* Process content to handle paragraphs and line breaks */}
            {insight.content.split(/\n\s*\n/).filter(Boolean).map((paragraph: string, index: number) => (
              <p key={index} className="mb-4">
                <span dangerouslySetInnerHTML={{ __html: paragraph.replace(/\n/g, '<br />') }} />
              </p>
            ))}
          </div>
        </div>

        {/* Tags */}
        {insight.tags && insight.tags.length > 0 && (
          <div className="p-8 border-t border-[var(--border)]">
            <div className="flex flex-wrap gap-2">
              {insight.tags.map((tag: string, index: number) => (
                <span key={index} className="px-3 py-1 bg-[var(--background)] text-[var(--text-secondary)] text-sm rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Comments Section */}
        <div className="p-8 border-t border-[var(--border)]">
          <h2 className="text-2xl font-bold mb-8 text-[var(--text-primary)]">
            留言 ({comments.length})
          </h2>

          {/* Comment Form */}
          <form onSubmit={handleSubmitComment} className="mb-8">
            <textarea
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              placeholder="写下你的想法..."
              className="w-full p-4 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
              rows={4}
            />
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                disabled={commentSubmitting || !commentContent.trim()}
                className="px-8 py-2 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] text-white rounded-lg hover:shadow-lg transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {commentSubmitting ? '提交中...' : '提交留言'}
              </button>
            </div>
          </form>

          {/* Comments List */}
          {commentsLoading ? (
            <div className="text-center py-8">
              {t('loading')}
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[var(--text-secondary)]">
                暂无留言，快来抢沙发吧！
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {comments.map((comment, index) => (
                <div key={comment.id} className="flex gap-4">
                  {comment.user && comment.user.avatar ? (
                    <img
                      src={comment.user.avatar}
                      alt={comment.user.email || 'User'}
                      className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[var(--primary)]/20 flex items-center justify-center flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--primary)]">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-[var(--text-primary)]">
                        {comment.user?.email || '用户'}
                      </h4>
                      <span className="text-xs text-[var(--text-muted)]">
                        {new Date(comment.created_at).toLocaleDateString('zh-CN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-[var(--text-secondary)] leading-relaxed">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Related Insights */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold mb-8 text-[var(--text-primary)]">
          {t('relatedInsights')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Related insights will be fetched here */}
          {/* For now, we'll show a placeholder */}
          <div className="card bg-[var(--surface)] p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-2">
            <h3 className="text-xl font-semibold mb-2 text-[var(--text-primary)] line-clamp-2">
              相关内参标题示例
            </h3>
            <p className="text-[var(--text-secondary)] mb-4 line-clamp-3">
              相关内参内容描述...
            </p>
            <div className="text-sm text-[var(--text-muted)]">
              {new Date().toLocaleDateString('zh-CN')}
            </div>
          </div>
          <div className="card bg-[var(--surface)] p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-2">
            <h3 className="text-xl font-semibold mb-2 text-[var(--text-primary)] line-clamp-2">
              相关内参标题示例
            </h3>
            <p className="text-[var(--text-secondary)] mb-4 line-clamp-3">
              相关内参内容描述...
            </p>
            <div className="text-sm text-[var(--text-muted)]">
              {new Date().toLocaleDateString('zh-CN')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
