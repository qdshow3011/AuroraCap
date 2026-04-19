'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
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
  related_fund_id?: string;
}

export default function MessageDetail() {
  const params = useParams();
  const router = useRouter();
  const messageId = params.messageId as string;
  
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [message, setMessage] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isObserverMode, setIsObserverMode] = useState(false);

  useEffect(() => {
    const fetchMessageData = async () => {
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
          
          // Fetch message
          const { data: messageData, error: messageError } = await supabase
            .from('system_messages')
            .select('*')
            .eq('id', messageId)
            .single();
          
          if (messageError) {
            throw messageError;
          }
          
          if (messageData.user_id !== profileData.id) {
            throw new Error('您无权访问此消息');
          }
          
          setMessage(messageData);
          
          // Mark as read if not already
          if (!messageData.is_read) {
            await supabase
              .from('system_messages')
              .update({ is_read: true })
              .eq('id', messageId);
          }
        }
      } catch (err: any) {
        console.error('Error fetching message:', err);
        setError(err.message || '获取消息失败');
      } finally {
        setLoading(false);
      }
    };

    fetchMessageData();
  }, [messageId]);

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
      case 'system': return '系统消息';
      case 'investment': return '投资消息';
      case 'activity': return '活动消息';
      default: return '未知消息';
    }
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-8">加载中...</div>;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
        <Link href="/user/messages" className="text-blue-600 hover:underline">
          返回消息列表
        </Link>
      </div>
    );
  }

  if (!user || !message) {
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">消息详情</h1>
        <Link 
          href="/user/messages" 
          className="text-blue-600 hover:underline"
        >
          返回消息列表
        </Link>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left sidebar */}
        <div className="lg:col-span-1">
          <UserNav user={user} profile={profile} />
        </div>
        
        {/* Main content */}
        <div className="lg:col-span-3">
          <BlurEffect isBlurred={isObserverMode}>
            {/* Message Header */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold">{message.title}</h2>
                  <div className="flex items-center mt-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(message.type)}`}>
                      {getTypeText(message.type)}
                    </span>
                    <span className="text-gray-500 text-sm ml-4">
                      {new Date(message.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Message Content */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-xl font-semibold mb-4">消息内容</h3>
              <div className="bg-gray-50 p-6 rounded-md border border-gray-200">
                <p className="text-gray-800 whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
            
            {/* Related Actions */}
            {message.related_fund_id && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold mb-4">相关操作</h3>
                <Link 
                  href={`/funds/${message.related_fund_id}`}
                  className="inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  查看相关基金
                </Link>
              </div>
            )}
          </BlurEffect>
        </div>
      </div>
    </div>
  );
}
