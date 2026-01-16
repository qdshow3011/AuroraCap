'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function ObserverMode() {
  const [user, setUser] = useState<any>(null);
  const [observedFunds, setObservedFunds] = useState<any[]>([]);
  const [allFunds, setAllFunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        
        if (!currentUser) {
          // User not logged in, redirect to login
          window.location.href = '/login';
          return;
        }
        
        setUser(currentUser);
        
        // Get all funds for adding to observation
        const { data: fundsData } = await supabase.from('products').select('*');
        setAllFunds(fundsData || []);
        
        // Get observed funds
        const { data: observedData } = await supabase
          .from('user_observations')
          .select('*, funds(*)')
          .eq('user_id', currentUser.id);
        
        setObservedFunds(observedData || []);
        
        // Set up real-time subscription for NAV updates
        const subscription = supabase
          .channel('nav-updates')
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'funds', filter: 'id=in.(' + observedData?.map(obs => obs.fund_id).join(',') + ')' }, 
            (payload) => {
              setObservedFunds(prev => prev.map(obs => {
                if (obs.fund_id === payload.new.id) {
                  return {
                    ...obs,
                    funds: { ...obs.funds, ...payload.new }
                  };
                }
                return obs;
              }));
            })
          .subscribe();
        
        return () => {
          supabase.removeChannel(subscription);
        };
      } catch (error) {
        console.error('Error fetching observer data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleObservation = async (fundId: string, isObserving: boolean) => {
    if (!user) return;
    
    try {
      if (isObserving) {
        // Remove from observation
        await supabase
          .from('user_observations')
          .delete()
          .eq('user_id', user.id)
          .eq('fund_id', fundId);
        
        setObservedFunds(prev => prev.filter(obs => obs.fund_id !== fundId));
      } else {
        // Add to observation
        await supabase
          .from('user_observations')
          .insert([{ user_id: user.id, fund_id: fundId }]);
        
        // Update local state
        const fundToAdd = allFunds.find(f => f.id === fundId);
        if (fundToAdd) {
          setObservedFunds(prev => [...prev, { user_id: user.id, fund_id: fundId, funds: fundToAdd }]);
        }
      }
    } catch (error) {
      console.error('Error toggling observation:', error);
    }
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-8">加载中...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">观察员模式</h1>
        <div className="flex space-x-4">
          <Link href="/funds" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            返回基金列表
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Observed Funds */}
        <div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">观察列表</h2>
            
            {observedFunds.length > 0 ? (
              <div className="space-y-4">
                {observedFunds.map((observation) => {
                  const fund = observation.funds;
                  return (
                    <div key={observation.id} className="border border-gray-200 rounded-md p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-lg font-medium">
                            <Link href={`/funds/${fund.id}`} className="hover:text-blue-600">
                              {fund.name}
                            </Link>
                          </h3>
                          <p className="text-sm text-gray-500">{fund.code}</p>
                        </div>
                        <button 
                          className="px-3 py-1 bg-red-100 text-red-800 rounded-md text-sm hover:bg-red-200 transition-colors"
                          onClick={() => toggleObservation(fund.id, true)}
                        >
                          取消观察
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div>
                          <p className="text-sm text-gray-500">最新净值</p>
                          <p className="text-lg font-medium">¥{fund.nav?.toFixed(4) || '0.0000'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">日涨跌幅</p>
                          <p className="text-lg font-medium text-green-600">+0.00%</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">基金规模</p>
                          <p className="text-sm">¥{fund.size?.toLocaleString() || '0'}</p>
                        </div>
                      </div>
                      
                      <div className="mt-4 text-xs text-gray-400">
                        最后更新: {new Date(fund.updated_at).toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-md">
                <p className="text-gray-500 mb-4">暂无观察的基金</p>
                <p className="text-sm text-gray-400">从下方添加基金到观察列表</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Add Funds to Observation */}
        <div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">添加基金到观察列表</h2>
            
            <div className="space-y-3">
              {allFunds
                .filter(fund => !observedFunds.some(obs => obs.fund_id === fund.id))
                .map(fund => (
                  <div key={fund.id} className="border border-gray-200 rounded-md p-3 hover:shadow-sm transition-shadow">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium">
                          <Link href={`/funds/${fund.id}`} className="hover:text-blue-600">
                            {fund.name}
                          </Link>
                        </h3>
                        <p className="text-sm text-gray-500">{fund.code}</p>
                      </div>
                      <button 
                        className="px-3 py-1 bg-green-100 text-green-800 rounded-md text-sm hover:bg-green-200 transition-colors"
                        onClick={() => toggleObservation(fund.id, false)}
                      >
                        添加观察
                      </button>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-md">
        <h3 className="font-medium text-blue-800 mb-2">观察员模式说明</h3>
        <ul className="list-disc list-inside text-sm text-blue-700 space-y-1">
          <li>在观察列表中的基金将实时更新净值数据</li>
          <li>可以随时添加或移除观察的基金</li>
          <li>观察列表最多支持添加10只基金</li>
          <li>实时数据每30秒更新一次</li>
        </ul>
      </div>
    </div>
  );
}
