import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';
import yahooFinance from 'https://esm.sh/yahoo-finance2@2.11.3';

// 创建Supabase客户端
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const supabase = createClient(supabaseUrl, supabaseKey);

// 主要指数列表
const INDICES_TO_FETCH = [
  '^GSPC', // S&P 500
  '^IXIC', // NASDAQ
  '^DJI',  // Dow Jones Industrial Average
  '^RUT',  // Russell 2000
  '^TNX',  // 10-Year Treasury Note Yield
  '^VIX',  // CBOE Volatility Index
  '^FTSE', // FTSE 100
  '^N225', // Nikkei 225
  '^HSI',  // Hang Seng Index
  '^STOXX50E' // EURO STOXX 50
];

// 同步指数数据的函数
async function syncIndices() {
  try {
    console.log('开始Yahoo Finance指数数据同步...');
    
    // 1. 获取指数数据
    const indexData = await Promise.all(
      INDICES_TO_FETCH.map(async (symbol) => {
        try {
          const quote = await yahooFinance.quote(symbol);
          
          return {
            symbol: symbol,
            name: quote.longName || quote.shortName || symbol,
            price: quote.regularMarketPrice || 0,
            change: quote.regularMarketChange || 0,
            change_percent: quote.regularMarketChangePercent || 0,
            previous_close: quote.regularMarketPreviousClose || 0,
            open: quote.regularMarketOpen || 0,
            high: quote.regularMarketDayHigh || 0,
            low: quote.regularMarketDayLow || 0,
            volume: quote.regularMarketVolume || 0,
            timestamp: quote.regularMarketTime ? new Date(quote.regularMarketTime * 1000).toISOString() : new Date().toISOString()
          };
        } catch (error) {
          console.error(`获取指数 ${symbol} 数据失败:`, error);
          return null;
        }
      })
    );
    
    // 过滤掉获取失败的数据
    const validIndexData = indexData.filter(item => item !== null);
    
    if (validIndexData.length === 0) {
      throw new Error('未能获取任何指数数据');
    }
    
    console.log(`成功获取 ${validIndexData.length} 个指数的数据`);
    
    // 2. 存储数据到Supabase，使用upsert策略
    for (const index of validIndexData) {
      const { error } = await supabase.from('yahoo_indices').upsert({
        symbol: index.symbol,
        name: index.name,
        price: index.price,
        change: index.change,
        change_percent: index.change_percent,
        previous_close: index.previous_close,
        open: index.open,
        high: index.high,
        low: index.low,
        volume: index.volume,
        timestamp: index.timestamp,
        updated_at: new Date().toISOString(),
        sync_status: 'success',
        last_sync_time: new Date().toISOString(),
        sync_error_message: null,
        data_source: 'yahoo-finance2',
        market_type: 'us',
        is_enabled: true,
      }, {
        onConflict: ['symbol']
      });

      if (error) {
        console.error(`保存指数 ${index.symbol} 数据失败:`, error);
      }
    }
    
    // 3. 可选：清理旧数据（保留最近7天的数据）
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    await supabase.from('yahoo_indices_history').delete()
      .lt('timestamp', sevenDaysAgo.toISOString());
    
    // 4. 将当前数据保存到历史表
    for (const index of validIndexData) {
      await supabase.from('yahoo_indices_history').insert({
        symbol: index.symbol,
        price: index.price,
        change: index.change,
        change_percent: index.change_percent,
        volume: index.volume,
        timestamp: index.timestamp
      });
    }
    
    console.log(`指数数据同步完成，共处理 ${validIndexData.length} 个指数`);
    
    return {
      processedIndices: validIndexData.length,
      indices: validIndexData.map(item => item.symbol)
    };
    
  } catch (error) {
    console.error('Yahoo Finance数据同步失败:', error);
    throw error;
  }
}

// HTTP处理函数
serve(async (req) => {
  try {
    if (req.method === 'POST' || req.method === 'GET') {
      const result = await syncIndices();
      
      return new Response(JSON.stringify({
        message: 'Yahoo Finance指数数据同步任务已成功完成',
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
      error: 'Yahoo Finance数据同步失败',
      details: error instanceof Error ? error.message : '未知错误' 
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
});
