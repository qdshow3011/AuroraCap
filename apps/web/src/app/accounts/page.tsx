'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

export default function AccountManagement() {
  const { t } = useTranslation('common');
  const router = useRouter();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAccount, setNewAccount] = useState({
    name: '',
    description: '',
    avatar: ''
  });
  const [creating, setCreating] = useState(false);

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

  // Fetch accounts
  useEffect(() => {
    const fetchAccounts = async () => {
      if (!user) return;

      try {
        setLoading(true);
        console.log('Fetching accounts for user:', user.id);
        
        const url = new URL('/api/accounts', window.location.origin);
        
        const response = await fetch(url.toString());
        
        if (!response.ok) {
          throw new Error('Failed to fetch accounts');
        }
        
        const result = await response.json();
        const { data } = result;
        
        // Filter accounts by current user
        const userAccounts = data?.filter((account: any) => account.user_id === user.id) || [];
        
        console.log('Successfully fetched user accounts:', userAccounts?.length || 0, 'accounts found');
        setAccounts(userAccounts);
      } catch (error) {
        console.error('Error fetching accounts:', error);
        setAccounts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, [user]);

  // Handle create account
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newAccount.name.trim() || !user) {
      return;
    }

    try {
      setCreating(true);
      
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newAccount,
          user_id: user.id,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create account');
      }
      
      const result = await response.json();
      const { data: newAccountData } = result;
      
      if (newAccountData) {
        setAccounts(prevAccounts => [newAccountData, ...prevAccounts]);
        setNewAccount({ name: '', description: '', avatar: '' });
        setShowCreateModal(false);
      }
    } catch (error) {
      console.error('Error creating account:', error);
    } finally {
      setCreating(false);
    }
  };

  // Show loading if either user or accounts is still loading
  if (userLoading || loading) {
    return <div className="container mx-auto px-4 py-8">{t('loading')}</div>;
  }

  if (!user) {
    router.push('/login?redirect=/accounts');
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 bg-gradient-to-br from-[var(--background)] to-[var(--surface)] min-h-screen relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden opacity-20">
        <div className="absolute top-20 right-20 w-64 h-64 bg-[var(--primary-light)]/30 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-40 left-20 w-80 h-80 bg-[var(--secondary)]/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }}></div>
      </div>

      {/* Header */}
      <div className="text-center mb-16 relative z-10">
        <div className="inline-block mb-6">
          <span className="px-4 py-1 bg-[var(--primary)]/10 text-[var(--primary)] text-sm font-semibold rounded-full">
            公众号管理
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-[var(--text-primary)] tracking-tight">
          我的公众号
        </h1>
        <p className="text-xl text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">
          创建和管理你的专属公众号，发布优质内容
        </p>
      </div>

      {/* Create Account Button */}
      <div className="max-w-4xl mx-auto mb-8 relative z-10">
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-8 py-3 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] text-white rounded-lg hover:shadow-lg transition-all duration-300 font-medium transform hover:scale-105 active:scale-95"
        >
          创建新公众号
        </button>
      </div>

      {/* Accounts List */}
      <div className="max-w-4xl mx-auto relative z-10">
        {accounts.length === 0 ? (
          <div className="text-center py-20 bg-[var(--surface)]/80 backdrop-blur-sm rounded-xl shadow-md">
            <div className="inline-block mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-muted)]">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <p className="text-lg text-[var(--text-secondary)] mb-6">
              你还没有创建任何公众号
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] text-white rounded-lg hover:shadow-lg transition-all duration-300 font-medium"
            >
              立即创建
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {accounts.map((account, index) => (
              <div
                key={account.id}
                className="bg-[var(--surface)]/90 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 border border-[var(--border)]"
              >
                <div className="flex flex-wrap items-center gap-6">
                  {/* Avatar */}
                  {account.avatar ? (
                    <img
                      src={account.avatar}
                      alt={account.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-[var(--primary)]/20 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--primary)]">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                  )}

                  {/* Account Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                      {account.name}
                    </h3>
                    {account.description && (
                      <p className="text-[var(--text-secondary)] mb-4">
                        {account.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-[var(--text-muted)]">
                      <div>
                        创建于: {new Date(account.created_at).toLocaleDateString('zh-CN')}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Link
                      href={`/articles/new?account_id=${account.id}`}
                      className="px-6 py-2 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] text-white rounded-lg hover:shadow-lg transition-all duration-300 font-medium"
                    >
                      发布文章
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Account Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surface)] rounded-xl shadow-2xl max-w-md w-full p-8">
            <h2 className="text-2xl font-bold mb-6 text-[var(--text-primary)]">
              创建新公众号
            </h2>
            
            <form onSubmit={handleCreateAccount}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    公众号名称
                  </label>
                  <input
                    type="text"
                    value={newAccount.name}
                    onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                    placeholder="请输入公众号名称"
                    className="w-full p-4 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    公众号描述
                  </label>
                  <textarea
                    value={newAccount.description}
                    onChange={(e) => setNewAccount({ ...newAccount, description: e.target.value })}
                    placeholder="请输入公众号描述"
                    rows={3}
                    className="w-full p-4 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                    公众号头像 (URL)
                  </label>
                  <input
                    type="text"
                    value={newAccount.avatar}
                    onChange={(e) => setNewAccount({ ...newAccount, avatar: e.target.value })}
                    placeholder="请输入头像图片URL"
                    className="w-full p-4 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                  />
                </div>
              </div>
              
              <div className="flex gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewAccount({ name: '', description: '', avatar: '' });
                  }}
                  className="flex-1 px-6 py-3 bg-[var(--background)] text-[var(--text-primary)] rounded-lg hover:shadow-lg transition-all duration-300 font-medium"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={creating || !newAccount.name.trim()}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-light)] text-white rounded-lg hover:shadow-lg transition-all duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? '创建中...' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
