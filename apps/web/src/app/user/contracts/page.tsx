'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { UserNav } from '@/components/UserNav';
import BlurEffect from '@/components/BlurEffect';

interface Contract {
  id: string;
  contract_name: string;
  contract_type: string;
  status: 'signed' | 'pending' | 'expired';
  created_at: string;
  signed_at: string | null;
  user_id: string;
}

export default function ContractsList() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [isObserverMode, setIsObserverMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'signed' | 'pending' | 'expired'>('all');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        let currentUser = null;
        let profileData = null;
        
        // 1. First check for mock session in localStorage
        try {
          const mockSession = localStorage.getItem('mock_session');
          if (mockSession) {
            const sessionData = JSON.parse(mockSession);
            currentUser = sessionData.user;
            
            // Get user profile from users table
            if (currentUser?.email) {
              const { data: userData } = await supabase
                .from('users')
                .select('*')
                .eq('email', currentUser.email)
                .single();
              profileData = userData;
            }
          }
        } catch (mockError) {
          console.error('Mock session error:', mockError);
        }
        
        // 2. If no mock session, try Supabase Auth
        if (!currentUser) {
          try {
            const { data: { user: supabaseUser } } = await supabase.auth.getUser();
            currentUser = supabaseUser;
            
            if (currentUser?.email) {
              const { data: userData } = await supabase
                .from('users')
                .select('*')
                .eq('email', currentUser.email)
                .single();
              profileData = userData;
            }
          } catch (authError) {
            console.error('Supabase Auth error:', authError);
          }
        }
        
        if (currentUser && profileData) {
          setUser(currentUser);
          setProfile(profileData);
          setIsObserverMode(profileData.role === 'Guest' || profileData.role === 'USER');
          
          // Fetch contracts
          const { data: contractsData } = await supabase
            .from('contracts')
            .select('*')
            .eq('user_id', profileData.id);
          
          setContracts(contractsData || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const filteredContracts = contracts.filter(contract => {
    if (activeTab === 'all') return true;
    return contract.status === activeTab;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'signed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'signed': return '已签署';
      case 'pending': return '待签署';
      case 'expired': return '已过期';
      default: return '未知';
    }
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-8">加载中...</div>;
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl mx-auto text-center">
          <h1 className="text-2xl md:text-3xl font-bold mb-4">需要登录</h1>
          <p className="text-gray-600 mb-8">
            请登录以查看您的合同。如果您已经登录，请刷新页面重试。
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
        <h1 className="text-2xl md:text-3xl font-bold">合同管理</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left sidebar */}
        <div className="lg:col-span-1">
          <UserNav user={user} profile={profile} />
        </div>
        
        {/* Main content */}
        <div className="lg:col-span-3">
          <BlurEffect isBlurred={isObserverMode}>
            {/* Filter Tabs */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex border-b border-gray-200">
                {[
                  { key: 'all' as const, label: '全部' },
                  { key: 'signed' as const, label: '已签署' },
                  { key: 'pending' as const, label: '待签署' },
                  { key: 'expired' as const, label: '已过期' },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-4 py-3 text-sm font-medium ${activeTab === tab.key ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Contracts List */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">合同列表</h2>
              
              {filteredContracts.length > 0 ? (
                <div className="space-y-4">
                  {filteredContracts.map(contract => (
                    <Link 
                      key={contract.id}
                      href={`/user/contracts/${contract.id}`}
                      className="block p-4 border border-gray-200 rounded-md hover:border-blue-500 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-lg">{contract.contract_name}</h3>
                          <p className="text-sm text-gray-500 mt-1">
                            类型：{contract.contract_type} | 创建时间：{new Date(contract.created_at).toLocaleDateString()}
                          </p>
                          {contract.signed_at && (
                            <p className="text-sm text-gray-500 mt-1">
                              签署时间：{new Date(contract.signed_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(contract.status)}`}>
                          {getStatusText(contract.status)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-md">
                  <p className="text-gray-500">暂无合同</p>
                </div>
              )}
            </div>
          </BlurEffect>
        </div>
      </div>
    </div>
  );
}
