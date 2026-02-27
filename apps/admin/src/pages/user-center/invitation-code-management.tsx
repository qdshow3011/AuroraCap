import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Select, Input, Spin, message, Tag, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { supabaseClient } from '../../main';
import { InviteCode, User } from '../../types';
import { Link } from 'react-router-dom';

const { Option } = Select;

const InvitationCodeManagement: React.FC = () => {
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGenerateModalVisible, setIsGenerateModalVisible] = useState(false);
  const [isAssignModalVisible, setIsAssignModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [isOwnerEditModalVisible, setIsOwnerEditModalVisible] = useState(false);
  const [isOwnerDeleteModalVisible, setIsOwnerDeleteModalVisible] = useState(false);
  const [selectedCode, setSelectedCode] = useState<InviteCode | null>(null);
  const [selectedOwner, setSelectedOwner] = useState<string | null>(null);
  const [form] = Form.useForm();
  const [assignForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const [ownerEditForm] = Form.useForm();
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [viewMode, setViewMode] = useState<'summary' | 'detail'>('summary'); // 'summary' 或 'detail'
  const [selectedPushedBy, setSelectedPushedBy] = useState<string | null>(null); // 当前选中的初始分配人ID
  const [summaryData, setSummaryData] = useState<any[]>([]); // 按分配人分组的汇总数据

  // 获取当前登录用户
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const { data: { user }, error } = await supabaseClient.auth.getUser();
        if (error) {
          // 处理会话缺失错误，不影响应用正常运行
          console.info('没有找到用户会话:', error.message);
          setCurrentUser(null);
        } else {
          setCurrentUser(user);
        }
      } catch (err) {
        console.info('获取用户会话失败:', err);
        setCurrentUser(null);
      }
    };

    fetchCurrentUser();
  }, []);

  // 获取所有用户列表
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabaseClient
          .from('users')
          .select('id, name, role')
          .order('name');

        if (error) throw error;
        // 数据从supabase返回，使用unknown类型作为中间转换
        setUsers(data as unknown as User[]);
      } catch (err) {
        console.error('获取用户列表失败:', err);
        message.error('获取用户列表失败');
      }
    };

    fetchUsers();
  }, []);

  // 获取邀请码列表或汇总数据
  useEffect(() => {
    const fetchInviteCodes = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        if (viewMode === 'summary') {
          // 获取所有邀请码数据
          const { data, error } = await supabaseClient
            .from('invite_codes')
            .select('pushed_by, status, expiry_date');

          if (error) throw error;
          
          // 客户端聚合，按初始分配人分组
          const groupedData = data.reduce((acc: any[], code: any) => {
            const pushedBy = code.pushed_by || '未分配';
            const existing = acc.find(item => item.pushed_by === pushedBy);
            
            // 检查邀请码是否过期
            const isExpired = code.expiry_date ? new Date(code.expiry_date) < new Date() : false;
            
            if (existing) {
              // 更新现有分组
              existing.total += 1;
              if (code.status === 'used') existing.used += 1;
              if (code.status === 'active' && !isExpired) existing.valid += 1;
              if (isExpired) existing.expired += 1;
            } else {
              // 创建新分组
              acc.push({
                pushed_by: pushedBy,
                total: 1,
                valid: code.status === 'active' && !isExpired ? 1 : 0,
                used: code.status === 'used' ? 1 : 0,
                expired: isExpired ? 1 : 0
              });
            }
            
            return acc;
          }, []);
          
          setSummaryData(groupedData);
        } else {
          // 获取特定分配人的详细邀请码列表
          const { data, error } = await supabaseClient
            .from('invite_codes')
            .select('code, status, uses, max_uses, expiry_date, created_at, updated_at')
            .eq('pushed_by', selectedPushedBy)
            .order('created_at', { ascending: false });

          if (error) throw error;
          setInviteCodes(data as InviteCode[]);
        }
      } catch (err) {
        console.error('获取邀请码数据失败:', err);
        setError('获取邀请码数据失败，请稍后重试');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInviteCodes();
  }, [viewMode, selectedPushedBy]);

  // 生成随机邀请码
  const generateRandomCode = (length: number = 8): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // 生成邀请码
  const handleGenerateCode = async () => {
    try {
      // 直接获取表单值并转换为数字类型
      const rawValues = form.getFieldsValue();
      console.log('表单原始值:', rawValues);
      console.log('count类型:', typeof rawValues.count);
      
      // 手动验证生成数量和业主
      if (!rawValues.count || isNaN(Number(rawValues.count)) || Number(rawValues.count) < 1) {
        message.error('请输入有效的生成数量');
        return;
      }
      
      if (!rawValues.pushed_by) {
        message.error('请选择初始邀请码业主');
        return;
      }
      
      const count = Number(rawValues.count);
      const codesToInsert = [];
      
      // 生成指定数量的邀请码
      for (let i = 0; i < count; i++) {
        const newCode = generateRandomCode();
        codesToInsert.push({
          code: newCode,
          created_by: currentUser?.id || null, // 使用当前登录用户ID或null
          pushed_by: rawValues.pushed_by,
          status: 'active',
          uses: 0,
          max_uses: 1, // 固定为一次性使用
          expiry_date: rawValues.expiry_date ? new Date(rawValues.expiry_date).toISOString() : null,
        });
      }
      
      const { error } = await supabaseClient
        .from('invite_codes')
        .insert(codesToInsert);

      if (error) throw error;
      
      message.success(`成功生成${count}个邀请码`);
      setIsGenerateModalVisible(false);
      form.resetFields();
      
      // 刷新邀请码数据，根据当前视图模式获取相应数据
      if (viewMode === 'summary') {
        // 如果是汇总视图，重新获取并计算汇总数据
        const { data: allCodes, error: fetchError } = await supabaseClient
          .from('invite_codes')
          .select('pushed_by, status, expiry_date');

        if (fetchError) throw fetchError;
        
        // 重新计算汇总数据
        const groupedData = allCodes.reduce((acc: any[], code: any) => {
          const pushedBy = code.pushed_by || '未分配';
          const existing = acc.find(item => item.pushed_by === pushedBy);
          const isExpired = code.expiry_date ? new Date(code.expiry_date) < new Date() : false;
          
          if (existing) {
            existing.total += 1;
            if (code.status === 'used') existing.used += 1;
            if (code.status === 'active' && !isExpired) existing.valid += 1;
            if (isExpired) existing.expired += 1;
          } else {
            acc.push({
              pushed_by: pushedBy,
              total: 1,
              valid: code.status === 'active' && !isExpired ? 1 : 0,
              used: code.status === 'used' ? 1 : 0,
              expired: isExpired ? 1 : 0
            });
          }
          return acc;
        }, []);
        
        setSummaryData(groupedData);
      } else {
        // 如果是详细视图，只刷新当前分配人的邀请码
        const { data: updatedData, error: fetchError } = await supabaseClient
          .from('invite_codes')
          .select('code, status, uses, max_uses, expiry_date, created_at, updated_at')
          .eq('pushed_by', selectedPushedBy)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        setInviteCodes(updatedData as InviteCode[]);
      }
    } catch (err: any) {
      console.error('生成邀请码失败:', err);
      if (err.name === 'ValidateError') {
        // 表单验证错误
        message.error(`表单验证失败: ${err.errorFields?.[0]?.errors?.[0] || '请检查输入'}`);
      } else if (err.message) {
        // 显示更具体的错误信息
        message.error(`生成邀请码失败: ${err.message}`);
      } else if (err.code) {
        // Supabase错误
        message.error(`生成邀请码失败: ${err.code} - ${err.details || '未知错误'}`);
      } else {
        message.error('生成邀请码失败');
      }
    }
  };

  // 分配邀请码
  const handleAssignCode = async () => {
    try {
      if (!selectedCode) return;
      
      const values = await assignForm.validateFields();
      
      const { error } = await supabaseClient
        .from('invite_codes')
        .update({
          pushed_by: values.user_id,
        })
        .eq('code', selectedCode.code);

      if (error) throw error;
      
      message.success('邀请码分配成功');
      setIsAssignModalVisible(false);
      assignForm.resetFields();
      setSelectedCode(null);
      
      // 刷新邀请码数据，根据当前视图模式获取相应数据
      if (viewMode === 'summary') {
        // 如果是汇总视图，重新获取并计算汇总数据
        const { data: allCodes, error: fetchError } = await supabaseClient
          .from('invite_codes')
          .select('pushed_by, status, expiry_date');

        if (fetchError) throw fetchError;
        
        // 重新计算汇总数据
        const groupedData = allCodes.reduce((acc: any[], code: any) => {
          const pushedBy = code.pushed_by || '未分配';
          const existing = acc.find(item => item.pushed_by === pushedBy);
          const isExpired = code.expiry_date ? new Date(code.expiry_date) < new Date() : false;
          
          if (existing) {
            existing.total += 1;
            if (code.status === 'used') existing.used += 1;
            if (code.status === 'active' && !isExpired) existing.valid += 1;
            if (isExpired) existing.expired += 1;
          } else {
            acc.push({
              pushed_by: pushedBy,
              total: 1,
              valid: code.status === 'active' && !isExpired ? 1 : 0,
              used: code.status === 'used' ? 1 : 0,
              expired: isExpired ? 1 : 0
            });
          }
          return acc;
        }, []);
        
        setSummaryData(groupedData);
      } else {
        // 如果是详细视图，只刷新当前分配人的邀请码
        const { data: updatedData, error: fetchError } = await supabaseClient
          .from('invite_codes')
          .select('code, status, uses, max_uses, expiry_date, created_at, updated_at')
          .eq('pushed_by', selectedPushedBy)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        setInviteCodes(updatedData as InviteCode[]);
      }
    } catch (err) {
      console.error('分配邀请码失败:', err);
      message.error('分配邀请码失败');
    }
  };

  // 获取用户姓名
  const getUserName = (userId: string | null): string => {
    if (!userId) return '-';
    const user = users.find(u => u.id === userId);
    return user ? user.name : '未知用户';
  };

  // 检查是否过期
  const isExpired = (expiryDate: string | null): boolean => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  // 定义汇总视图数据类型
  interface SummaryData {
    pushed_by: string;
    total: number;
    valid: number;
    used: number;
    expired: number;
  }

  // 定义汇总视图表格列
  const summaryColumns: ColumnsType<SummaryData> = [
    {
      title: '邀请码业主',
      dataIndex: 'pushed_by',
      key: 'pushed_by',
      render: (pushedBy: string) => {
        if (pushedBy === '未分配') return pushedBy;
        return (
          <a onClick={() => {
            setSelectedPushedBy(pushedBy);
            setViewMode('detail');
          }} style={{ cursor: 'pointer', color: '#1890ff' }}>
            {getUserName(pushedBy)}
          </a>
        );
      },
    },
    {
      title: '身份',
      dataIndex: 'pushed_by',
      key: 'role',
      render: (pushedBy: string) => {
        if (pushedBy === '未分配') return '-';
        const user = users.find(u => u.id === pushedBy);
        return user ? (user as any).role || '-' : '未知';
      },
    },
    {
      title: '邀请码总数',
      dataIndex: 'total',
      key: 'total',
    },
    {
      title: '有效邀请码数量',
      dataIndex: 'valid',
      key: 'valid',
    },
    {
      title: '已经使用邀请码数量',
      dataIndex: 'used',
      key: 'used',
      render: (used: number, record: SummaryData) => {
        if (used === 0) return used;
        return (
          <Link 
            to={`/user-center/used-invitation-codes?pushedBy=${record.pushed_by}`} 
            style={{ cursor: 'pointer', color: '#1890ff' }}
          >
            {used}
          </Link>
        );
      },
    },
    {
      title: '失效邀请码数量',
      dataIndex: 'expired',
      key: 'expired',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="link" 
            onClick={() => {
              setSelectedPushedBy(record.pushed_by);
              setViewMode('detail');
            }}
          >
            查看
          </Button>
          <Button 
            type="link" 
            onClick={() => {
              setSelectedOwner(record.pushed_by);
              setIsOwnerEditModalVisible(true);
            }}
            disabled={record.pushed_by === '未分配'}
          >
            编辑
          </Button>
          <Button 
            type="link" 
            danger
            onClick={() => {
              setSelectedOwner(record.pushed_by);
              setIsOwnerDeleteModalVisible(true);
            }}
            disabled={record.pushed_by === '未分配'}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  // 推送邀请码
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handlePushCode = async (_record: InviteCode) => {
    try {
      // 这里可以实现具体的推送逻辑，比如发送邮件或短信
      message.info('推送功能开发中');
    } catch (err) {
      console.error('推送邀请码失败:', err);
      message.error('推送邀请码失败');
    }
  };

  // 复制邀请码
  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      message.success('邀请码已复制到剪贴板');
    } catch (err) {
      console.error('复制邀请码失败:', err);
      message.error('复制邀请码失败');
    }
  };

  // 编辑邀请码
  const handleEditCode = async () => {
    try {
      if (!selectedCode) return;
      
      const values = await editForm.validateFields();
      
      const { error } = await supabaseClient
        .from('invite_codes')
        .update({
          max_uses: values.max_uses,
          expiry_date: values.expiry_date ? new Date(values.expiry_date).toISOString() : null,
          notes: values.notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('code', selectedCode.code);

      if (error) throw error;
      
      message.success('邀请码编辑成功');
      setIsEditModalVisible(false);
      editForm.resetFields();
      setSelectedCode(null);
      
      // 刷新邀请码数据
      const { data: updatedData, error: fetchError } = await supabaseClient
        .from('invite_codes')
        .select('code, status, uses, max_uses, expiry_date, created_at, updated_at')
        .eq('pushed_by', selectedPushedBy)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setInviteCodes(updatedData as InviteCode[]);
    } catch (err) {
      console.error('编辑邀请码失败:', err);
      message.error('编辑邀请码失败');
    }
  };

  // 删除邀请码
  const handleDeleteCode = async () => {
    try {
      if (!selectedCode) return;
      
      const { error } = await supabaseClient
        .from('invite_codes')
        .delete()
        .eq('code', selectedCode.code);

      if (error) throw error;
      
      message.success('邀请码删除成功');
      setIsDeleteModalVisible(false);
      setSelectedCode(null);
      
      // 刷新邀请码数据
      const { data: updatedData, error: fetchError } = await supabaseClient
        .from('invite_codes')
        .select('code, status, uses, max_uses, expiry_date, created_at, updated_at')
        .eq('pushed_by', selectedPushedBy)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setInviteCodes(updatedData as InviteCode[]);
    } catch (err) {
      console.error('删除邀请码失败:', err);
      message.error('删除邀请码失败');
    }
  };

  // 编辑业主信息
  const handleOwnerEdit = async (values: any) => {
    try {
      if (!selectedOwner) return;
      
      const { error } = await supabaseClient
        .from('invite_codes')
        .update({
          pushed_by: values.new_owner_id,
          updated_at: new Date().toISOString()
        })
        .eq('pushed_by', selectedOwner);

      if (error) throw error;
      
      message.success('业主信息编辑成功');
      setIsOwnerEditModalVisible(false);
      ownerEditForm.resetFields();
      setSelectedOwner(null);
      
      // 刷新汇总数据
      const { data: allCodes, error: fetchError } = await supabaseClient
        .from('invite_codes')
        .select('pushed_by, status, expiry_date');

      if (fetchError) throw fetchError;
      
      // 重新计算汇总数据
      const groupedData = allCodes.reduce((acc: any[], code: any) => {
        const pushedBy = code.pushed_by || '未分配';
        const existing = acc.find(item => item.pushed_by === pushedBy);
        const isExpired = code.expiry_date ? new Date(code.expiry_date) < new Date() : false;
        
        if (existing) {
          existing.total += 1;
          if (code.status === 'used') existing.used += 1;
          if (code.status === 'active' && !isExpired) existing.valid += 1;
          if (isExpired) existing.expired += 1;
        } else {
          acc.push({
            pushed_by: pushedBy,
            total: 1,
            valid: code.status === 'active' && !isExpired ? 1 : 0,
            used: code.status === 'used' ? 1 : 0,
            expired: isExpired ? 1 : 0
          });
        }
        return acc;
      }, []);
      
      setSummaryData(groupedData);
    } catch (err) {
      console.error('编辑业主信息失败:', err);
      message.error('编辑业主信息失败');
    }
  };

  // 删除业主所有邀请码
  const handleOwnerDelete = async () => {
    try {
      if (!selectedOwner) return;
      
      const { error } = await supabaseClient
        .from('invite_codes')
        .delete()
        .eq('pushed_by', selectedOwner);

      if (error) throw error;
      
      message.success('业主所有邀请码删除成功');
      setIsOwnerDeleteModalVisible(false);
      setSelectedOwner(null);
      
      // 刷新汇总数据
      const { data: allCodes, error: fetchError } = await supabaseClient
        .from('invite_codes')
        .select('pushed_by, status, expiry_date');

      if (fetchError) throw fetchError;
      
      // 重新计算汇总数据
      const groupedData = allCodes.reduce((acc: any[], code: any) => {
        const pushedBy = code.pushed_by || '未分配';
        const existing = acc.find(item => item.pushed_by === pushedBy);
        const isExpired = code.expiry_date ? new Date(code.expiry_date) < new Date() : false;
        
        if (existing) {
          existing.total += 1;
          if (code.status === 'used') existing.used += 1;
          if (code.status === 'active' && !isExpired) existing.valid += 1;
          if (isExpired) existing.expired += 1;
        } else {
          acc.push({
            pushed_by: pushedBy,
            total: 1,
            valid: code.status === 'active' && !isExpired ? 1 : 0,
            used: code.status === 'used' ? 1 : 0,
            expired: isExpired ? 1 : 0
          });
        }
        return acc;
      }, []);
      
      setSummaryData(groupedData);
    } catch (err) {
      console.error('删除业主所有邀请码失败:', err);
      message.error('删除业主所有邀请码失败');
    }
  };

  // 定义详细视图表格列
  const detailColumns: ColumnsType<InviteCode> = [
    {
      title: '邀请码',
      dataIndex: 'code',
      key: 'code',
      width: 150,
    },
    {
      title: '是否使用',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'used' ? 'green' : 'default'}>
          {status === 'used' ? '已使用' : '未使用'}
        </Tag>
      ),
    },
    {
      title: '是否过期',
      key: 'is_expired',
      render: (_, record) => (
        <Tag color={isExpired(record.expiry_date || null) ? 'red' : 'green'}>
          {isExpired(record.expiry_date || null) ? '已过期' : '未过期'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (createdAt) => new Date(createdAt).toLocaleString(),
    },
    {          title: '操作',          key: 'action',          render: (_, record) => (
        <Space size="middle">
          <Button 
            type="link" 
            onClick={() => {
              setSelectedCode(record);
              setIsAssignModalVisible(true);
            }}
            disabled={record.status === 'used' || isExpired(record.expiry_date || null)}
          >
            分配
          </Button>
          <Button 
            type="link" 
            onClick={() => handlePushCode(record)}
            disabled={record.status === 'used' || isExpired(record.expiry_date || null)}
          >
            推送
          </Button>
          <Button 
            type="link" 
            onClick={() => handleCopyCode(record.code)}
          >
            复制
          </Button>
          <Button 
            type="link" 
            onClick={() => {
              setSelectedCode(record);
              setIsEditModalVisible(true);
            }}
            disabled={record.status === 'used' || isExpired(record.expiry_date || null)}
          >
            编辑
          </Button>
          <Button 
            type="link" 
            danger
            onClick={() => {
              setSelectedCode(record);
              setIsDeleteModalVisible(true);
            }}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {viewMode === 'detail' && (
            <Button 
              type="link" 
              onClick={() => setViewMode('summary')}
              style={{ marginRight: 16 }}
            >
              返回
            </Button>
          )}
          <h2>{viewMode === 'summary' ? '邀请码管理' : `${getUserName(selectedPushedBy)}的邀请码`}</h2>
        </div>
        {viewMode === 'summary' && (
          <Button type="primary" onClick={() => setIsGenerateModalVisible(true)}>
            生成邀请码
          </Button>
        )}
      </div>
      
      {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
      
      <Spin spinning={isLoading}>
        <Table
          dataSource={viewMode === 'summary' ? summaryData : inviteCodes}
          columns={viewMode === 'summary' ? summaryColumns : detailColumns}
          rowKey={viewMode === 'summary' ? 'pushed_by' : 'code'}
          pagination={{ pageSize: 10 }}
          style={{ marginTop: 16 }}
        />
      </Spin>

      {/* 生成邀请码弹窗 */}
      <Modal
        title="生成邀请码"
        open={isGenerateModalVisible}
        onOk={handleGenerateCode}
        onCancel={() => setIsGenerateModalVisible(false)}
        destroyOnHidden
        okButtonProps={{ htmlType: 'button' }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="count"
            label="生成数量"
            rules={[
              { required: true, message: '请输入生成数量' }, 
              {
                type: 'number', 
                message: '请输入有效的数字', 
                min: 1,
                transform: (value) => Number(value)
              }
            ]}
          >
            <Input type="number" placeholder="1" />
          </Form.Item>
          <Form.Item
            name="expiry_date"
            label="过期日期"
          >
            <Input type="datetime-local" />
          </Form.Item>
          <Form.Item
            name="pushed_by"
            label="初始邀请码业主"
            rules={[{ required: true, message: '请选择初始邀请码业主' }]}
          >
            <Select placeholder="选择用户" style={{ width: '100%' }}>
              {users.map(user => (
                <Option key={user.id} value={user.id}>{user.name}</Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 分配邀请码弹窗 */}
      <Modal
        title="分配邀请码"
        open={isAssignModalVisible}
        onOk={handleAssignCode}
        onCancel={() => {
          setIsAssignModalVisible(false);
          setSelectedCode(null);
          assignForm.resetFields();
        }}
        destroyOnHidden
      >
        <Form form={assignForm} layout="vertical">
          <Form.Item
            name="user_id"
            label="分配给用户"
            rules={[{ required: true, message: '请选择用户' }]}
          >
            <Select placeholder="选择用户" style={{ width: '100%' }}>
              {users.map(user => (
                <Option key={user.id} value={user.id}>{user.name}</Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑邀请码弹窗 */}
      <Modal
        title="编辑邀请码"
        open={isEditModalVisible}
        onOk={handleEditCode}
        onCancel={() => {
          setIsEditModalVisible(false);
          editForm.resetFields();
          setSelectedCode(null);
        }}
        destroyOnHidden
        forceRender
      >
        <Form 
          form={editForm} 
          layout="vertical"
          initialValues={{
            max_uses: selectedCode?.max_uses || 1,
            expiry_date: selectedCode?.expiry_date ? new Date(selectedCode.expiry_date).toISOString().slice(0, 16) : '',
            notes: selectedCode?.notes || ''
          }}
        >
          <Form.Item
            name="max_uses"
            label="最大使用次数"
            rules={[
              { required: true, message: '请输入最大使用次数' },
              { type: 'number', min: 1, message: '最大使用次数至少为1' }
            ]}
          >
            <Input type="number" min={1} />
          </Form.Item>
          <Form.Item
            name="expiry_date"
            label="过期时间"
          >
            <Input type="datetime-local" />
          </Form.Item>
          <Form.Item
            name="notes"
            label="备注"
          >
            <Input.TextArea placeholder="请输入备注信息" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 删除邀请码确认弹窗 */}
      <Modal
        title="删除邀请码"
        open={isDeleteModalVisible}
        onOk={handleDeleteCode}
        onCancel={() => {
          setIsDeleteModalVisible(false);
          setSelectedCode(null);
        }}
        destroyOnHidden
        okText="确认删除"
        cancelText="取消"
        okType="danger"
      >
        <p>确定要删除邀请码 <strong>{selectedCode?.code}</strong> 吗？</p>
        <p style={{ color: 'red', marginTop: 8 }}>删除后无法恢复，请谨慎操作！</p>
      </Modal>

      {/* 业主编辑弹窗 */}
      <Modal
        title="编辑业主信息"
        open={isOwnerEditModalVisible}
        onOk={() => {
          ownerEditForm.validateFields().then(values => {
            handleOwnerEdit(values);
          });
        }}
        onCancel={() => {
          setIsOwnerEditModalVisible(false);
          ownerEditForm.resetFields();
          setSelectedOwner(null);
        }}
        destroyOnHidden
        forceRender
      >
        <Form 
          form={ownerEditForm} 
          layout="vertical"
        >
          <Form.Item
            name="new_owner_id"
            label="新业主"
            rules={[{ required: true, message: '请选择新业主' }]}
          >
            <Select placeholder="选择新业主" style={{ width: '100%' }}>
              {users.map(user => (
                <Option key={user.id} value={user.id}>{user.name}</Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 业主删除确认弹窗 */}
      <Modal
        title="删除业主所有邀请码"
        open={isOwnerDeleteModalVisible}
        onOk={handleOwnerDelete}
        onCancel={() => {
          setIsOwnerDeleteModalVisible(false);
          setSelectedOwner(null);
        }}
        destroyOnHidden
        okText="确认删除"
        cancelText="取消"
        okType="danger"
      >
        <p>确定要删除业主 <strong>{getUserName(selectedOwner)}</strong> 的所有邀请码吗？</p>
        <p style={{ color: 'red', marginTop: 8 }}>删除后无法恢复，请谨慎操作！</p>
      </Modal>
    </div>
  );
};

export default InvitationCodeManagement;