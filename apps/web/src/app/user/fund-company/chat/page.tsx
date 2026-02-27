'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { UserNav } from '@/components/UserNav';

// 对话类型定义
interface ChatMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_type: 'client' | 'fund_company';
  content: string;
  created_at: string;
  is_read: boolean;
}

interface ChatConversation {
  id: string;
  client_id: string;
  client_name: string;
  client_avatar?: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  status: 'active' | 'closed';
}

export default function FundCompanyChat() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 获取当前用户
        let currentUser = null;
        let profileData = null;

        // 检查mock session
        const mockSession = localStorage.getItem('mock_session');
        if (mockSession) {
          const sessionData = JSON.parse(mockSession);
          currentUser = sessionData.user;
        } else {
          const { data: { user: supabaseUser } } = await supabase.auth.getUser();
          currentUser = supabaseUser;
        }

        if (currentUser?.email) {
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('email', currentUser.email)
            .single();
          profileData = userData;
        }

        setUser(currentUser);
        setProfile(profileData);

        // 检查是否为基金公司角色
        const userRole = profileData?.role || currentUser?.user_metadata?.role || currentUser?.role;
        if (userRole !== 'fund_company' && userRole !== 'FUND_COMPANY') {
          setMessage({ type: 'error', text: '您没有权限访问此页面' });
          setLoading(false);
          return;
        }

        // 获取对话列表
        await fetchConversations();
      } catch (error) {
        console.error('Error fetching data:', error);
        setMessage({ type: 'error', text: '加载数据失败' });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      // 从chat_conversations表获取对话数据
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .order('last_message_time', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error);
        // 如果没有表，使用模拟数据
        setConversations(getMockConversations());
      } else {
        setConversations(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      setConversations(getMockConversations());
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      // 从chat_messages表获取消息数据
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        // 如果没有表，使用模拟数据
        setMessages(getMockMessages(conversationId));
      } else {
        setMessages(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(getMockMessages(conversationId));
    }
  };

  // 模拟对话数据
  const getMockConversations = (): ChatConversation[] => [
    {
      id: '1',
      client_id: 'client_001',
      client_name: '张三',
      last_message: '请问这个基金的净值更新频率是怎样的？',
      last_message_time: '2024-03-15T14:30:00',
      unread_count: 2,
      status: 'active'
    },
    {
      id: '2',
      client_id: 'client_002',
      client_name: '李四',
      last_message: '我想了解一下申购费率',
      last_message_time: '2024-03-15T10:15:00',
      unread_count: 0,
      status: 'active'
    },
    {
      id: '3',
      client_id: 'client_003',
      client_name: '王五',
      last_message: '谢谢您的解答',
      last_message_time: '2024-03-14T16:45:00',
      unread_count: 0,
      status: 'closed'
    },
    {
      id: '4',
      client_id: 'client_004',
      client_name: '赵六',
      last_message: '请问最低投资金额是多少？',
      last_message_time: '2024-03-15T09:20:00',
      unread_count: 1,
      status: 'active'
    }
  ];

  // 模拟消息数据
  const getMockMessages = (conversationId: string): ChatMessage[] => {
    const baseMessages: ChatMessage[] = [
      {
        id: '1',
        sender_id: 'client_001',
        sender_name: '张三',
        sender_type: 'client',
        content: '您好，我想咨询一下稳健增长混合基金的相关信息',
        created_at: '2024-03-15T14:25:00',
        is_read: true
      },
      {
        id: '2',
        sender_id: 'fund_company',
        sender_name: '客服',
        sender_type: 'fund_company',
        content: '您好！很高兴为您服务。稳健增长混合基金是我们公司的明星产品，主要投资于股票和债券的混合组合，风险等级为中风险。',
        created_at: '2024-03-15T14:27:00',
        is_read: true
      },
      {
        id: '3',
        sender_id: 'client_001',
        sender_name: '张三',
        sender_type: 'client',
        content: '请问这个基金的净值更新频率是怎样的？',
        created_at: '2024-03-15T14:30:00',
        is_read: false
      }
    ];
    return baseMessages;
  };

  const handleSelectConversation = (conversation: ChatConversation) => {
    setSelectedConversation(conversation);
    fetchMessages(conversation.id);
    
    // 标记为已读
    if (conversation.unread_count > 0) {
      const updatedConversations = conversations.map(c =>
        c.id === conversation.id ? { ...c, unread_count: 0 } : c
      );
      setConversations(updatedConversations);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedConversation) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender_id: user?.id || 'fund_company',
      sender_name: '客服',
      sender_type: 'fund_company',
      content: messageInput.trim(),
      created_at: new Date().toISOString(),
      is_read: false
    };

    try {
      // 保存消息到数据库
      const { error } = await supabase
        .from('chat_messages')
        .insert([{
          conversation_id: selectedConversation.id,
          sender_id: newMessage.sender_id,
          sender_name: newMessage.sender_name,
          sender_type: newMessage.sender_type,
          content: newMessage.content
        }]);

      if (error) {
        console.error('Error sending message:', error);
      }

      // 更新本地消息列表
      setMessages([...messages, newMessage]);
      setMessageInput('');

      // 更新对话列表中的最后一条消息
      const updatedConversations = conversations.map(c =>
        c.id === selectedConversation.id
          ? { ...c, last_message: newMessage.content, last_message_time: newMessage.created_at }
          : c
      );
      setConversations(updatedConversations);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleCloseConversation = async (conversationId: string) => {
    if (!confirm('确定要关闭此对话吗？')) return;

    try {
      const { error } = await supabase
        .from('chat_conversations')
        .update({ status: 'closed' })
        .eq('id', conversationId);

      if (error) {
        console.error('Error closing conversation:', error);
      }

      const updatedConversations = conversations.map(c =>
        c.id === conversationId ? { ...c, status: 'closed' as const } : c
      );
      setConversations(updatedConversations);
      
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return '昨天';
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      return date.toLocaleDateString('zh-CN');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">加载中...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">客户对话</h1>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left sidebar */}
        <div className="lg:col-span-1">
          <UserNav user={user} profile={profile} />
        </div>

        {/* Main content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-md overflow-hidden" style={{ height: '600px' }}>
            <div className="flex h-full">
              {/* 对话列表 */}
              <div className="w-1/3 border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold">对话列表</h2>
                  <div className="mt-2 flex space-x-2">
                    <span className="text-sm text-gray-500">
                      总计: {conversations.length}
                    </span>
                    <span className="text-sm text-green-600">
                      进行中: {conversations.filter(c => c.status === 'active').length}
                    </span>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {conversations.map((conversation) => (
                    <div
                      key={conversation.id}
                      onClick={() => handleSelectConversation(conversation)}
                      className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedConversation?.id === conversation.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                            {conversation.client_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{conversation.client_name}</p>
                            <p className="text-sm text-gray-500 truncate max-w-[150px]">
                              {conversation.last_message}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400">{formatTime(conversation.last_message_time)}</p>
                          {conversation.unread_count > 0 && (
                            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-red-500 rounded-full mt-1">
                              {conversation.unread_count}
                            </span>
                          )}
                          {conversation.status === 'closed' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 mt-1">
                              已关闭
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {conversations.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      暂无对话
                    </div>
                  )}
                </div>
              </div>

              {/* 聊天区域 */}
              <div className="w-2/3 flex flex-col">
                {selectedConversation ? (
                  <>
                    {/* 聊天头部 */}
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                          {selectedConversation.client_name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{selectedConversation.client_name}</h3>
                          <p className="text-sm text-gray-500">
                            {selectedConversation.status === 'active' ? '在线' : '离线'}
                          </p>
                        </div>
                      </div>
                      {selectedConversation.status === 'active' && (
                        <button
                          onClick={() => handleCloseConversation(selectedConversation.id)}
                          className="px-3 py-1 text-sm text-red-600 border border-red-600 rounded-md hover:bg-red-50 transition-colors"
                        >
                          关闭对话
                        </button>
                      )}
                    </div>

                    {/* 消息列表 */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.sender_type === 'fund_company' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg px-4 py-2 ${
                              msg.sender_type === 'fund_company'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <p className="text-sm">{msg.content}</p>
                            <p className={`text-xs mt-1 ${msg.sender_type === 'fund_company' ? 'text-blue-200' : 'text-gray-500'}`}>
                              {formatTime(msg.created_at)}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* 输入区域 */}
                    {selectedConversation.status === 'active' ? (
                      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={messageInput}
                            onChange={(e) => setMessageInput(e.target.value)}
                            placeholder="输入消息..."
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            type="submit"
                            disabled={!messageInput.trim()}
                            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400"
                          >
                            发送
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="p-4 border-t border-gray-200 text-center text-gray-500">
                        此对话已关闭
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <p>选择一个对话开始聊天</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
