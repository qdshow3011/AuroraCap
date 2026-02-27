'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { UserNav } from '@/components/UserNav';
import Link from 'next/link';

// 产品类型定义
interface FundProduct {
  id: string;
  name: string;
  code: string;
  type: string;
  nav: number;
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
  total_amount: number;
  investor_count: number;
  description?: string;
  risk_level: 'low' | 'medium' | 'high';
  min_investment: number;
}

export default function FundCompanyProducts() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [products, setProducts] = useState<FundProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<FundProduct | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 表单状态
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: '股票型',
    nav: '',
    risk_level: 'medium' as 'low' | 'medium' | 'high',
    min_investment: '',
    description: '',
    status: 'active' as 'active' | 'inactive' | 'pending'
  });

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

        // 获取产品列表
        await fetchProducts();
      } catch (error) {
        console.error('Error fetching data:', error);
        setMessage({ type: 'error', text: '加载数据失败' });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchProducts = async () => {
    try {
      // 从fund_products表获取产品数据
      const { data, error } = await supabase
        .from('fund_products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error);
        // 如果没有表，使用模拟数据
        setProducts(getMockProducts());
      } else {
        setProducts(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      setProducts(getMockProducts());
    }
  };

  // 模拟产品数据
  const getMockProducts = (): FundProduct[] => [
    {
      id: '1',
      name: '稳健增长混合基金',
      code: 'AUR001',
      type: '混合型',
      nav: 1.2345,
      status: 'active',
      created_at: '2024-01-15',
      total_amount: 50000000,
      investor_count: 1250,
      risk_level: 'medium',
      min_investment: 1000
    },
    {
      id: '2',
      name: '科技创新股票基金',
      code: 'AUR002',
      type: '股票型',
      nav: 0.9876,
      status: 'active',
      created_at: '2024-02-20',
      total_amount: 80000000,
      investor_count: 2100,
      risk_level: 'high',
      min_investment: 1000
    },
    {
      id: '3',
      name: '稳健收益债券基金',
      code: 'AUR003',
      type: '债券型',
      nav: 1.0567,
      status: 'active',
      created_at: '2024-03-10',
      total_amount: 30000000,
      investor_count: 890,
      risk_level: 'low',
      min_investment: 1000
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const productData = {
        name: formData.name,
        code: formData.code,
        type: formData.type,
        nav: parseFloat(formData.nav),
        risk_level: formData.risk_level,
        min_investment: parseFloat(formData.min_investment),
        description: formData.description,
        status: formData.status,
        total_amount: 0,
        investor_count: 0,
        created_at: new Date().toISOString()
      };

      if (editingProduct) {
        // 更新产品
        const { error } = await supabase
          .from('fund_products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) {
          console.error('Error updating product:', error);
          setMessage({ type: 'error', text: '更新产品失败' });
        } else {
          setMessage({ type: 'success', text: '产品更新成功' });
          await fetchProducts();
          closeModal();
        }
      } else {
        // 添加新产品
        const { error } = await supabase
          .from('fund_products')
          .insert([productData]);

        if (error) {
          console.error('Error adding product:', error);
          setMessage({ type: 'error', text: '添加产品失败' });
        } else {
          setMessage({ type: 'success', text: '产品添加成功' });
          await fetchProducts();
          closeModal();
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage({ type: 'error', text: '操作失败' });
    }
  };

  const handleEdit = (product: FundProduct) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      code: product.code,
      type: product.type,
      nav: product.nav.toString(),
      risk_level: product.risk_level,
      min_investment: product.min_investment.toString(),
      description: product.description || '',
      status: product.status
    });
    setShowAddModal(true);
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('确定要删除此产品吗？')) return;

    try {
      const { error } = await supabase
        .from('fund_products')
        .delete()
        .eq('id', productId);

      if (error) {
        console.error('Error deleting product:', error);
        setMessage({ type: 'error', text: '删除产品失败' });
      } else {
        setMessage({ type: 'success', text: '产品删除成功' });
        await fetchProducts();
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage({ type: 'error', text: '删除失败' });
    }
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingProduct(null);
    setFormData({
      name: '',
      code: '',
      type: '股票型',
      nav: '',
      risk_level: 'medium',
      min_investment: '',
      description: '',
      status: 'active'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { text: string; className: string }> = {
      active: { text: '运行中', className: 'bg-green-100 text-green-800' },
      inactive: { text: '已暂停', className: 'bg-red-100 text-red-800' },
      pending: { text: '待审核', className: 'bg-yellow-100 text-yellow-800' }
    };
    const statusInfo = statusMap[status] || { text: status, className: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.className}`}>
        {statusInfo.text}
      </span>
    );
  };

  const getRiskBadge = (risk: string) => {
    const riskMap: Record<string, { text: string; className: string }> = {
      low: { text: '低风险', className: 'bg-green-100 text-green-800' },
      medium: { text: '中风险', className: 'bg-yellow-100 text-yellow-800' },
      high: { text: '高风险', className: 'bg-red-100 text-red-800' }
    };
    const riskInfo = riskMap[risk] || { text: risk, className: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${riskInfo.className}`}>
        {riskInfo.text}
      </span>
    );
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
        <h1 className="text-2xl md:text-3xl font-bold">产品管理</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          + 添加产品
        </button>
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
          {/* 产品统计 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-md p-4">
              <p className="text-sm text-gray-500">产品总数</p>
              <p className="text-2xl font-bold">{products.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <p className="text-sm text-gray-500">运行中</p>
              <p className="text-2xl font-bold text-green-600">
                {products.filter(p => p.status === 'active').length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <p className="text-sm text-gray-500">总管理规模</p>
              <p className="text-2xl font-bold">
                ¥{(products.reduce((sum, p) => sum + p.total_amount, 0) / 100000000).toFixed(2)}亿
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <p className="text-sm text-gray-500">投资者总数</p>
              <p className="text-2xl font-bold">
                {products.reduce((sum, p) => sum + p.investor_count, 0).toLocaleString()}
              </p>
            </div>
          </div>

          {/* 产品列表 */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">产品列表</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">产品名称</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">代码</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">净值</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">风险等级</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{product.code}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{product.type}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{product.nav.toFixed(4)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRiskBadge(product.risk_level)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(product.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {products.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                暂无产品数据
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 添加/编辑产品模态框 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white" style={{ maxWidth: '500px' }}>
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingProduct ? '编辑产品' : '添加新产品'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">产品名称</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">产品代码</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">产品类型</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="股票型">股票型</option>
                      <option value="债券型">债券型</option>
                      <option value="混合型">混合型</option>
                      <option value="货币型">货币型</option>
                      <option value="指数型">指数型</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">当前净值</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={formData.nav}
                      onChange={(e) => setFormData({ ...formData, nav: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">风险等级</label>
                    <select
                      value={formData.risk_level}
                      onChange={(e) => setFormData({ ...formData, risk_level: e.target.value as 'low' | 'medium' | 'high' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="low">低风险</option>
                      <option value="medium">中风险</option>
                      <option value="high">高风险</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">起投金额</label>
                    <input
                      type="number"
                      value={formData.min_investment}
                      onChange={(e) => setFormData({ ...formData, min_investment: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' | 'pending' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="active">运行中</option>
                    <option value="inactive">已暂停</option>
                    <option value="pending">待审核</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">产品描述</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    {editingProduct ? '保存' : '添加'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
