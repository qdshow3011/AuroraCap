import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Spin, Alert, message } from 'antd';
import { DeleteOutlined, LeftOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabaseClient } from '../../main';

// 客户类型定义
interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
}

// 服务员类型定义
interface Waiter {
  id: string;
  name: string;
  email: string;
  phone: string;
}

// 聊天会话类型定义
interface ChatSession {
  id: string;
  user_id: string;
  agent_id: string;
  status: 'active' | 'closed' | 'pending';
  last_message_at: string;
  created_at: string;
  // 关联的用户信息
  user_name?: string;
  agent_name?: string;
  customer?: Customer;
  agent?: Waiter;
}

// 聊天消息类型定义
interface ChatMessage {
  id: string;
  chat_session_id: string;
  sender_id: string;
  sender_type: 'user' | 'agent';
  content: string;
  created_at: string;
}

const ChatDetail: React.FC = () => {
  // 使用React Router的useSearchParams钩子获取URL参数
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // 状态管理
  const [customerId] = useState<string>(searchParams.get('customerId') || '');
  const [waiterId] = useState<string>(searchParams.get('waiterId') || '');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [waiter, setWaiter] = useState<Waiter | null>(null);
  const [allWaiters, setAllWaiters] = useState<Waiter[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  
  // UUID验证函数
  const isValidUUID = (id: string): boolean => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
  };

  // 获取客户信息
  const fetchCustomerInfo = async () => {
    try {
      // 验证UUID格式
      if (!isValidUUID(customerId)) {
        console.error('无效的客户ID格式:', customerId);
        setError('无效的客户ID');
        message.error('无效的客户ID');
        return;
      }
      
      const { data, error } = await supabaseClient
        .from('users')
        .select('id, name, email, phone')
        .eq('id', customerId)
        .eq('role', 'customer')
        .single();

      if (error) {
        // 处理PGRST116错误（没有找到记录）
        if (error.code === 'PGRST116') {
          console.error('客户不存在:', customerId);
          setError('客户不存在');
          message.error('客户不存在');
        } else {
          throw error;
        }
        return;
      }
      setCustomer(data as Customer);
    } catch (err) {
      console.error('Failed to fetch customer info:', err);
      setError('获取客户信息失败');
      message.error('获取客户信息失败');
    }
  };

  // 获取客服信息
  const fetchWaiterInfo = async () => {
    try {
      // 验证UUID格式
      if (!isValidUUID(waiterId)) {
        console.error('无效的客服ID格式:', waiterId);
        setError('无效的客服ID');
        message.error('无效的客服ID');
        return;
      }
      
      const { data, error } = await supabaseClient
        .from('users')
        .select('id, name, email, phone')
        .eq('id', waiterId)
        .eq('role', 'waiter')
        .single();

      if (error) {
        // 处理PGRST116错误（没有找到记录）
        if (error.code === 'PGRST116') {
          console.error('客服不存在:', waiterId);
          setError('客服不存在');
          message.error('客服不存在');
        } else {
          throw error;
        }
        return;
      }
      setWaiter(data as Waiter);
    } catch (err) {
      console.error('Failed to fetch waiter info:', err);
      setError('获取客服信息失败');
      message.error('获取客服信息失败');
    }
  };

  // 获取所有服务员信息
  const fetchAllWaiters = async () => {
    try {
      const { data, error } = await supabaseClient
        .from('users')
        .select('id, name, email, phone')
        .eq('role', 'waiter');

      if (error) throw error;
      setAllWaiters((data || []) as Waiter[]);
    } catch (err) {
      console.error('Failed to fetch all waiters:', err);
    }
  };

  // 获取聊天会话
  const fetchChatSessions = async () => {
    try {
      console.log('开始获取聊天会话，customerId:', customerId, 'waiterId:', waiterId);
      
      // 验证UUID格式
      if (!isValidUUID(customerId)) {
        console.error('无效的客户ID格式:', customerId);
        setError('无效的客户ID');
        message.error('无效的客户ID');
        setChatSessions([]);
        return;
      }
      
      if (!isValidUUID(waiterId)) {
        console.error('无效的客服ID格式:', waiterId);
        setError('无效的客服ID');
        message.error('无效的客服ID');
        setChatSessions([]);
        return;
      }
      
      const { data, error } = await supabaseClient
        .from('chat_sessions')
        .select('id, user_id, agent_id, status, last_message_at, created_at, users:user_id(name), agents:agent_id(name)')
        .eq('user_id', customerId)
        .eq('agent_id', waiterId)
        .order('last_message_at', { ascending: false });

      console.log('获取到的聊天会话数据:', data);
      console.log('获取聊天会话的错误:', error);

      if (error) throw error;

      const formattedSessions: ChatSession[] = (data || []).map(session => ({
        id: session.id,
        user_id: session.user_id,
        agent_id: session.agent_id,
        status: session.status,
        last_message_at: session.last_message_at,
        created_at: session.created_at,
        user_name: session.users && Array.isArray(session.users) ? session.users[0]?.name : undefined,
        agent_name: session.agents && Array.isArray(session.agents) ? session.agents[0]?.name : undefined,
        customer: session.users && Array.isArray(session.users) && session.users.length > 0 ? session.users[0] as Customer : undefined,
        agent: session.agents && Array.isArray(session.agents) && session.agents.length > 0 ? session.agents[0] as Waiter : undefined
      }));

      console.log('格式化后的聊天会话:', formattedSessions);
      setChatSessions(formattedSessions);
    } catch (err) {
      console.error('Failed to fetch chat sessions:', err);
      message.error('获取聊天会话失败');
      setChatSessions([]);
    }
  };

  // 获取聊天消息
  const fetchChatMessages = async () => {
    try {
      setLoadingMessages(true);
      console.log('开始获取聊天消息');
      
      // 获取客户的所有会话
      if (chatSessions.length === 0) {
        console.log('没有找到聊天会话，无法获取消息');
        setChatMessages([]);
        return;
      }
      
      // 获取所有会话的ID
      const sessionIds = chatSessions.map(session => session.id);
      console.log('要获取消息的会话ID列表:', sessionIds);
      
      // 获取所有消息
      const { data: messages, error: messagesError } = await supabaseClient
        .from('messages')
        .select('id, chat_session_id, sender_id, sender_type, content, created_at')
        .in('chat_session_id', sessionIds)
        .order('created_at', { ascending: true });
      
      console.log('获取到的聊天消息数据:', messages);
      console.log('获取聊天消息的错误:', messagesError);
      
      if (messagesError) {
        console.error('获取聊天消息失败:', messagesError);
        message.error('获取聊天消息失败');
        setChatMessages([]);
        return;
      }
      
      console.log('设置聊天消息:', messages || []);
      setChatMessages(messages || []);
    } catch (err) {
      console.error('Failed to fetch chat messages:', err);
      message.error('获取聊天消息失败');
      setChatMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };

  // 删除聊天消息
  const deleteChatMessage = async () => {
    if (!selectedMessageId) return;
    
    try {
      const { error: deleteError } = await supabaseClient
        .from('messages')
        .delete()
        .eq('id', selectedMessageId);
      
      if (deleteError) {
        console.error('删除聊天消息失败:', deleteError);
        message.error('删除聊天消息失败');
        throw deleteError;
      }
      
      // 更新消息列表
      setChatMessages(prevMessages => 
        prevMessages.filter(message => message.id !== selectedMessageId)
      );
      
      message.success('消息删除成功');
      setIsDeleteModalVisible(false);
      setSelectedMessageId(null);
    } catch (err) {
      console.error('Failed to delete chat message:', err);
      message.error('消息删除失败');
    }
  };

  // 显示删除确认模态框
  const showDeleteModal = (messageId: string) => {
    setSelectedMessageId(messageId);
    setIsDeleteModalVisible(true);
  };

  // 关闭删除确认模态框
  const handleDeleteCancel = () => {
    setIsDeleteModalVisible(false);
    setSelectedMessageId(null);
  };

  // 返回上一页
  const handleBack = () => {
    navigate(-1);
  };

  // 初始加载
  useEffect(() => {
    console.log('初始加载，customerId:', customerId, 'waiterId:', waiterId);
    
    // 验证ID是否有效
    if (!customerId || customerId === 'undefined' || customerId === 'null') {
      setError('客户ID不能为空');
      setLoading(false);
      return;
    }
    
    if (!waiterId || waiterId === 'undefined' || waiterId === 'null') {
      setError('客服ID不能为空');
      setLoading(false);
      return;
    }
    
    const loadData = async () => {
      try {
        await Promise.all([
          fetchCustomerInfo(),
          fetchWaiterInfo(),
          fetchAllWaiters(),
          fetchChatSessions()
        ]);
      } catch (err) {
        console.error('Failed to load initial data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [customerId, waiterId]);

  // 加载消息
  useEffect(() => {
    if (chatSessions.length > 0) {
      fetchChatMessages();
    }
  }, [chatSessions]);

  // 消息表格列配置
  const messageColumns = [
    {
      title: '发送者',
      dataIndex: 'sender_id',
      key: 'sender_id',
      render: (senderId: string, record: ChatMessage) => {
        console.log('发送者信息:', { senderId, record, customerId: customer?.id, customerName: customer?.name, senderType: record.sender_type });
        // 先检查是否是客服发送的消息
        if (record.sender_type === 'agent') {
          // 从所有服务员列表中查找对应的服务员姓名
          const sender = allWaiters.find(w => w.id === senderId);
          console.log('找到的服务员:', sender, '所有服务员:', allWaiters);
          return sender?.name || waiter?.name || '服务员';
        }
        // 再检查是否是客户发送的消息
        else if (record.sender_type === 'user' || senderId === customer?.id) {
          return customer?.name || '客户';
        } else {
          return '未知发送者';
        }
      }
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      render: (content: string) => (
        <div style={{ maxWidth: 400, whiteSpace: 'pre-wrap' }}>{content}</div>
      )
    },
    {
      title: '发送时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (time: string) => new Date(time).toLocaleString()
    },
    {
      title: '操作',
      key: 'action',
      render: (_text: string, record: ChatMessage) => (
        <Space size="middle">
          <Button 
            type="default" 
            danger
            icon={<DeleteOutlined />} 
            size="small"
            onClick={() => showDeleteModal(record.id)}
          >
            删除
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: 20 }}>
      {/* 头部导航 */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center' }}>
        <Button 
          type="default" 
          icon={<LeftOutlined />} 
          onClick={handleBack}
          style={{ marginRight: 16 }}
        >
          返回
        </Button>
        <h2>聊天详情</h2>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <Spin size="large" />
        </div>
      ) : error ? (
        <Alert message="错误" description={error} type="error" showIcon />
      ) : customer && waiter ? (
        <div>
          {/* 客户和客服信息 */}
          <div style={{ marginBottom: 20, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 8, display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <h3>客户信息</h3>
              <p style={{ margin: '4px 0' }}>姓名: {customer.name}</p>
              <p style={{ margin: '4px 0' }}>邮箱: {customer.email}</p>
              <p style={{ margin: '4px 0' }}>电话: {customer.phone}</p>
            </div>
            <div>
              <h3>客服信息</h3>
              <p style={{ margin: '4px 0' }}>姓名: {waiter.name}</p>
              <p style={{ margin: '4px 0' }}>邮箱: {waiter.email}</p>
              <p style={{ margin: '4px 0' }}>电话: {waiter.phone}</p>
            </div>
            <div>
              <h3>会话信息</h3>
              <p style={{ margin: '4px 0' }}>会话数量: {chatSessions.length}</p>
            </div>
          </div>

          {/* 消息列表 */}
          <div style={{ marginBottom: 20 }}>
            <h3>聊天记录</h3>
            {loadingMessages ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                <Spin size="large" />
              </div>
            ) : chatMessages.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#999', padding: '40px 0' }}>
                暂无聊天记录
              </div>
            ) : (
              <Table 
                columns={messageColumns} 
                dataSource={chatMessages} 
                rowKey="id" 
                pagination={{ pageSize: 20 }} 
                style={{ marginTop: 16 }}
              />
            )}
          </div>
        </div>
      ) : (
        <Alert message="错误" description="未找到客户信息" type="error" showIcon />
      )}

      {/* 删除确认模态框 */}
      <Modal
        title="确认删除"
        open={isDeleteModalVisible}
        onOk={deleteChatMessage}
        onCancel={handleDeleteCancel}
        okText="删除"
        cancelText="取消"
        okType="danger"
      >
        <p>确定要删除这条消息吗？</p>
      </Modal>
    </div>
  );
};

export default ChatDetail;
