'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from 'react-i18next';

export default function ArticleEditor() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const searchParams = useSearchParams();
  const account_id = searchParams.get('account_id');
  
  const [user, setUser] = useState<any>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  
  const [article, setArticle] = useState({
    title: '',
    content: '',
    summary: '',
    category: '',
    cover_image: '',
    account_id: account_id || '',
    tags: []
  });
  
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [categories] = useState<string[]>([
    '财经分析',
    '市场动态',
    '投资策略',
    '行业研究',
    '宏观经济',
    '公司分析',
    '政策解读',
    '其他'
  ]);

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

  // Fetch user accounts
  useEffect(() => {
    const fetchAccounts = async () => {
      if (!user) return;

      try {
        setAccountsLoading(true);
        
        const url = new URL('/api/accounts', window.location.origin);
        
        const response = await fetch(url.toString());
        
        if (!response.ok) {
          throw new Error('Failed to fetch accounts');
        }
        
        const result = await response.json();
        const { data } = result;
        
        // Filter accounts by current user
        const userAccounts = data?.filter((account: any) => account.user_id === user.id) || [];
        setAccounts(userAccounts);
        
        // If no account selected and user has only one account, select it
        if (!article.account_id && userAccounts.length === 1) {
          setArticle(prev => ({ ...prev, account_id: userAccounts[0].id }));
        }
      } catch (error) {
        console.error('Error fetching accounts:', error);
        setAccounts([]);
      } finally {
        setAccountsLoading(false);
      }
    };

    fetchAccounts();
  }, [user]);

  // Upload image to Supabase Storage with retry mechanism
  const uploadImage = async (file: File, retryCount = 0) => {
    try {
      setUploading(true);
      
      // Generate unique filename
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 10)}.${fileExt}`;
      const filePath = `neican/${fileName}`;
      
      // Add timeout to upload operation
      const uploadPromise = supabase
        .storage
        .from('qdshow101')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Upload timeout')), 60000)
      );
      
      let uploadResult;
      try {
        uploadResult = await Promise.race([uploadPromise, timeoutPromise]);
      } catch (timeoutError) {
        console.error('Upload timeout:', timeoutError);
        
        // Retry if timeout occurs and retry count is less than 2
        if (retryCount < 2) {
          console.log('Retrying upload...', retryCount + 1);
          return uploadImage(file, retryCount + 1);
        }
        
        throw timeoutError;
      }
      
      const { error: uploadError } = uploadResult as { data: any; error: any };
      
      if (uploadError) {
        console.error('Upload error:', uploadError);
        
        // Retry for network-related errors
        if ((uploadError.message.includes('Failed to fetch') || 
             uploadError.message.includes('Network error') ||
             uploadError.message.includes('StorageUnknownError')) && 
            retryCount < 2) {
          console.log('Retrying upload due to network error...', retryCount + 1);
          return uploadImage(file, retryCount + 1);
        }
        
        throw uploadError;
      }
      
      // Get public URL
      const { data: urlData } = await supabase
        .storage
        .from('qdshow101')
        .getPublicUrl(filePath);
      
      if (!urlData || !urlData.publicUrl) {
        throw new Error('Failed to get public URL');
      }
      
      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  // Handle cover image upload
  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Upload to Supabase
      const coverImageUrl = await uploadImage(file);
      setArticle(prev => ({ ...prev, cover_image: coverImageUrl }));
    } catch (error) {
      console.error('Error uploading cover image:', error);
    }
  };

  // Handle submit article
  const handleSubmitArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!article.title.trim() || !article.content.trim() || !article.account_id) {
      return;
    }

    try {
      setSubmitting(true);
      
      // Create article in database
      const { data, error } = await supabase
        .from('internal_references')
        .insert({
          title: article.title.trim(),
          content: article.content.trim(),
          summary: article.summary.trim() || article.content.substring(0, 100).trim() + '...',
          category: article.category,
          cover_image: article.cover_image,
          account_id: article.account_id,
          author: user?.email || 'Unknown',
          status: 'published',
          tags: article.tags
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      console.log('Article created successfully:', data);
      router.push('/insights');
    } catch (error) {
      console.error('Error creating article:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Show loading if user is still loading
  if (userLoading) {
    return <div className="container mx-auto px-4 py-8">{t('loading')}</div>;
  }

  if (!user) {
    router.push('/login?redirect=/articles/new');
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 bg-gradient-to-br from-[var(--background)] to-[var(--surface)] min-h-screen relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-20">
        <div className="absolute top-20 right-20 w-64 h-64 bg-[var(--primary-light)]/30 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-40 left-20 w-80 h-80 bg-[var(--secondary)]/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }}></div>
      </div>

      {/* Header */}
      <div className="text-center mb-16 relative z-10">
        <div className="inline-block mb-6">
          <span className="px-4 py-1 bg-[var(--primary)]/10 text-[var(--primary)] text-sm font-semibold rounded-full">
            文章编辑
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-[var(--text-primary)] tracking-tight">
          发布新文章
        </h1>
        <p className="text-xl text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
          创建高质量的文章内容，分享你的专业见解
        </p>
      </div>

      {/* Editor Form */}
      <div className="bg-[var(--surface)]/90 backdrop-blur-sm rounded-xl shadow-lg p-8 relative z-10">
        <form onSubmit={handleSubmitArticle}>
          {/* Account Selection */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              选择公众号
            </label>
            {accountsLoading ? (
              <div className="py-4 text-center">{t('loading')}</div>
            ) : (
              <select
                value={article.account_id}
                onChange={(e) => setArticle(prev => ({ ...prev, account_id: e.target.value }))}
                className="w-full p-4 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              >
                <option value="">请选择公众号</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Cover Image */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              封面图片
            </label>
            <div className="border border-dashed border-[var(--border)] rounded-lg p-8 text-center hover:border-[var(--primary)] transition-colors">
              {article.cover_image ? (
                <div className="relative">
                  <img
                    src={article.cover_image}
                    alt="Cover"
                    className="max-w-full h-auto rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setArticle(prev => ({ ...prev, cover_image: '' }))}
                    className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div>
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-muted)] mx-auto mb-4">
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <p className="text-[var(--text-secondary)] mb-4">
                    上传封面图片，提升文章吸引力
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverImageUpload}
                    className="hidden"
                    id="cover-image-upload"
                    disabled={uploading}
                  />
                  <label
                    htmlFor="cover-image-upload"
                    className={`px-6 py-2 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] text-white rounded-lg hover:shadow-lg transition-all duration-300 font-medium cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {uploading ? '上传中...' : '选择图片'}
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              文章标题
            </label>
            <input
              type="text"
              value={article.title}
              onChange={(e) => setArticle(prev => ({ ...prev, title: e.target.value }))}
              placeholder="请输入文章标题"
              className="w-full p-4 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-xl"
            />
          </div>

          {/* Category */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              文章分类
            </label>
            <select
              value={article.category}
              onChange={(e) => setArticle(prev => ({ ...prev, category: e.target.value }))}
              className="w-full p-4 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            >
              <option value="">请选择分类</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Content */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              文章内容
            </label>
            <textarea
              value={article.content}
              onChange={(e) => setArticle(prev => ({ ...prev, content: e.target.value }))}
              placeholder="请输入文章内容"
              rows={12}
              className="w-full p-4 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
            ></textarea>
          </div>

          {/* Summary */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              文章摘要
            </label>
            <textarea
              value={article.summary}
              onChange={(e) => setArticle(prev => ({ ...prev, summary: e.target.value }))}
              placeholder="请输入文章摘要（可选）"
              rows={4}
              className="w-full p-4 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
            ></textarea>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-4 justify-between pt-6 border-t border-[var(--border)]/50">
            <Link
              href="/accounts"
              className="px-8 py-3 bg-[var(--background)] text-[var(--text-primary)] rounded-lg hover:shadow-lg transition-all duration-300 font-medium"
            >
              取消
            </Link>
            <button
              type="submit"
              disabled={submitting || !article.title.trim() || !article.content.trim() || !article.account_id}
              className="px-8 py-3 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] text-white rounded-lg hover:shadow-lg transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? '发布中...' : '发布文章'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
