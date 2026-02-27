import React, { useState, useEffect } from 'react';
import { Card, Spin, message, Descriptions, Tag, Button, Row, Col } from 'antd';
import { ArrowLeftOutlined, AreaChartOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { supabaseClient } from '../../main';
import { alphaVantageService } from '../../services/alpha-vantage.service';
import { finnhubService } from '../../services/finnhub.service';

const SecurityDetail: React.FC = () => {
  const navigate = useNavigate();
  const { symbol } = useParams<{ symbol: string }>();
  const [security, setSecurity] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchSecurityData = async () => {
    if (!symbol) return;
    
    setIsLoading(true);
    try {
      // 从数据库中获取证券数据
      const { data, error } = await supabaseClient
        .from('yahoo_indices')
        .select('*')
        .eq('symbol', symbol)
        .single();

      if (error) {
        console.error('获取证券数据失败:', error);
        message.error('获取证券数据失败');
        return;
      }

      setSecurity(data);
    } catch (err) {
      console.error('获取证券数据时发生异常:', err);
      message.error('获取证券数据时发生异常');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncData = async () => {
    if (!symbol) return;
    
    setIsSyncing(true);
    try {
      // 尝试使用Alpha Vantage API同步数据
      let syncResult;
      try {
        syncResult = await alphaVantageService.syncSingleIndex(symbol);
      } catch (err) {
        console.error('使用Alpha Vantage API同步失败，尝试使用Finnhub API:', err);
        // 如果Alpha Vantage API失败，尝试使用Finnhub API
        syncResult = await finnhubService.syncSingleIndex(symbol);
      }
      
      if (syncResult.success) {
        message.success(syncResult.message);
        // 重新获取证券数据
        await fetchSecurityData();
      } else {
        message.error(syncResult.message);
      }
    } catch (err) {
      console.error('同步数据失败:', err);
      message.error('同步数据失败');
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, [symbol]);

  if (isLoading) {
    return (
      <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  if (!security) {
    return (
      <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
        <Card title="证券详情" style={{ borderRadius: 8 }}>
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <p style={{ fontSize: '16px', color: '#666' }}>未找到证券数据</p>
            <Button type="primary" icon={<ArrowLeftOutlined />} onClick={() => navigate('/asset-management/index-management')} style={{ marginTop: '16px' }}>
              返回证券列表
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/asset-management/index-management')}>
                返回
              </Button>
              <span style={{ fontSize: '18px', fontWeight: '600' }}>证券详情</span>
            </div>
            <Button
              type="primary"
              icon={<AreaChartOutlined spin={isSyncing} />}
              onClick={handleSyncData}
              loading={isSyncing}
            >
              同步数据
            </Button>
          </div>
        }
        style={{ borderRadius: 8 }}
      >
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <Card title="基本信息" style={{ borderRadius: 8 }}>
              <Descriptions bordered column={2}>
                <Descriptions.Item label="证券代码" span={1}>
                  <span style={{ fontWeight: '500', fontSize: '16px' }}>{security.symbol}</span>
                </Descriptions.Item>
                <Descriptions.Item label="证券名称" span={1}>
                  {security.name}
                </Descriptions.Item>
                <Descriptions.Item label="市场类型" span={1}>
                  <Tag color={security.market_type === 'us' ? 'blue' : security.market_type === 'cn' ? 'red' : security.market_type === 'hk' ? 'orange' : 'default'}>
                    {{ 'us': '美股', 'cn': 'A股', 'hk': '港股', 'crypto': '加密货币', 'commodity': '大宗商品', 'other': '其他' }[security.market_type] || '其他'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="数据来源" span={1}>
                  <Tag color={security.data_source === 'alpha-vantage' ? 'purple' : security.data_source === 'finnhub' ? 'green' : 'default'}>
                    {{ 'alpha-vantage': 'Alpha Vantage', 'finnhub': 'Finnhub', 'manual': '手动录入' }[security.data_source] || '手动录入'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="同步状态" span={1}>
                  <Tag color={security.sync_status === 'success' ? 'success' : security.sync_status === 'failed' ? 'error' : 'warning'}>
                    {{ 'success': '成功', 'failed': '失败', 'pending': '待同步' }[security.sync_status] || '待同步'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="是否启用" span={1}>
                  <Tag color={security.is_enabled ? 'success' : 'default'}>
                    {security.is_enabled ? '启用' : '禁用'}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
          
          <Col span={24}>
            <Card title="价格信息" style={{ borderRadius: 8 }}>
              <Descriptions bordered column={3}>
                <Descriptions.Item label="当前价格" span={1}>
                  <span style={{ fontWeight: '500', fontSize: '16px', color: security.change >= 0 ? '#52c41a' : '#ff4d4f' }}>
                    {security.price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '-'}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="涨跌额" span={1}>
                  <span style={{ color: security.change >= 0 ? '#52c41a' : '#ff4d4f' }}>
                    {security.change >= 0 ? '+' : ''}{security.change?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '-'}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="涨跌幅(%)" span={1}>
                  <span style={{ color: security.change_percent >= 0 ? '#52c41a' : '#ff4d4f' }}>
                    {security.change_percent >= 0 ? '+' : ''}{security.change_percent?.toFixed(2) || '-'}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="开盘价" span={1}>
                  {security.open?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="最高价" span={1}>
                  {security.high?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="最低价" span={1}>
                  {security.low?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="昨收价" span={1}>
                  {security.previous_close?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="成交量" span={2}>
                  {security.volume?.toLocaleString('en-US') || '-'}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
          
          <Col span={24}>
            <Card title="时间信息" style={{ borderRadius: 8 }}>
              <Descriptions bordered column={2}>
                <Descriptions.Item label="最后同步时间" span={1}>
                  {security.last_sync_time ? new Date(security.last_sync_time).toLocaleString('zh-CN') : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="更新时间" span={1}>
                  {security.updated_at ? new Date(security.updated_at).toLocaleString('zh-CN') : '-'}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
          
          <Col span={24}>
            <Card title="图表分析" style={{ borderRadius: 8 }}>
              <div style={{ textAlign: 'center', padding: '48px' }}>
                <AreaChartOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
                <p style={{ fontSize: '16px', color: '#666' }}>图表功能开发中...</p>
                <p style={{ fontSize: '14px', color: '#999', marginTop: '8px' }}>后续将添加K线图、成交量等图表分析功能</p>
              </div>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default SecurityDetail;