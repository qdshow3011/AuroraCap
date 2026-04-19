'use client';
import { useState, useEffect } from 'react';
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
        
        // Mock messages data
        const mockMessages: Message[] = [
          {
            id: '1',
            title: '系统通知：账户安全升级',
            content: '尊敬的用户，为了保障您的账户安全，我们将于近期进行系统升级，期间可能会短暂影响部分功能的使用。\n\n升级时间：2024年1月20日 23:00-24:00\n升级内容：账户安全系统升级\n影响范围：登录、修改密码等功能\n\n感谢您的理解与支持！',
            type: 'system',
            is_read: false,
            created_at: '2024-01-15T10:30:00Z',
            user_id: '1'
          },
          {
            id: '2',
            title: '投资提醒：市场波动',
            content: '您持有的嘉实沪深300ETF联接A近期出现较大波动，建议关注市场动态。\n\n最新净值：1.3245\n日涨跌幅：-0.56%\n近一周涨跌幅：-2.34%\n\n投资有风险，入市需谨慎。',
            type: 'investment',
            is_read: false,
            created_at: '2024-01-14T14:20:00Z',
            user_id: '1',
            related_fund_id: '1'
          },
          {
            id: '3',
            title: '活动通知：新用户专享',
            content: '尊敬的新用户，您可以参与我们的新用户专享活动，首次投资可获得额外收益。\n\n活动时间：2024年1月1日-2024年3月31日\n活动内容：首次投资满1000元，即可获得10元现金红包\n参与方式：直接在平台进行投资即可自动参与\n\n机会有限，不容错过！',
            type: 'activity',
            is_read: true,
            created_at: '2024-01-13T09:15:00Z',
            user_id: '1'
          },
          {
            id: '4',
            title: '系统通知：密码更新',
            content: '您的账户密码已成功更新，请妥善保管您的新密码。\n\n更新时间：2024年1月12日 16:45\n如果不是您本人操作，请立即联系客服。',
            type: 'system',
            is_read: true,
            created_at: '2024-01-12T16:45:00Z',
            user_id: '1'
          },
          {
            id: '5',
            title: '投资提醒：分红到账',
            content: '您持有的易方达蓝筹精选混合A已于昨日分红，分红金额已转入您的账户。\n\n基金名称：易方达蓝筹精选混合A\n分红金额：128.56元\n分红方式：现金分红\n到账时间：2024年1月11日\n\n感谢您的投资！',
            type: 'investment',
            is_read: false,
            created_at: '2024-01-11T11:20:00Z',
            user_id: '1',
            related_fund_id: '2'
          }
        ];
        
        // Find the message with the given id
        const foundMessage = mockMessages.find(msg => msg.id === messageId);
        
        if (!foundMessage) {
          throw new Error('消息不存在');
        }
        
        setMessage(foundMessage);
        
        // Mark as read if not already
        if (!foundMessage.is_read) {
          // Mock API call - replace with actual API call
          await new Promise(resolve => setTimeout(resolve, 500));
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
