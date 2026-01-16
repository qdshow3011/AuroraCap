import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Table, Spin, Alert, Typography } from 'antd';
import {
  DatabaseOutlined, UserOutlined, TeamOutlined,
  ArrowUpOutlined, DollarOutlined
} from '@ant-design/icons';
import { supabaseClient } from '../../main';
import { useUser } from '../../contexts/UserContext';

const { Title } = Typography;

const Dashboard: React.FC = () => {
  const { user } = useUser();
  
  // 获取角色的中文名称
  const getRoleName = (role: string) => {
    switch (role) {
      case 'admin':
        return '管理员';
      case 'waiter':
        return '服务员';
      case 'partner':
        return '合伙人';
      case 'customer':
        return '客户';
      default:
        return role;
    }
  };
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalPartners: 0,
    totalPositions: 0,
    totalAssets: 0,
  });
  const [recentSubscriptions, setRecentSubscriptions] = useState<any[]>([]);
  const [customerPositions, setCustomerPositions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [funds, setFunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 获取统计数据和用户、基金信息
      const [customersRes, partnersRes, positionsRes, usersRes, fundsRes, recentSubscriptionsRes, allPositionsRes, ibFundConfigsRes, ibFundDataRes] = await Promise.all([
        supabaseClient.from('users').select('id', { count: 'exact' }),
        supabaseClient.from('users').select('id', { count: 'exact' }).eq('role', '合伙人'),
        supabaseClient.from('positions').select('id, current_value'),
        supabaseClient.from('users').select('id, name'),
        supabaseClient.from('products').select('id, name_cn'),
        supabaseClient
          .from('subscription_redemption')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5),
        supabaseClient
          .from('positions')
          .select('id, user_id, fund_id, shares, current_value, created_at')
          .order('created_at', { ascending: false }),
        supabaseClient.from('ib_fund_configs').select('*'),
        supabaseClient.from('ib_fund_data').select('*').order('updated_at', { ascending: false })
      ]);

      const totalCustomers = customersRes.count || 0;
      const totalPartners = partnersRes.count || 0;
      const totalPositions = positionsRes.data?.length || 0;
      const totalAssets = positionsRes.data?.reduce((sum, pos) => sum + (pos.current_value || 0), 0) || 0;
      
      // 设置用户和基金数据
      setUsers(usersRes.data || []);
      setFunds(fundsRes.data || []);

      setStats({
        totalCustomers,
        totalPartners,
        totalPositions,
        totalAssets
      });

      // 构建基金配置和基金数据的映射
      const fundConfigMap = new Map();
      (ibFundConfigsRes.data || []).forEach(config => {
        fundConfigMap.set(String(config.id), config);
      });

      // 构建基金名称到最新基金数据的映射
      const ibFundDataMap = new Map();
      (ibFundDataRes.data || []).forEach(data => {
        const config = fundConfigMap.get(String(data.fund_config_id));
        if (config) {
          // 只保留每个基金名称的最新数据
          if (!ibFundDataMap.has(config.fund_name) || 
              new Date(data.updated_at) > new Date(ibFundDataMap.get(config.fund_name).updated_at)) {
            ibFundDataMap.set(config.fund_name, data);
          }
        }
      });

      // 为最近申购/赎回记录添加ib_fund_data
      const recentSubscriptionsWithIbData = (recentSubscriptionsRes.data || []).map(subscription => {
        const fund = fundsRes.data?.find(f => String(f.id) === String(subscription.fund_id));
        const fundName = fund ? fund.name_cn : null;
        const ibData = fundName ? ibFundDataMap.get(fundName) : null;
        
        return {
          ...subscription,
          ib_fund_data: ibData || null
        };
      });

      setRecentSubscriptions(recentSubscriptionsWithIbData);

      // 为所有客户持仓记录添加ib_fund_data并按客户和基金分组汇总
      const customerPositionsWithIbData = (allPositionsRes.data || []).map(position => {
        const fund = fundsRes.data?.find(f => String(f.id) === String(position.fund_id));
        const fundName = fund ? fund.name_cn : null;
        const ibData = fundName ? ibFundDataMap.get(fundName) : null;
        
        return {
          ...position,
          ib_fund_data: ibData || null
        };
      });

      // 按user_id和fund_id分组汇总持仓份额
      const groupedPositions = new Map<string, any>();
      customerPositionsWithIbData.forEach(position => {
        const key = `${position.user_id}_${position.fund_id}`;
        // 确保份额是数字类型
        const shares = Number(position.shares) || 0;
        
        if (groupedPositions.has(key)) {
          // 如果已有相同客户和基金的记录，则汇总份额
          const existingPosition = groupedPositions.get(key);
          existingPosition.shares += shares;
        } else {
          // 否则，添加新记录
          groupedPositions.set(key, { 
            ...position, 
            shares: shares // 确保初始份额也是数字类型
          });
        }
      });

      // 将Map转换为数组
      const aggregatedPositions = Array.from(groupedPositions.values());

      setCustomerPositions(aggregatedPositions);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('获取仪表盘数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 根据用户ID获取用户名称
  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.name || userId;
  };

  // 根据基金ID获取基金名称
  const getFundName = (fundId: string) => {
    const fund = funds.find(f => f.id === fundId);
    return fund?.name_cn || fundId;
  };

  const positionColumns = [
    {
      title: '客户',
      dataIndex: 'user_id',
      key: 'user_id',
      ellipsis: true,
      render: (userId: string) => getUserName(userId),
    },
    {
      title: '基金产品',
      dataIndex: 'fund_id',
      key: 'fund_id',
      ellipsis: true,
      render: (fundId: string) => getFundName(fundId),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        return type === 'subscription' ? '申购' : '赎回';
      },
    },
    {
      title: '份额',
      dataIndex: 'shares',
      key: 'shares',
      render: (shares: number) => shares.toLocaleString(),
    },
    {
      title: '结算价值',
      dataIndex: 'current_value',
      key: 'current_value',
      render: (_value: number, record: any) => {
        // 计算最新净值：(总净清算价值 - 预留费用) / 最新总份额
        let latestNav = 0;
        if (record.ib_fund_data) {
          const { net_liquidation_value, reserved_fees, latest_shares } = record.ib_fund_data;
          if (net_liquidation_value !== null && reserved_fees !== null && latest_shares !== null && latest_shares !== 0) {
            latestNav = (net_liquidation_value - reserved_fees) / latest_shares;
          }
        }
        // 计算结算价值 = 份额 × 最新净值
        const settlementValue = record.shares * latestNav;
        // 四舍五入到整数
        const roundedValue = Math.round(settlementValue);
        return (
          <span style={{ fontWeight: '500', color: '#1890ff' }}>
            ¥{roundedValue > 0 ? roundedValue.toLocaleString() : '-'}
          </span>
        );
      }
    },
    {
      title: '调整时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (time: string) => new Date(time).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    },
  ];

  // 客户持仓记录表格列配置
  const customerPositionColumns = [
    {
      title: '客户',
      dataIndex: 'user_id',
      key: 'user_id',
      ellipsis: true,
      render: (userId: string) => getUserName(userId),
    },
    {
      title: '基金产品',
      dataIndex: 'fund_id',
      key: 'fund_id',
      ellipsis: true,
      render: (fundId: string) => getFundName(fundId),
    },
    {
      title: '份额',
      dataIndex: 'shares',
      key: 'shares',
      render: (shares: number) => shares.toLocaleString(),
    },
    {
      title: '当前价值',
      dataIndex: 'current_value',
      key: 'current_value',
      render: (value: number, record: any) => {
        // 计算最新净值：(总净清算价值 - 预留费用) / 最新总份额
        let latestNav = 0;
        if (record.ib_fund_data) {
          const { net_liquidation_value, reserved_fees, latest_shares } = record.ib_fund_data;
          if (net_liquidation_value !== null && reserved_fees !== null && latest_shares !== null && latest_shares !== 0) {
            latestNav = (net_liquidation_value - reserved_fees) / latest_shares;
          }
        }
        // 计算当前价值 = 持仓份额 × 最新净值
        const currentValue = record.shares * latestNav;
        return (
          <span style={{ fontWeight: '500', color: '#1890ff' }}>
            ¥{currentValue > 0 ? currentValue.toLocaleString() : '-'}
          </span>
        );
      }
    },
  ];

  const statCards = [
    {
      title: '客户总数',
      value: stats.totalCustomers,
      prefix: <UserOutlined />,
      color: '#52c41a',
      iconBg: '#f6ffed',
      borderColor: '#b7eb8f'
    },
    {
      title: '合伙人总数',
      value: stats.totalPartners,
      prefix: <TeamOutlined />,
      color: '#1890ff',
      iconBg: '#e6f7ff',
      borderColor: '#91d5ff'
    },
    {
      title: '持仓总数',
      value: stats.totalPositions,
      prefix: <DatabaseOutlined />,
      color: '#722ed1',
      iconBg: '#f9f0ff',
      borderColor: '#d3adf7'
    },
    {
      title: '总资产',
      value: stats.totalAssets,
      prefix: <DollarOutlined />,
      color: '#cf1322',
      iconBg: '#fff1f0',
      borderColor: '#ffccc7',
      formatter: (val: number | string) => `¥${Number(val).toLocaleString()}`
    }
  ];

  return (
    <div className="dashboard-container">
      {/* 滚动欢迎词 */}
      <div style={{ 
        overflow: 'hidden', 
        background: '#1890ff', 
        color: '#fff', 
        padding: '8px 0', 
        marginBottom: '24px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ 
          display: 'flex', 
          whiteSpace: 'nowrap',
          animation: 'scroll 20s linear infinite'
        }}
        className="welcome-text">
          <div style={{ 
            paddingRight: '50px',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            fontWeight: '500'
          }}>
            {user ? (
              `尊敬的${user.name}，你是我们优秀的${getRoleName(user.role)}，工作愉快、投资顺利！`
            ) : (
              '尊敬的用户，欢迎登录管理后台，工作愉快、投资顺利！'
            )}
          </div>
          <div style={{ 
            paddingRight: '50px',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            fontWeight: '500'
          }}>
            {user ? (
              `尊敬的${user.name}，你是我们优秀的${getRoleName(user.role)}，工作愉快、投资顺利！`
            ) : (
              '尊敬的用户，欢迎登录管理后台，工作愉快、投资顺利！'
            )}
          </div>
        </div>
        <style jsx>{`
          @keyframes scroll {
            0% {
              transform: translateX(100%);
            }
            100% {
              transform: translateX(-100%);
            }
          }
        `}</style>
      </div>
      
      <Title level={2} style={{ marginBottom: 32, fontWeight: '600' }}>仪表盘</Title>
      
      {error && <Alert message="错误" description={error} type="error" showIcon style={{ marginBottom: 24 }} />}
      
      <Spin spinning={loading} tip="加载中...">
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {statCards.map((card, index) => (
            <Col span={6} key={index}>
              <Card
                variant="outlined"
                style={{
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                  borderRadius: 8,
                  border: `1px solid ${card.borderColor}`
                }}
              >
                <Statistic
                  title={card.title}
                  value={card.value}
                  prefix={
                    <span style={{ 
                      padding: '8px', 
                      borderRadius: '6px', 
                      backgroundColor: card.iconBg,
                      color: card.color
                    }}>
                      {card.prefix}
                    </span>
                  }
                  valueStyle={{ 
                    color: card.color, 
                    fontSize: '24px',
                    fontWeight: '600'
                  }}
                  formatter={card.formatter}
                />
              </Card>
            </Col>
          ))}
        </Row>

        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ArrowUpOutlined style={{ color: '#1890ff' }} />
                  <span>最近申购/赎回基金记录</span>
                </div>
              }
              variant="outlined"
              style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)', borderRadius: 8 }}
            >
              <Table
                columns={positionColumns}
                dataSource={recentSubscriptions}
                rowKey="id"
                pagination={{ pageSize: 5 }}
                scroll={{ x: 800 }}
                rowHoverable
                bordered={false}
                size="middle"
                style={{ borderRadius: 8 }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
          <Col span={24}>
            <Card
              title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <DatabaseOutlined style={{ color: '#52c41a' }} />
                  <span>客户持仓记录</span>
                </div>
              }
              variant="outlined"
              style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)', borderRadius: 8 }}
            >
              <Table
                columns={customerPositionColumns}
                dataSource={customerPositions}
                rowKey="id"
                pagination={{ pageSize: 5 }}
                scroll={{ x: 800 }}
                rowHoverable
                bordered={false}
                size="middle"
                style={{ borderRadius: 8 }}
              />
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
};

export default Dashboard;