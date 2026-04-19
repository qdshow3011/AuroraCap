'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserNav } from '@/components/UserNav';
import BlurEffect from '@/components/BlurEffect';

interface Contract {
  id: string;
  contract_name: string;
  contract_type: string;
  content: string;
  status: 'signed' | 'pending' | 'expired';
  created_at: string;
  signed_at: string | null;
  user_id: string;
}

export default function ContractDetail() {
  const params = useParams();
  const router = useRouter();
  const contractId = params.contractId as string;
  
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isObserverMode, setIsObserverMode] = useState(false);
  const [signing, setSigning] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchContractData = async () => {
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
          
          // Fetch contract
          const { data: contractData, error: contractError } = await supabase
            .from('contracts')
            .select('*')
            .eq('id', contractId)
            .single();
          
          if (contractError) {
            throw contractError;
          }
          
          if (contractData.user_id !== profileData.id) {
            throw new Error('您无权访问此合同');
          }
          
          setContract(contractData);
        }
      } catch (err: any) {
        console.error('Error fetching contract:', err);
        setError(err.message || '获取合同失败');
      } finally {
        setLoading(false);
      }
    };

    fetchContractData();
  }, [contractId]);

  const handleSignContract = async () => {
    if (!contract) return;
    
    try {
      setSigning(true);
      
      // Update contract status to signed
      const { error: updateError } = await supabase
        .from('contracts')
        .update({
          status: 'signed',
          signed_at: new Date().toISOString()
        })
        .eq('id', contractId);
      
      if (updateError) {
        throw updateError;
      }
      
      setSuccess(true);
      
      // Refresh contract data
      const { data: updatedContract } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', contractId)
        .single();
      
      setContract(updatedContract);
    } catch (err) {
      console.error('Error signing contract:', err);
      setError('签署合同失败，请重试');
    } finally {
      setSigning(false);
    }
  };

  const handleDownloadContract = () => {
    if (!contract) return;
    
    // Create a blob from contract content
    const blob = new Blob([contract.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${contract.contract_name}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-8">加载中...</div>;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
        <Link href="/user/contracts" className="text-blue-600 hover:underline">
          返回合同列表
        </Link>
      </div>
    );
  }

  if (!user || !contract) {
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">合同详情</h1>
        <Link 
          href="/user/contracts" 
          className="text-blue-600 hover:underline"
        >
          返回合同列表
        </Link>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left sidebar */}
        <div className="lg:col-span-1">
          <UserNav user={user} profile={profile} />
        </div>
        
        {/* Main content */}
        <div className="lg:col-span-3">
          <BlurEffect isBlurred={isObserverMode}>
            {/* Contract Header */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold">{contract.contract_name}</h2>
                  <p className="text-gray-600 mt-1">类型：{contract.contract_type}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(contract.status)}`}>
                  {getStatusText(contract.status)}
                </span>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">创建时间：</span>
                  <span>{new Date(contract.created_at).toLocaleString()}</span>
                </div>
                {contract.signed_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">签署时间：</span>
                    <span>{new Date(contract.signed_at).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Contract Content */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-xl font-semibold mb-4">合同内容</h3>
              <div className="bg-gray-50 p-6 rounded-md border border-gray-200 max-h-96 overflow-y-auto">
                <pre className="text-sm whitespace-pre-wrap">{contract.content}</pre>
              </div>
            </div>
            
            {/* Actions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={handleDownloadContract}
                  className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                >
                  下载合同
                </button>
                
                {contract.status === 'pending' && (
                  <button
                    onClick={handleSignContract}
                    disabled={signing}
                    className={`px-6 py-2 rounded-md transition-colors ${signing ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                  >
                    {signing ? '签署中...' : '签署合同'}
                  </button>
                )}
                
                {success && (
                  <div className="flex-1">
                    <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-2 rounded-md">
                      合同签署成功！
                    </div>
                  </div>
                )}
              </div>
            </div>
          </BlurEffect>
        </div>
      </div>
    </div>
  );
}
