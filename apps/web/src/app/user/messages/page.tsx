'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { UserNav } from '@/components/UserNav';
import BlurEffect from '@/components/BlurEffect';

interface Message {
  id: string;
  title: string;
  content: string;
  type: 'system' | 'investment' | 'activity';
  is_read: boolean;
  created_at: string;
  user_id: string;
}

export default function MessagesList() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [isObserverMode, setIsObserverMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'system' | 'investment' | 'activity'>('all');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        let currentUser = null;
        let profileData = null;
        
        // 1. First check for mock session in localStorage
        try {
          const mockSession = localStorage.getItem('mock_session');
          if (mockSession) {
            const sessionData = JSON.parse(mockSession);
            currentUser = sessionData.user;
            
            // Get user profile from users table
            if (currentUser?.email) {
              const { data: userData } = await supabase
                .from('users')
                .select('*')
                .eq('email', currentUser.email)
                .single();
              profileData = userData;
            }
          }
        } catch (mockError) {
          console.error('Mock session error:', mockError);
        }
        
        // 2. If no mock session, try Supabase Auth
        if (!currentUser) {
          try {
            const { data: { user: supabaseUser } } = await supabase.auth.getUser();
            currentUser = supabaseUser;
            
            if (currentUser?.email) {
              const { data: userData } = await supabase
                .from('users')
                .select('*')
                .eq('email', currentUser.email)
                .single();
              profileData = userData;
            }
          } catch (authError) {
            console.error('Supabase Auth error:', authError);
          }
        }
        
        if (currentUser && profileData) {
          setUser(currentUser);
          setProfile(profileData);
          setIsObserverMode(profileData.role === 'Guest' || profileData.role === 'USER');
          
          // Fetch messages
          const { data: messagesData } = await supabase
            .from('system_messages')
            .select('*')
            .eq('user_id', profileData.id)
            .order('created_at', { ascending: false });
          
          setMessages(messagesData || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const filteredMessages = messages.filter(message => {
    if (activeTab === 'all') return true;
    return message.type === activeTab;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'system': return 'bg-blue-100 text-blue-800';
      case 'investment': return 'bg-green-100 text-green-800';
      case 'activity': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'system': return '系统';
      case 'investment': return '投资';
      case 'activity': return '活动';
      default: return '未知';
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      await supabase
        .from('system_messages')
        .update({ is_read: true })
        .eq('id', messageId);
      
      // Update local state
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, is_read: true } : msg
      ));
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-8">加载中...</div>;
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl mx-auto text-center">
          <h1 className="text-2xl md:text-3xl font-bold mb-4">需要登录</h1>
          <p className="text-gray-600 mb-8">
            请登录以查看您的消息。如果您已经登录，请刷新页面重试。
          </p>
          <Link 
            href="/login" 
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            去登录
          </Link>
        </div>
      </div>
    );
  }

  const unreadCount = messages.filter(msg => !msg.is_read).length;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">消息中心</h1>
        {unreadCount > 0 && (
          <span className="bg-red-500 text-white text-xs px-2.5 py-0.5 rounded-full">
            {unreadCount}
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left sidebar */}
        <div className="lg:col-span-1">
          <UserNav user={user} profile={profile} />
        </div>
        
        {/* Main content */}
        <div className="lg:col-span-3">
          <BlurEffect isBlurred={isObserverMode}>
            {/* Filter Tabs */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex border-b border-gray-200">
                {[
                  { key: 'all' as const, label: '全部' },
                  { key: 'system' as const, label: '系统' },
                  { key: 'investment' as const, label: '投资' },
                  { key: 'activity' as const, label: '活动' },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-4 py-3 text-sm font-medium ${activeTab === tab.key ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Messages List */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">消息列表</h2>
              
              {filteredMessages.length > 0 ? (
                <div className="space-y-4">
                  {filteredMessages.map(message => (
                    <Link 
                      key={message.id}
                      href={`/user/messages/${message.id}`}
                      className={`block p-4 border rounded-md transition-colors ${message.is_read ? 'border-gray-200 hover:border-blue-500' : 'border-blue-200 bg-blue-50 hover:border-blue-400'}`}
                      onClick={() => !message.is_read && markAsRead(message.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <h3 className={`font-medium ${message.is_read ? 'text-gray-900' : 'font-bold text-gray-900'}`}>
                              {message.title}
                            </h3>
                            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(message.type)}`}>
                              {getTypeText(message.type)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {message.content}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            {new Date(message.created_at).toLocaleString()}
                          </p>
                        </div>
                        {!message.is_read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full ml-4"></div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-md">
                  <p className="text-gray-500">暂无消息</p>
                </div>
              )}
            </div>
          </BlurEffect>
        </div>
      </div>
    </div>
  );
}
