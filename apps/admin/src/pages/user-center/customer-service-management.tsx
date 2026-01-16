import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, Tag, Alert, Tabs, message } from 'antd';
import { PlusOutlined, SearchOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { supabaseClient } from '../../main';

const { Option } = Select;

// 服务员类型定义
interface Waiter {
  id: string;
  name: string;
  email: string;
  phone: string;
  customers: Customer[]; // 该服务员管理的客户列表
}

// 客户类型定义
interface Customer {
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



const CustomerServiceManagement: React.FC = () => {
  // 按客户和客服组合分组的会话类型
  interface CustomerWaiterSessionGroup {
    customer: Customer;
    waiter: Waiter;
    sessions: ChatSession[];
    latestSession: ChatSession;
    messageCount: number;
  }

  // 状态管理
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [customerWaiterSessionGroups, setCustomerWaiterSessionGroups] = useState<CustomerWaiterSessionGroup[]>([]);
  const [filteredCustomerWaiterSessionGroups, setFilteredCustomerWaiterSessionGroups] = useState<CustomerWaiterSessionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWaiter, setSelectedWaiter] = useState<string | null>(null);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [isAssignModalVisible, setIsAssignModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('sessions');
  const [selectedCustomerSession, setSelectedCustomerSession] = useState<{ waiterId: string, customerId: string } | null>(null);
  const [isCustomerListVisible, setIsCustomerListVisible] = useState(false);
  const [currentWaiter, setCurrentWaiter] = useState<Waiter | null>(null);

  // 导航钩子
  const navigate = useNavigate();

  // 表单实例
  const [form] = Form.useForm();

  // 加载服务员列表
  useEffect(() => {
    fetchWaiters();
  }, []);

  // 加载客户列表
  useEffect(() => {
    fetchCustomers();
  }, []);

  // 加载聊天会话
  useEffect(() => {
    fetchChatSessions();
  }, []);

  // 获取客户与客服之间的消息数量
  const fetchMessageCount = async (customerId: string, waiterId: string): Promise<number> => {
    try {
      // 首先获取该客户与客服之间的所有会话
      const { data: sessions, error: sessionsError } = await supabaseClient
        .from('chat_sessions')
        .select('id')
        .eq('user_id', customerId)
        .eq('agent_id', waiterId);
      
      if (sessionsError) {
        console.error('获取会话失败:', sessionsError);
        return 0;
      }
      
      if (!sessions || sessions.length === 0) {
        return 0;
      }
      
      // 获取所有会话的ID
      const sessionIds = sessions.map(session => session.id);
      
      // 获取这些会话中的所有消息数量
      const { count, error: countError } = await supabaseClient
        .from('messages')
        .select('id', { count: 'exact' })
        .in('chat_session_id', sessionIds);
      
      if (countError) {
        console.error('获取消息数量失败:', countError);
        return 0;
      }
      
      return count || 0;
    } catch (error) {
      console.error('获取消息数量异常:', error);
      return 0;
    }
  };

  // 按客户和客服组合分组会话
  useEffect(() => {
    let filtered = chatSessions;
    
    // 如果有选择的服务员和客户，先过滤对应的会话
    if (selectedCustomerSession) {
      filtered = filtered.filter(session => 
        session.agent_id === selectedCustomerSession.waiterId && 
        session.user_id === selectedCustomerSession.customerId
      );
    }
    
    // 按客户ID和客服ID的组合分组会话
    const customerWaiterMap = new Map<string, CustomerWaiterSessionGroup>();
    
    filtered.forEach(session => {
      // 确保会话有有效的agent_id
      if (!session.agent_id) {
        console.error('无效的会话数据，缺少客服ID:', session);
        return;
      }
      
      // 确保customer和agent对象存在且id不为空
      if (!session.customer || !session.agent || !session.customer.id || !session.agent.id) {
        console.error('无效的会话数据，缺少客户或客服信息:', session);
        return;
      }
      
      // 使用客户ID和客服ID的组合作为key
      const groupKey = `${session.customer.id}-${session.agent.id}`;
      if (!customerWaiterMap.has(groupKey)) {
        customerWaiterMap.set(groupKey, {
          customer: session.customer,
          waiter: session.agent,
          sessions: [],
          latestSession: session,
          messageCount: 0
        });
      }
      
      const group = customerWaiterMap.get(groupKey)!;
      group.sessions.push(session);
      
      // 更新最新会话
      if (new Date(session.last_message_at) > new Date(group.latestSession.last_message_at)) {
        group.latestSession = session;
      }
    });
    
    // 转换为数组并按最后消息时间排序
    const groupsArray = Array.from(customerWaiterMap.values());
    groupsArray.sort((a, b) => 
      new Date(b.latestSession.last_message_at).getTime() - 
      new Date(a.latestSession.last_message_at).getTime()
    );
    
    setCustomerWaiterSessionGroups(groupsArray);
    
    // 获取每个会话组的消息数量
    groupsArray.forEach(async (group) => {
      const messageCount = await fetchMessageCount(group.customer.id, group.waiter.id);
      // 更新该组的消息数量
      setCustomerWaiterSessionGroups(prev => 
        prev.map(g => {
          if (g.customer.id === group.customer.id && g.waiter.id === group.waiter.id) {
            return { ...g, messageCount };
          }
          return g;
        })
      );
    });
  }, [chatSessions, selectedCustomerSession]);

  // 搜索过滤客户客服会话组
  useEffect(() => {
    if (searchText) {
      const filtered = customerWaiterSessionGroups.filter(group => 
        group.customer.name.includes(searchText) || 
        group.customer.email.includes(searchText) ||
        group.waiter.name.includes(searchText) ||
        group.waiter.email.includes(searchText)
      );
      setFilteredCustomerWaiterSessionGroups(filtered);
    } else {
      setFilteredCustomerWaiterSessionGroups(customerWaiterSessionGroups);
    }
  }, [searchText, customerWaiterSessionGroups]);

  // 获取服务员列表
  const fetchWaiters = async () => {
    try {
      // 获取所有服务员
      const { data: users, error: usersError } = await supabaseClient
        .from('users')
        .select('id, name, email, phone')
        .eq('role', 'waiter')
        .eq('status', 'active')
        .order('name', { ascending: true });

      if (usersError) throw usersError;

      // 获取所有聊天会话
      let sessions: any[] = [];
      const { data: sessionsData, error: sessionsError } = await supabaseClient
        .from('chat_sessions')
        .select(
          'agent_id, ' +
          'users:user_id(id, name, email, phone)'
        )
        .eq('status', 'active');

      if (sessionsError) {
        console.error('Failed to fetch chat sessions:', sessionsError);
        // 不抛出错误，继续执行，确保服务员列表能被设置
      } else {
        sessions = sessionsData || [];
      }

      // 确保users是数组，避免map调用失败
      const usersArray = users || [];
      
      // 为每个服务员分配客户列表
      const waitersWithCustomers: Waiter[] = usersArray.map(user => {
        // 确保user有id属性
        const userId = user?.id || '';
        // 查找该服务员的所有活跃会话
        const waiterSessions = sessions.filter(session => session?.agent_id === userId);
        // 提取唯一的客户信息
        const customers = Array.from(new Map(
          waiterSessions
            .filter(session => session?.users)
            .map(session => [session.users!.id, session.users as Customer])
        ).values());

        return {
          ...user,
          customers
        } as Waiter;
      });

      setWaiters(waitersWithCustomers);
      // 清除之前的错误
      setError(null);
    } catch (err) {
      console.error('Failed to fetch waiters:', err);
      setError('获取服务员列表失败');
      // 即使发生错误，也要确保服务员列表是一个空数组，而不是undefined
      setWaiters([]);
    }
  };

  // 获取客户列表
  const fetchCustomers = async () => {
    try {
      const { data: users, error: usersError } = await supabaseClient
        .from('users')
        .select('id, name, email, phone')
        .eq('role', 'customer')
        .eq('status', 'active')
        .order('name', { ascending: true });

      if (usersError) throw usersError;
      
      // 确保customers是数组，避免渲染时出错
      setCustomers((users || []) as Customer[]);
      // 清除之前的错误
      setError(null);
    } catch (err) {
      console.error('Failed to fetch customers:', err);
      setError('获取客户列表失败');
      // 即使发生错误，也要确保客户列表是一个空数组，而不是undefined
      setCustomers([]);
    }
  };

  // 获取聊天会话列表
  const fetchChatSessions = async () => {
    try {
      // 使用表连接获取聊天会话及其关联的用户信息
      const { data: sessions, error: sessionsError } = await supabaseClient
        .from('chat_sessions')
        .select(
          'id, user_id, agent_id, status, last_message_at, created_at,' +
          'users:user_id(id, name, email, phone),' +
          'agents:agent_id(id, name, email, phone)'
        )
        .order('last_message_at', { ascending: false });

      if (sessionsError) throw sessionsError;

      console.log('原始会话数据:', sessions);
      
      // 确保sessions是数组，避免map调用失败
      const sessionsArray = sessions || [];
      
      // 格式化会话数据
      const formattedSessions: ChatSession[] = sessionsArray
        // 过滤掉agent_id为空的会话
        .filter(session => session?.agent_id)
        .map(session => {
          // 确保即使关联的用户信息不存在，也返回带有空ID的对象，而不是undefined
          const customer = {
            id: session?.users?.id || '',
            name: session?.users?.name || '',
            email: session?.users?.email || '',
            phone: session?.users?.phone || ''
          } as Customer;
          
          const agent = {
            id: session?.agents?.id || '',
            name: session?.agents?.name || '',
            email: session?.agents?.email || '',
            phone: session?.agents?.phone || ''
          } as Waiter;
          
          return {
            id: session?.id || '',
            user_id: session?.user_id || '',
            agent_id: session?.agent_id || '',
            status: session?.status || 'pending',
            last_message_at: session?.last_message_at || new Date().toISOString(),
            created_at: session?.created_at || new Date().toISOString(),
            user_name: session?.users?.name,
            agent_name: session?.agents?.name,
            customer,
            agent
          };
        });

      console.log('格式化后的会话数据:', formattedSessions);
      setChatSessions(formattedSessions);
      // 清除之前的错误
      setError(null);
    } catch (err) {
      console.error('Failed to fetch chat sessions:', err);
      setError('获取聊天会话失败');
      // 即使发生错误，也要确保会话列表是一个空数组，而不是undefined
      setChatSessions([]);
    } finally {
      setLoading(false);
    }
  };

  // 显示分配客户模态框
  const showAssignModal = () => {
    setIsAssignModalVisible(true);
  };

  // 关闭分配客户模态框
  const handleAssignCancel = () => {
    setIsAssignModalVisible(false);
    form.resetFields();
    setSelectedWaiter(null);
    setSelectedCustomers([]);
  };

  // 分配客户
  const handleAssignCustomer = async () => {
    try {
      // 先验证表单
      await form.validateFields();
      
      if (!selectedWaiter || selectedCustomers.length === 0) {
        // 使用Ant Design的message组件替代Alert
        console.log('请选择服务员和客户');
        return;
      }

      // 为每个选中的客户创建或更新聊天会话
      for (const customerId of selectedCustomers) {
        // 检查是否已存在会话
        const { data: existingSession, error: existingError } = await supabaseClient
          .from('chat_sessions')
          .select('id')
          .eq('user_id', customerId)
          .eq('agent_id', selectedWaiter)
          .eq('status', 'active')
          .single();

        if (existingError && existingError.code !== 'PGRST116') {
          // PGRST116表示没有找到记录，这是正常情况
          console.error('Failed to check existing session:', existingError);
          throw existingError;
        }

        if (!existingSession) {
          // 创建新的聊天会话
          const { error: insertError } = await supabaseClient
            .from('chat_sessions')
            .insert({
              user_id: customerId,
              agent_id: selectedWaiter,
              status: 'active',
              last_message_at: new Date().toISOString()
            });
          
          if (insertError) {
            console.error('Failed to insert chat session:', insertError);
            throw insertError;
          }
        }
      }

      // 使用Ant Design的message组件显示成功信息
      console.log('客户分配成功');
      handleAssignCancel();
      // 重新加载聊天会话和服务员列表
      fetchChatSessions();
      fetchWaiters();
    } catch (err) {
      console.error('Failed to assign customers:', err);
      // 使用Ant Design的message组件显示错误信息
      console.error('客户分配失败', err);
    }
  };

  // 获取状态标签
  const getStatusTag = (status: string) => {
    switch (status) {
      case 'active':
        return <Tag color="green">活跃</Tag>;
      case 'closed':
        return <Tag color="red">已关闭</Tag>;
      case 'pending':
        return <Tag color="orange">待处理</Tag>;
      default:
        return <Tag color="gray">未知</Tag>;
    }
  };

  // 查看聊天详情
  const handleViewChatDetails = (group: CustomerWaiterSessionGroup) => {
    // 这里可以实现跳转到聊天详情页面或显示聊天详情弹窗
    console.log('查看聊天详情:', group.customer.name, group.waiter.name);
    console.log('客户ID:', group.customer.id, '客服ID:', group.waiter.id);
    
    // 验证ID是否有效
    if (!group.customer?.id || !group.waiter?.id) {
      console.error('无效的ID，无法跳转:', group.customer?.id, group.waiter?.id);
      message.error('无效的ID，无法跳转');
      return;
    }
    
    // 使用React Router的navigate进行导航，避免页面刷新
    navigate(`/user-center/chat-detail?customerId=${group.customer.id}&waiterId=${group.waiter.id}`);
  };

  // 显示客户列表模态框
  const showCustomerList = (waiter: Waiter) => {
    setCurrentWaiter(waiter);
    setIsCustomerListVisible(true);
  };

  // 关闭客户列表模态框
  const handleCustomerListCancel = () => {
    setIsCustomerListVisible(false);
    setCurrentWaiter(null);
  };

  // 点击客户名称跳转到聊天会话管理
  const handleCustomerClick = (waiterId: string, customerId: string) => {
    // 保存当前选择的服务员和客户
    setSelectedCustomerSession({ waiterId, customerId });
    // 切换到聊天会话标签页
    setActiveTab('sessions');
    // 关闭客户列表模态框
    setIsCustomerListVisible(false);
  };

  // 删除会话
  const handleDeleteSession = async (record: CustomerWaiterSessionGroup) => {
    try {
      // 显示确认提示
      const confirmResult = window.confirm(`确定要删除客户 ${record.customer.name} 与客服 ${record.waiter.name} 之间的所有会话吗？此操作不可恢复。`);
      if (!confirmResult) {
        return;
      }

      // 先获取该客户与客服之间的所有会话
      const { data: sessions, error: sessionsError } = await supabaseClient
        .from('chat_sessions')
        .select('id')
        .eq('user_id', record.customer.id)
        .eq('agent_id', record.waiter.id);

      if (sessionsError) {
        console.error('获取会话失败:', sessionsError);
        message.error('删除失败，请稍后重试');
        return;
      }

      if (sessions && sessions.length > 0) {
        // 获取所有会话的ID
        const sessionIds = sessions.map(session => session.id);

        // 先删除这些会话中的所有消息
        const { error: deleteMessagesError } = await supabaseClient
          .from('messages')
          .delete()
          .in('chat_session_id', sessionIds);

        if (deleteMessagesError) {
          console.error('删除消息失败:', deleteMessagesError);
          message.error('删除消息失败，请稍后重试');
          return;
        }

        // 然后删除所有会话
        const { error: deleteSessionsError } = await supabaseClient
          .from('chat_sessions')
          .delete()
          .eq('user_id', record.customer.id)
          .eq('agent_id', record.waiter.id);

        if (deleteSessionsError) {
          console.error('删除会话失败:', deleteSessionsError);
          message.error('删除会话失败，请稍后重试');
          return;
        }
      }

      // 刷新会话列表
      fetchChatSessions();
      message.success('会话删除成功');
    } catch (err) {
      console.error('删除会话异常:', err);
      message.error('删除失败，请稍后重试');
    }
  };



  // 服务员表格列配置
  const waiterColumns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Waiter) => (
        <div>
          <div>{text}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{record.email}</div>
        </div>
      )
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone'
    },
    {
      title: '管理客户数',
      dataIndex: 'customers',
      key: 'customerCount',
      render: (customers: Customer[], record: Waiter) => (
        <Button 
          type="link" 
          onClick={() => showCustomerList(record)}
        >
          {customers.length} 个客户
        </Button>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (text: string, record: Waiter) => (
        <Space size="middle">
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            size="small"
            onClick={() => {
              setSelectedWaiter(record.id);
              showAssignModal();
            }}
          >
            分配客户
          </Button>
        </Space>
      )
    }
  ];

  // 按客户和客服组合分组的会话表格列配置
  const customerWaiterSessionGroupColumns = [
    {
      title: '客户',
      dataIndex: 'customer',
      key: 'customer',
      render: (customer: Customer) => (
        <div>
          <div>{customer.name}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{customer.email}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{customer.phone}</div>
        </div>
      )
    },
    {
      title: '客服',
      dataIndex: 'waiter',
      key: 'waiter',
      render: (waiter: Waiter) => (
        <div>
          <div>{waiter.name}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{waiter.email}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{waiter.phone}</div>
        </div>
      )
    },

    {
      title: '对话数量',
      dataIndex: 'messageCount',
      key: 'messageCount',
      render: (messageCount: number) => messageCount
    },
    {
      title: '最新会话状态',
      dataIndex: 'latestSession',
      key: 'status',
      render: (latestSession: ChatSession) => getStatusTag(latestSession.status)
    },
    {
      title: '最后消息时间',
      dataIndex: 'latestSession',
      key: 'last_message_at',
      render: (latestSession: ChatSession) => new Date(latestSession.last_message_at).toLocaleString()
    },
    {
      title: '操作',
      key: 'action',
      render: (text: string, record: CustomerWaiterSessionGroup) => (
        <Space size="middle">
          <Button 
            type="default" 
            icon={<EyeOutlined />} 
            size="small"
            onClick={() => handleViewChatDetails(record)}
          >
            查看详情
          </Button>
          <Button 
            danger 
            icon={<DeleteOutlined />} 
            size="small"
            onClick={() => handleDeleteSession(record)}
          >
            删除会话
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: 20 }}>
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        items={[
          {
            key: 'waiters',
            label: '服务员管理',
            children: (
              <div>
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={showAssignModal}
                  >
                    分配客户
                  </Button>
                </div>
                
                <Table 
                  columns={waiterColumns} 
                  dataSource={waiters} 
                  rowKey="id" 
                  pagination={{ pageSize: 10 }} 
                  loading={loading}
                />
              </div>
            )
          },
          {
            key: 'sessions',
            label: '聊天会话管理',
            children: (
              <div>
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
                  <Input.Search
                    placeholder="搜索客户或客服"
                    allowClear
                    enterButton={<SearchOutlined />}
                    size="middle"
                    onSearch={value => setSearchText(value)}
                    onChange={e => setSearchText(e.target.value)}
                    style={{ width: 300 }}
                  />
                </div>

                <Table 
                  columns={customerWaiterSessionGroupColumns} 
                  dataSource={filteredCustomerWaiterSessionGroups} 
                  rowKey={(record) => `${record.customer.id}-${record.waiter.id}`} 
                  pagination={{ pageSize: 10 }} 
                  loading={loading}
                />
              </div>
            )
          }
        ]}
      />

      {/* 分配客户模态框 */}
      <Modal
        title="分配客户"
        open={isAssignModalVisible}
        onOk={handleAssignCustomer}
        onCancel={handleAssignCancel}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item 
            name="waiterId" 
            label="选择服务员"
            rules={[{ required: true, message: '请选择服务员' }]}
          >
            <Select
              placeholder="请选择服务员"
              value={selectedWaiter}
              onChange={value => setSelectedWaiter(value)}
              style={{ width: '100%' }}
            >
              {waiters.map(waiter => (
                <Option key={waiter.id} value={waiter.id}>
                  {waiter.name} ({waiter.email})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item 
            name="customerIds" 
            label="选择客户"
            rules={[{ required: true, message: '请选择客户' }]}
          >
            <Select
              mode="multiple"
              placeholder="请选择要分配的客户"
              value={selectedCustomers}
              onChange={values => setSelectedCustomers(values)}
              style={{ width: '100%' }}
              maxTagCount={3}
            >
              {customers.map(customer => (
                <Option key={customer.id} value={customer.id}>
                  {customer.name} ({customer.email})
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 客户列表模态框 */}
      <Modal
        title={`${currentWaiter?.name} 管理的客户`}
        open={isCustomerListVisible}
        onCancel={handleCustomerListCancel}
        footer={null}
        width={600}
      >
        {currentWaiter && currentWaiter.customers.length > 0 ? (
          <Table
            columns={[
              {
                title: '客户姓名',
                dataIndex: 'name',
                key: 'name',
                render: (text: string, record: Customer) => (
                  <a 
                    href="#" 
                    onClick={(e) => {
                      e.preventDefault();
                      handleCustomerClick(currentWaiter!.id, record.id);
                    }}
                  >
                    {text}
                  </a>
                )
              },
              {
                title: '邮箱',
                dataIndex: 'email',
                key: 'email'
              },
              {
                title: '电话',
                dataIndex: 'phone',
                key: 'phone'
              }
            ]}
            dataSource={currentWaiter.customers}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            该服务员还没有分配客户
          </div>
        )}
      </Modal>



      {/* 错误提示 */}
      {error && (
        <Alert message="错误" description={error} type="error" showIcon style={{ marginTop: 16 }} />
      )}
    </div>
  );
};

export default CustomerServiceManagement;
