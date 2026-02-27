'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { UserNav } from '@/components/UserNav';

// 文章类型定义
interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  cover_image?: string;
  category: string;
  tags: string[];
  author: string;
  status: 'draft' | 'published' | 'archived';
  view_count: number;
  like_count: number;
  publish_date?: string;
  created_at: string;
  updated_at: string;
}

export default function FundCompanyOfficialAccount() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // 表单状态
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    cover_image: '',
    category: '市场动态',
    tags: '',
    author: '',
    status: 'draft' as 'draft' | 'published' | 'archived'
  });

  const categories = ['市场动态', '产品公告', '投资知识', '公司新闻', '投资者教育'];

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

        // 获取文章列表
        await fetchArticles();
      } catch (error) {
        console.error('Error fetching data:', error);
        setMessage({ type: 'error', text: '加载数据失败' });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchArticles = async () => {
    try {
      // 从articles表获取文章数据
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching articles:', error);
        // 如果没有表，使用模拟数据
        setArticles(getMockArticles());
      } else {
        setArticles(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      setArticles(getMockArticles());
    }
  };

  // 模拟文章数据
  const getMockArticles = (): Article[] => [
    {
      id: '1',
      title: '2024年一季度市场展望：机遇与挑战并存',
      summary: '本文分析了一季度宏观经济形势及资本市场走势，为投资者提供参考建议。',
      content: '详细内容...',
      category: '市场动态',
      tags: ['市场展望', '投资策略'],
      author: '研究部',
      status: 'published',
      view_count: 1250,
      like_count: 89,
      publish_date: '2024-03-10',
      created_at: '2024-03-08',
      updated_at: '2024-03-10'
    },
    {
      id: '2',
      title: '稳健增长混合基金季度收益报告',
      summary: '本基金一季度表现稳健，收益率位居同类产品前列。',
      content: '详细内容...',
      cover_image: 'https://example.com/image.jpg',
      category: '产品公告',
      tags: ['基金报告', '业绩回顾'],
      author: '运营部',
      status: 'published',
      view_count: 856,
      like_count: 45,
      publish_date: '2024-03-05',
      created_at: '2024-03-04',
      updated_at: '2024-03-05'
    },
    {
      id: '3',
      title: '如何正确理解基金净值波动',
      summary: '帮助投资者正确认识基金净值的正常波动，避免盲目赎回。',
      content: '详细内容...',
      category: '投资者教育',
      tags: ['投资知识', '风险提示'],
      author: '培训部',
      status: 'published',
      view_count: 2340,
      like_count: 156,
      publish_date: '2024-02-28',
      created_at: '2024-02-25',
      updated_at: '2024-02-28'
    },
    {
      id: '4',
      title: '新基金产品即将发售',
      summary: '科技创新股票基金将于下月正式公开发售。',
      content: '详细内容...',
      category: '产品公告',
      tags: ['新产品', '科技创新'],
      author: '市场部',
      status: 'draft',
      view_count: 0,
      like_count: 0,
      created_at: '2024-03-12',
      updated_at: '2024-03-12'
    },
    {
      id: '5',
      title: '公司荣获年度最佳基金管理机构奖',
      summary: '凭借优秀的投资业绩和客户服务，我司荣获行业权威奖项。',
      content: '详细内容...',
      category: '公司新闻',
      tags: ['荣誉', '公司动态'],
      author: '品牌部',
      status: 'published',
      view_count: 1580,
      like_count: 234,
      publish_date: '2024-02-20',
      created_at: '2024-02-18',
      updated_at: '2024-02-20'
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const articleData = {
        title: formData.title,
        summary: formData.summary,
        content: formData.content,
        cover_image: formData.cover_image || null,
        category: formData.category,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        author: formData.author,
        status: formData.status,
        publish_date: formData.status === 'published' ? new Date().toISOString().split('T')[0] : null,
        view_count: editingArticle?.view_count || 0,
        like_count: editingArticle?.like_count || 0,
        created_at: editingArticle?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (editingArticle) {
        // 更新文章
        const { error } = await supabase
          .from('articles')
          .update(articleData)
          .eq('id', editingArticle.id);

        if (error) {
          console.error('Error updating article:', error);
          setMessage({ type: 'error', text: '更新文章失败' });
        } else {
          setMessage({ type: 'success', text: '文章更新成功' });
          await fetchArticles();
          closeEditor();
        }
      } else {
        // 添加新文章
        const { error } = await supabase
          .from('articles')
          .insert([articleData]);

        if (error) {
          console.error('Error adding article:', error);
          setMessage({ type: 'error', text: '添加文章失败' });
        } else {
          setMessage({ type: 'success', text: '文章添加成功' });
          await fetchArticles();
          closeEditor();
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage({ type: 'error', text: '操作失败' });
    }
  };

  const handleEdit = (article: Article) => {
    setEditingArticle(article);
    setFormData({
      title: article.title,
      summary: article.summary,
      content: article.content,
      cover_image: article.cover_image || '',
      category: article.category,
      tags: article.tags.join(', '),
      author: article.author,
      status: article.status
    });
    setShowEditor(true);
  };

  const handleDelete = async (articleId: string) => {
    if (!confirm('确定要删除此文章吗？')) return;

    try {
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', articleId);

      if (error) {
        console.error('Error deleting article:', error);
        setMessage({ type: 'error', text: '删除文章失败' });
      } else {
        setMessage({ type: 'success', text: '文章删除成功' });
        await fetchArticles();
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage({ type: 'error', text: '删除失败' });
    }
  };

  const handlePublish = async (articleId: string) => {
    try {
      const { error } = await supabase
        .from('articles')
        .update({ 
          status: 'published',
          publish_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', articleId);

      if (error) {
        console.error('Error publishing article:', error);
        setMessage({ type: 'error', text: '发布文章失败' });
      } else {
        setMessage({ type: 'success', text: '文章发布成功' });
        await fetchArticles();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleArchive = async (articleId: string) => {
    try {
      const { error } = await supabase
        .from('articles')
        .update({ status: 'archived' })
        .eq('id', articleId);

      if (error) {
        console.error('Error archiving article:', error);
        setMessage({ type: 'error', text: '归档文章失败' });
      } else {
        setMessage({ type: 'success', text: '文章归档成功' });
        await fetchArticles();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const closeEditor = () => {
    setShowEditor(false);
    setEditingArticle(null);
    setFormData({
      title: '',
      summary: '',
      content: '',
      cover_image: '',
      category: '市场动态',
      tags: '',
      author: '',
      status: 'draft'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { text: string; className: string }> = {
      published: { text: '已发布', className: 'bg-green-100 text-green-800' },
      draft: { text: '草稿', className: 'bg-yellow-100 text-yellow-800' },
      archived: { text: '已归档', className: 'bg-gray-100 text-gray-800' }
    };
    const statusInfo = statusMap[status] || { text: status, className: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.className}`}>
        {statusInfo.text}
      </span>
    );
  };

  const filteredArticles = selectedCategory === 'all' 
    ? articles 
    : articles.filter(a => a.category === selectedCategory);

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
        <h1 className="text-2xl md:text-3xl font-bold">公众号管理</h1>
        <button
          onClick={() => setShowEditor(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          + 创建文章
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
          {/* 文章统计 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-md p-4">
              <p className="text-sm text-gray-500">文章总数</p>
              <p className="text-2xl font-bold">{articles.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <p className="text-sm text-gray-500">已发布</p>
              <p className="text-2xl font-bold text-green-600">
                {articles.filter(a => a.status === 'published').length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <p className="text-sm text-gray-500">草稿</p>
              <p className="text-2xl font-bold text-yellow-600">
                {articles.filter(a => a.status === 'draft').length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <p className="text-sm text-gray-500">总阅读量</p>
              <p className="text-2xl font-bold">
                {articles.reduce((sum, a) => sum + a.view_count, 0).toLocaleString()}
              </p>
            </div>
          </div>

          {/* 分类筛选 */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-md text-sm transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                全部
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-md text-sm transition-colors ${
                    selectedCategory === category
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* 文章列表 */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">文章列表</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">标题</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">分类</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">作者</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">阅读量</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredArticles.map((article) => (
                    <tr key={article.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{article.title}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{article.summary}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {article.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{article.author}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(article.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {article.view_count.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEdit(article)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          编辑
                        </button>
                        {article.status === 'draft' && (
                          <button
                            onClick={() => handlePublish(article.id)}
                            className="text-green-600 hover:text-green-900 mr-3"
                          >
                            发布
                          </button>
                        )}
                        {article.status === 'published' && (
                          <button
                            onClick={() => handleArchive(article.id)}
                            className="text-gray-600 hover:text-gray-900 mr-3"
                          >
                            归档
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(article.id)}
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
            {filteredArticles.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                暂无文章数据
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 文章编辑器模态框 */}
      {showEditor && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border shadow-lg rounded-md bg-white" style={{ maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingArticle ? '编辑文章' : '创建新文章'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">摘要</label>
                  <textarea
                    value={formData.summary}
                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">内容</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={8}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">封面图片URL</label>
                  <input
                    type="text"
                    value={formData.cover_image}
                    onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">作者</label>
                    <input
                      type="text"
                      value={formData.author}
                      onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">标签（用逗号分隔）</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="标签1, 标签2, 标签3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'published' | 'archived' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="draft">草稿</option>
                    <option value="published">发布</option>
                    <option value="archived">归档</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={closeEditor}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    {editingArticle ? '保存' : '创建'}
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
