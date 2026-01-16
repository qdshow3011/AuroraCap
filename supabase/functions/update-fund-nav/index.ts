import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

// 创建Supabase客户端
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const supabase = createClient(supabaseUrl, supabaseKey);

// 更新基金净值的函数
async function updateFundNAVs() {
  try {
    console.log('开始更新基金净值...');
    
    // 1. 获取所有活跃基金
    const { data: funds, error: fundsError } = await supabase
      .from('products')
      .select('*')
      .eq('type', 'fund')
      .eq('status', 'ACTIVE');
    
    if (fundsError) throw fundsError;
    if (!funds || funds.length === 0) {
      console.log('没有找到活跃基金');
      return { updatedFunds: 0 };
    }
    
    let updatedCount = 0;
    
    // 2. 为每个基金更新净值
    for (const fund of funds) {
      try {
        // 获取基金持仓
        const { data: holdings, error: holdingsError } = await supabase
          .from('product_holdings')
          .select('asset_id, quantity')
          .eq('product_id', fund.id);
        
        if (holdingsError) throw holdingsError;
        if (!holdings || holdings.length === 0) {
          console.log(`基金 ${fund.name} 没有持仓数据`);
          continue;
        }
        
        // 计算基金总资产价值
        let totalValue = 0;
        
        for (const holding of holdings) {
          // 获取资产当前市值
          const { data: asset, error: assetError } = await supabase
            .from('ibkr_assets')
            .select('market_value')
            .eq('id', holding.asset_id)
            .single();
          
          if (assetError || !asset) {
            console.log(`无法获取资产 ${holding.asset_id} 的市值数据`);
            continue;
          }
          
          // 计算该持仓的总价值
          const holdingValue = asset.market_value * holding.quantity;
          totalValue += holdingValue;
        }
        
        // 计算新的净值
        const newNav = fund.shares_outstanding > 0 ? totalValue / fund.shares_outstanding : 0;
        
        // 只在净值有变化时更新
        if (Math.abs(newNav - (fund.nav || 0)) > 0.0001) {
          // 更新基金净值
          const { error: updateError } = await supabase
            .from('products')
            .update({ nav: newNav, updated_at: new Date().toISOString() })
            .eq('id', fund.id);
          
          if (updateError) throw updateError;
          
          // 记录净值历史
          await supabase.from('fund_nav_history').insert({
            product_id: fund.id,
            nav: newNav,
            timestamp: new Date().toISOString()
          });
          
          console.log(`基金 ${fund.name} 净值已更新: ${newNav.toFixed(4)}`);
          updatedCount++;
        } else {
          console.log(`基金 ${fund.name} 净值没有变化`);
        }
        
      } catch (error) {
        console.error(`更新基金 ${fund.name} 净值失败:`, error);
        continue;
      }
    }
    
    console.log(`基金净值更新完成，共更新了 ${updatedCount} 个基金`);
    return { updatedFunds: updatedCount };
    
  } catch (error) {
    console.error('更新基金净值失败:', error);
    throw error;
  }
}

// HTTP处理函数
serve(async (req) => {
  try {
    if (req.method === 'POST' || req.method === 'GET') {
      // 处理更新基金净值的请求
      const result = await updateFundNAVs();
      
      return new Response(JSON.stringify({
        message: '基金净值更新任务已完成',
        ...result
      }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      });
    } else {
      return new Response('Method not allowed', { status: 405 });
    }
  } catch (error) {
    console.error('HTTP请求处理失败:', error);
    return new Response(JSON.stringify({ 
      error: '更新基金净值失败',
      details: error instanceof Error ? error.message : '未知错误' 
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
