'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { UserNav } from '@/components/UserNav';
import BlurEffect from '@/components/BlurEffect';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'system';
  timestamp: string;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export default function CustomerService() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isObserverMode, setIsObserverMode] = useState(false);
  
  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // FAQ state
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        // Mock user data
        const mockUser = {
          id: '1',
          email: 'user@example.com',
          name: '张三'
        };
        
        const mockProfile = {
          id: '1',
          user_id: '1',
          name: '张三',
          phone: '138****8888',
          role: 'USER'
        };
        
        setUser(mockUser);
        setProfile(mockProfile);
        setIsObserverMode(mockProfile.role === 'Guest' || mockProfile.role === 'USER');
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
    
    // Initialize chat with welcome message
    setMessages([
      {
        id: '1',
        content: '您好！欢迎使用极光资本客服系统，请问有什么可以帮助您的？',
        sender: 'system',
        timestamp: new Date().toISOString()
      }
    ]);
    
    // Mock FAQ data
    setFaqs([
      {
        id: '1',
        question: '如何申购基金？',
        answer: '您可以在基金详情页面点击"立即申购"按钮，按照提示填写申购金额并完成支付即可。',
        category: '投资'
      },
      {
        id: '2',
        question: '基金赎回需要多久到账？',
        answer: '一般情况下，基金赎回后1-3个工作日到账，具体时间取决于您的银行处理速度。',
        category: '投资'
      },
      {
        id: '3',
        question: '如何修改登录密码？',
        answer: '您可以在"账户安全"页面点击"修改密码"按钮，按照提示完成密码修改。',
        category: '账户'
      },
      {
        id: '4',
        question: '如何进行实名认证？',
        answer: '您可以在"个人资料"页面的"实名认证"部分，填写真实姓名和身份证信息并上传身份证照片进行认证。',
        category: '账户'
      },
      {
        id: '5',
        question: '客服服务时间是多久？',
        answer: '客服服务时间为周一至周五 9:00-18:00，节假日休息。',
        category: '其他'
      },
      {
        id: '6',
        question: '如何查看我的交易记录？',
        answer: '您可以在"交易记录"页面查看您的所有交易历史，包括申购、赎回等操作。',
        category: '投资'
      },
      {
        id: '7',
        question: '如何绑定银行卡？',
        answer: '您可以在"个人资料"页面的"银行卡管理"部分，添加您的银行卡信息。',
        category: '账户'
      }
    ]);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    
    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');
    
    // Simulate system response
    setIsTyping(true);
    setTimeout(() => {
      const systemResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: '感谢您的咨询，我们会尽快为您处理。如果您有其他问题，请随时告诉我。',
        sender: 'system',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, systemResponse]);
      setIsTyping(false);
    }, 1000);
  };

  const handleQuickReply = (reply: string) => {
    setInputMessage(reply);
    handleSendMessage();
  };

  const categories = ['all', '投资', '账户', '其他'];
  const quickReplies = [
    '如何查看我的持仓？',
    '如何进行基金赎回？',
    '如何修改个人信息？',
    '客服服务时间是多久？'
  ];

  if (loading) {
    return <div className="container mx-auto px-4 py-8">加载中...</div>;
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl mx-auto text-center">
          <h1 className="text-2xl md:text-3xl font-bold mb-4">需要登录</h1>
          <p className="text-gray-600 mb-8">
            请登录以使用客服系统。如果您已经登录，请刷新页面重试。
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

  const filteredFaqs = activeCategory === 'all' ? faqs : faqs.filter(faq => faq.category === activeCategory);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">客服中心</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left sidebar */}
        <div className="lg:col-span-1">
          <UserNav user={user} profile={profile} />
        </div>
        
        {/* Main content */}
        <div className="lg:col-span-3">
          <BlurEffect isBlurred={isObserverMode}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chat Section */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-blue-600 text-white p-4">
                  <h2 className="text-xl font-semibold">在线客服</h2>
                  <p className="text-sm opacity-80">服务时间：周一至周五 9:00-18:00</p>
                </div>
                
                {/* Chat Messages */}
                <div className="p-4 h-96 overflow-y-auto bg-gray-50">
                  {messages.map(message => (
                    <div 
                      key={message.id} 
                      className={`flex mb-4 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] ${message.sender === 'user' ? 'bg-blue-100 text-blue-800' : 'bg-white text-gray-800 border border-gray-200'}`}>
                        <div className="p-3 rounded-lg">
                          <p>{message.content}</p>
                          <p className="text-xs text-gray-500 mt-1 text-right">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start mb-4">
                      <div className="bg-white text-gray-800 border border-gray-200 max-w-[80%]">
                        <div className="p-3 rounded-lg">
                          <p className="text-gray-500">客服正在输入...</p>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
                
                {/* Chat Input */}
                <div className="p-4 border-t">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="请输入您的问题..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim()}
                      className={`px-4 py-2 rounded-md transition-colors ${!inputMessage.trim() ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                    >
                      发送
                    </button>
                  </div>
                  
                  {/* Quick Replies */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {quickReplies.map((reply, index) => (
                      <button
                        key={index}
                        onClick={() => handleQuickReply(reply)}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* FAQ Section */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-blue-600 text-white p-4">
                  <h2 className="text-xl font-semibold">常见问题</h2>
                </div>
                
                {/* FAQ Categories */}
                <div className="p-4 border-b">
                  <div className="flex space-x-2">
                    {categories.map(category => (
                      <button
                        key={category}
                        onClick={() => setActiveCategory(category as 'all' | '投资' | '账户' | '其他')}
                        className={`px-3 py-1 rounded-full text-sm ${activeCategory === category ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      >
                        {category === 'all' ? '全部' : category}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* FAQ List */}
                <div className="p-4 h-96 overflow-y-auto">
                  {filteredFaqs.length > 0 ? (
                    <div className="space-y-4">
                      {filteredFaqs.map(faq => (
                        <div key={faq.id} className="border border-gray-200 rounded-md overflow-hidden">
                          <div className="p-3 bg-gray-50">
                            <h3 className="font-medium">{faq.question}</h3>
                          </div>
                          <div className="p-3">
                            <p className="text-gray-600">{faq.answer}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      暂无相关问题
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Contact Info */}
            <div className="bg-white rounded-lg shadow-md p-6 mt-6">
              <h2 className="text-xl font-semibold mb-4">其他联系方式</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    📞
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">客服电话</p>
                    <p className="font-medium">400-123-4567</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    📧
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">客服邮箱</p>
                    <p className="font-medium">service@auroracapital.com</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    💬
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">在线客服</p>
                    <p className="font-medium">工作日 9:00-18:00</p>
                  </div>
                </div>
              </div>
            </div>
          </BlurEffect>
        </div>
      </div>
    </div>
  );
}
