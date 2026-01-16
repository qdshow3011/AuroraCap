import { useState, useEffect } from 'react';
import { message, Table, Spin } from 'antd';
import { supabaseClient } from '../../main';
import { PartnerDashboard } from '@aurora/types';


const PartnersList: React.FC = () => {
  const [partners, setPartners] = useState<PartnerDashboard[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch partner dashboard data using RPC
  useEffect(() => {
    const fetchPartnerDashboard = async () => {
      try {
        setLoading(true);

        const { data, error } = await supabaseClient.rpc('get_partner_dashboard');

        if (error) {
          throw error;
        }

        setPartners(data || []);
      } catch (err) {
        console.error('获取合伙人数据失败:', err);
        message.error('获取合伙人数据失败，请重试！');
      } finally {
        setLoading(false);
      }
    };

    fetchPartnerDashboard();
  }, []);

  const columns = [
    {
      title: '合伙人ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '电话号码',
      dataIndex: 'phone_number',
      key: 'phone_number',
      render: (phone: string | null) => phone || '-',
    },
    {
      title: '总AUM',
      dataIndex: 'total_aum',
      key: 'total_aum',
      sorter: (a: PartnerDashboard, b: PartnerDashboard) => a.total_aum - b.total_aum,
      render: (aum: number) => `$${aum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    },
    {
      title: '客户数量',
      dataIndex: 'client_count',
      key: 'client_count',
      sorter: (a: PartnerDashboard, b: PartnerDashboard) => a.client_count - b.client_count,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      sorter: (a: PartnerDashboard, b: PartnerDashboard) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      render: (createdAt: string) => new Date(createdAt).toLocaleString(),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600, color: '#1890ff' }}>合伙人管理</h2>
        <div style={{ fontSize: 14, color: '#666' }}>
          查看和管理合伙人信息及业绩数据
        </div>
      </div>
      <Table
        dataSource={partners}
        columns={columns}
        rowKey="id"
        loading={{
          indicator: (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <Spin size="large" />
              <div style={{ marginTop: 16 }}>加载中，请稍候...</div>
            </div>
          ),
          spinning: loading,
        }}
        bordered
        pagination={{ pageSizeOptions: ['10', '20', '50'], showSizeChanger: true, showTotal: (total) => `共 ${total} 条记录` }}
        scroll={{ x: 800 }}
        style={{ marginTop: 0 }}
        rowClassName="partner-row"
      />
    </div>
  );
};

export default PartnersList;