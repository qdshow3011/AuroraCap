import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

// 创建Supabase客户端
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const supabase = createClient(supabaseUrl, supabaseKey);

// 处理数据更新的函数
async function processDataUpdate(event: any) {
  try {
    const { type, table, record } = event;
    
    console.log(`接收到数据更新: ${type} ${table}`, record);
    
    // 根据不同的表和操作类型进行处理
    switch (table) {
      case 'ibkr_assets':
        if (type === 'INSERT' || type === 'UPDATE') {
          await handleIbkrAssetUpdate(record);
        }
        break;
        
      case 'yahoo_indices':
        if (type === 'INSERT' || type === 'UPDATE') {
          await handleYahooIndexUpdate(record);
        }
        break;
        
      case 'products':
        if (type === 'INSERT' || type === 'UPDATE') {
          await handleProductUpdate(record);
        }
        break;
    }
    
    return { success: true };
  } catch (error) {
    console.error('处理数据更新失败:', error);
    return { success: false, error: error instanceof Error ? error.message : '未知错误' };
  }
}

// 处理IBKR资产更新
async function handleIbkrAssetUpdate(asset: any) {
  try {
    // 检查资产是否有异常波动
    if (asset.is_abnormal) {
      // 可以在这里添加通知逻辑，比如发送邮件或推送通知
      console.log(`资产 ${asset.symbol} 出现异常波动，需要关注！`);
      
      // 记录异常事件
      await supabase.from('asset_alerts').insert({
        symbol: asset.symbol,
        account_id: asset.account_id,
        alert_type: 'ABNORMAL_FLUCTUATION',
        description: `资产 ${asset.symbol} 出现超过10%的波动`,
        market_value: asset.market_value,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('处理IBKR资产更新失败:', error);
  }
}

// 处理Yahoo指数更新
async function handleYahooIndexUpdate(index: any) {
  try {
    // 检查指数是否有显著变化
    const changePercent = Math.abs(index.change_percent) || 0;
    if (changePercent >= 5) {
      console.log(`指数 ${index.symbol} 出现显著变化 (${index.change_percent}%)`);
      
      // 记录指数异常事件
      await supabase.from('index_alerts').insert({
        symbol: index.symbol,
        alert_type: 'SIGNIFICANT_CHANGE',
        description: `指数 ${index.symbol} 出现超过5%的变化`,
        change_percent: index.change_percent,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('处理Yahoo指数更新失败:', error);
  }
}

// 处理产品更新
async function handleProductUpdate(product: any) {
  try {
    // 检查产品状态变化
    if (product.status === 'ACTIVE' && product.nav < product.min_nav) {
      console.log(`产品 ${product.name} 的净值低于最低阈值，需要关注！`);
      
      // 记录产品预警
      await supabase.from('product_alerts').insert({
        product_id: product.id,
        alert_type: 'LOW_NAV',
        description: `产品 ${product.name} 的净值低于最低阈值`,
        current_nav: product.nav,
        min_nav: product.min_nav,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('处理产品更新失败:', error);
  }
}

// HTTP处理函数
serve(async (req) => {
  try {
    if (req.method === 'POST') {
      // 处理实时数据更新请求
      const event = await req.json();
      const result = await processDataUpdate(event);
      
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' },
        status: result.success ? 200 : 500
      });
    } else if (req.method === 'GET') {
      // 健康检查
      return new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      });
    } else {
      return new Response('Method not allowed', { status: 405 });
    }
  } catch (error) {
    console.error('HTTP请求处理失败:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
