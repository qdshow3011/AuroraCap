import React, { useState, useEffect } from 'react';
import { Table, Spin, message, Typography, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { supabaseClient } from '../../main';
import { useNavigate, useLocation } from 'react-router-dom';

const { Title } = Typography;

interface UsedInviteCode {
  code: string;
  inviterName: string;
  inviterRole: string;
  invitedUserName: string;
  invitedUserPhone: string;
  invitedUserEmail: string;
  createdAt: string;
  registeredAt: string;
}

const UsedInvitationCodes: React.FC = () => {
  const [usedCodes, setUsedCodes] = useState<UsedInviteCode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pushedBy, setPushedBy] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Extract query parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const pushedByParam = searchParams.get('pushedBy');
    if (pushedByParam) {
      setPushedBy(pushedByParam);
    }
  }, [location]);

  // Fetch used invitation codes
  useEffect(() => {
    const fetchUsedInviteCodes = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // First, fetch all used invite codes
        let query = supabaseClient
          .from('invite_codes')
          .select('code, created_at, pushed_by, status')
          .eq('status', 'used');

        // Filter by pushed_by if provided
        if (pushedBy) {
          query = query.eq('pushed_by', pushedBy);
        }

        const { data: inviteCodesData, error: inviteCodesError } = await query;

        if (inviteCodesError) {
          throw inviteCodesError;
        }

        if (!inviteCodesData || inviteCodesData.length === 0) {
          setUsedCodes([]);
          return;
        }

        // Fetch all related users in bulk
        const { data: allUsersData, error: allUsersError } = await supabaseClient
          .from('users')
          .select('id, name, role, phone, email, invite_code, created_at');

        if (allUsersError) {
          throw allUsersError;
        }

        // Create a map for quick lookups
        const userIdToUserMap = new Map();
        const inviteCodeToUserMap = new Map();

        allUsersData?.forEach(user => {
          userIdToUserMap.set(user.id, user);
          if (user.invite_code) {
            inviteCodeToUserMap.set(user.invite_code, user);
          }
        });

        // Transform data into the required format
        const transformedData: UsedInviteCode[] = inviteCodesData.map((item: any) => {
          const inviter = userIdToUserMap.get(item.pushed_by);
          const invitedUser = inviteCodeToUserMap.get(item.code);

          return {
            code: item.code,
            inviterName: inviter?.name || '未知用户',
            inviterRole: inviter?.role || '未知角色',
            invitedUserName: invitedUser?.name || '未知用户',
            invitedUserPhone: invitedUser?.phone || '未知电话',
            invitedUserEmail: invitedUser?.email || '未知邮箱',
            createdAt: new Date(item.created_at).toLocaleString(),
            registeredAt: invitedUser?.created_at
              ? new Date(invitedUser.created_at).toLocaleString()
              : '未知时间',
          };
        });

        setUsedCodes(transformedData);
      } catch (err: any) {
        console.error('获取已使用邀请码失败:', err);
        setError('获取已使用邀请码失败，请稍后重试');
        message.error('获取已使用邀请码失败');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsedInviteCodes();
  }, [pushedBy]);

  // Define table columns
  const columns: ColumnsType<UsedInviteCode> = [
    {
      title: '邀请码',
      dataIndex: 'code',
      key: 'code',
      width: 150,
    },
    {
      title: '邀请码业主',
      key: 'inviter',
      render: (_, record) => (
        <div>
          <div>{record.inviterName}</div>
          <div style={{ fontSize: '12px', color: '#888' }}>{record.inviterRole}</div>
        </div>
      ),
    },
    {
      title: '被邀请人（客户）',
      key: 'invitedUser',
      render: (_, record) => (
        <div>
          <div>{record.invitedUserName}</div>
          <div style={{ fontSize: '12px', color: '#888' }}>{record.invitedUserPhone}</div>
          <div style={{ fontSize: '12px', color: '#888' }}>{record.invitedUserEmail}</div>
        </div>
      ),
    },
    {
      title: '邀请码创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
    },
    {
      title: '用户注册时间',
      dataIndex: 'registeredAt',
      key: 'registeredAt',
      width: 180,
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2}>已使用邀请码详情</Title>
        <Button type="link" onClick={() => navigate('/user-center/invitation-codes')}>
          返回邀请码管理
        </Button>
      </div>

      {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}

      <Spin spinning={isLoading}>
        <Table
          dataSource={usedCodes}
          columns={columns}
          rowKey="code"
          pagination={{ pageSize: 10 }}
          style={{ marginTop: 16 }}
        />
      </Spin>
    </div>
  );
};

export default UsedInvitationCodes;