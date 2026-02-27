import { supabaseClient } from '../main';
import axios from 'axios';

interface YahooIndexData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  change_percent: number;
  previous_close: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  timestamp: string;
}

interface YahooSyncResult {
  success: boolean;
  processedIndices: number;
  indices: string[];
  dataSource: 'yahoo-finance';
  message: string;
}

class YahooFinanceFreeService {
  private readonly baseUrl: string;
  private readonly INDICES_TO_FETCH = [
    '^GSPC',   // S&P 500
    '^IXIC',   // NASDAQ Composite
    '^DJI',    // Dow Jones Industrial Average
    '^RUT',    // Russell 2000
    '^HSI',    // Hang Seng Index
    '^N225'    // Nikkei 225
  ];

  private readonly INDEX_NAMES: Record<string, string> = {
    '^GSPC': 'S&P 500',
    '^IXIC': 'NASDAQ Composite',
    '^DJI': 'Dow Jones Industrial Average',
    '^RUT': 'Russell 2000',
    '^HSI': 'Hang Seng Index',
    '^N225': 'Nikkei 225'
  };

  constructor() {
    this.baseUrl = 'https://query1.finance.yahoo.com/v8/finance/chart';
  }

  private async retry<T>(fn: () => Promise<T>, retries: number = 3, initialDelay: number = 2000): Promise<T> {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error: any) {
        if (i === retries - 1) {
          console.error(`最后一次重试失败 (${i + 1}/${retries})，不再重试`);
          throw error;
        }

        let delay = initialDelay;
        let retryReason = '未知错误';

        if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
          delay = initialDelay * Math.pow(2, i);
          retryReason = `网络错误 (${error.code})`;
        }

        console.log(`请求失败: ${retryReason}，${delay}毫秒后重试 (${i + 1}/${retries})`);

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw new Error('重试失败');
  }

  private async fetchIndexData(symbol: string): Promise<YahooIndexData | null> {
    try {
      console.log(`正在获取指数 ${symbol} 的数据...`);

      const quoteResponse = await this.retry(async () => {
        try {
          const result = await axios.get(`${this.baseUrl}/${symbol}`, {
            params: {
              interval: '1d',
              range: '1d'
            },
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'application/json, text/plain, */*',
              'Accept-Language': 'en-US,en;q=0.9',
              'Accept-Encoding': 'gzip, deflate, br',
              'Connection': 'keep-alive',
              'Origin': 'http://localhost:5173',
              'Referer': 'http://localhost:5173/',
              'Sec-Fetch-Dest': 'empty',
              'Sec-Fetch-Mode': 'cors',
              'Sec-Fetch-Site': 'cross-site'
            }
          });
          console.log(`获取指数 ${symbol} 数据成功，响应类型:`, typeof result.data);
          console.log(`获取指数 ${symbol} 数据成功，响应内容:`, result.data);
          return result.data;
        } catch (error: any) {
          console.error(`获取指数 ${symbol} 数据失败 (内部):`, error.message);
          console.error(`获取指数 ${symbol} 数据失败 (内部):`, error);
          throw error;
        }
      }, 2, 3000);

      console.log(`指数 ${symbol} API 响应:`, JSON.stringify(quoteResponse, null, 2));

      if (!quoteResponse || !quoteResponse.chart || !quoteResponse.chart.result || quoteResponse.chart.result.length === 0) {
        console.error(`指数 ${symbol} 返回数据格式不正确: 响应为空或格式错误`);
        throw new Error(`指数 ${symbol} 返回数据格式不正确: 响应为空或格式错误`);
      }

      const result = quoteResponse.chart.result[0];
      const meta = result.meta;
      const indicators = result.indicators;
      const quote = indicators.quote && indicators.quote.length > 0 ? indicators.quote[0] : null;

      if (!meta || !quote) {
        console.error(`指数 ${symbol} 返回数据格式不正确: 缺少必要字段`);
        throw new Error(`指数 ${symbol} 返回数据格式不正确: 缺少必要字段`);
      }

      const price = meta.regularMarketPrice || 0;
      const previousClose = meta.previousClose || 0;
      const change = price - previousClose;
      const changePercent = (change / previousClose) * 100;
      const open = quote.open && quote.open.length > 0 ? quote.open[0] : 0;
      const high = quote.high && quote.high.length > 0 ? quote.high[0] : 0;
      const low = quote.low && quote.low.length > 0 ? quote.low[0] : 0;
      const volume = quote.volume && quote.volume.length > 0 ? quote.volume[0] : 0;

      console.log(`指数 ${symbol} 数据:`, {
        price: price,
        previousClose: previousClose,
        change: change,
        changePercent: changePercent,
        open: open,
        high: high,
        low: low,
        volume: volume
      });

      const indexData: YahooIndexData = {
        symbol: symbol,
        name: this.INDEX_NAMES[symbol] || symbol,
        price: price,
        change: change,
        change_percent: changePercent,
        previous_close: previousClose,
        open: open,
        high: high,
        low: low,
        volume: volume,
        timestamp: new Date().toISOString()
      };

      console.log(`成功获取指数 ${symbol} 数据:`, {
        price: indexData.price,
        change: indexData.change,
        change_percent: indexData.change_percent
      });

      return indexData;
    } catch (error: any) {
      console.error(`获取指数 ${symbol} 数据失败:`, error.message);
      console.error(`获取指数 ${symbol} 数据失败:`, error);
      // 直接抛出错误，不使用模拟数据
      throw error;
    }
  }

  // 获取模拟指数数据作为备用
  private getMockIndexData(symbol: string): YahooIndexData {
    console.log(`使用模拟数据获取指数 ${symbol} 数据`);
    
    const basePrices: Record<string, number> = {
      '^GSPC': 5200,
      '^IXIC': 16000,
      '^DJI': 38000,
      '^RUT': 2000,
      '^HSI': 18000,
      '^N225': 39000
    };

    const basePrice = basePrices[symbol] || 1000;
    const randomFactor = 0.98 + Math.random() * 0.04; // 0.98 到 1.02 之间的随机因子
    const price = parseFloat((basePrice * randomFactor).toFixed(2));
    const previousClose = basePrice;
    const change = parseFloat((price - previousClose).toFixed(2));
    const changePercent = parseFloat(((change / previousClose) * 100).toFixed(2));
    const open = parseFloat((previousClose * (0.99 + Math.random() * 0.02)).toFixed(2));
    const high = parseFloat((Math.max(price, open) * (1.0 + Math.random() * 0.01)).toFixed(2));
    const low = parseFloat((Math.min(price, open) * (0.99 + Math.random() * 0.01)).toFixed(2));
    const volume = Math.floor(Math.random() * 1000000) + 100000;

    const indexData: YahooIndexData = {
      symbol: symbol,
      name: this.INDEX_NAMES[symbol] || symbol,
      price: price,
      change: change,
      change_percent: changePercent,
      previous_close: previousClose,
      open: open,
      high: high,
      low: low,
      volume: volume,
      timestamp: new Date().toISOString()
    };

    console.log(`成功生成指数 ${symbol} 模拟数据:`, {
      price: indexData.price,
      change: indexData.change,
      change_percent: indexData.change_percent
    });

    return indexData;
  }

  private async saveIndexData(indexData: YahooIndexData): Promise<boolean> {
    try {
      const { error } = await supabaseClient.from('yahoo_indices').upsert({
        symbol: indexData.symbol,
        name: indexData.name,
        price: indexData.price,
        change: indexData.change,
        change_percent: indexData.change_percent,
        previous_close: indexData.previous_close,
        open: indexData.open,
        high: indexData.high,
        low: indexData.low,
        volume: indexData.volume,
        timestamp: indexData.timestamp,
        updated_at: new Date().toISOString(),
        sync_status: 'success',
        last_sync_time: new Date().toISOString(),
        sync_error_message: null,
        data_source: 'manual',
        market_type: 'us',
        is_enabled: true
      }, {
        onConflict: ['symbol']
      });

      if (error) {
        console.error(`保存指数 ${indexData.symbol} 数据失败:`, error);
        return false;
      }

      console.log(`成功保存指数 ${indexData.symbol} 数据`);
      return true;
    } catch (error: any) {
      console.error(`保存指数 ${indexData.symbol} 数据失败:`, error);
      return false;
    }
  }

  async syncAllIndices(): Promise<YahooSyncResult> {
    console.log('=== 开始 Yahoo Finance 指数数据同步 ===');
    console.log(`待同步指数数量: ${this.INDICES_TO_FETCH.length}`);

    try {
      let processedCount = 0;
      const syncedIndices: string[] = [];

      for (const symbol of this.INDICES_TO_FETCH) {
        console.log(`正在同步指数: ${symbol}`);
        
        const indexData = await this.fetchIndexData(symbol);
        
        if (indexData) {
          const saved = await this.saveIndexData(indexData);
          
          if (saved) {
            processedCount++;
            syncedIndices.push(symbol);
            console.log(`指数 ${symbol} 同步成功`);
          } else {
            console.error(`指数 ${symbol} 保存失败`);
          }
        } else {
          console.error(`指数 ${symbol} 获取失败`);
        }
      }

      console.log(`=== Yahoo Finance 指数数据同步完成 ===`);
      console.log(`成功获取: ${processedCount} 个指数`);
      console.log(`数据源: yahoo-finance`);

      return {
        success: processedCount > 0,
        processedIndices: processedCount,
        indices: syncedIndices,
        dataSource: 'yahoo-finance',
        message: `成功同步 ${processedCount} 个指数数据`
      };
    } catch (error: any) {
      console.error('Yahoo Finance 指数数据同步失败:', error);
      console.error('错误详情:', error.message);
      return {
        success: false,
        processedIndices: 0,
        indices: [],
        dataSource: 'yahoo-finance',
        message: `Yahoo Finance 指数数据同步失败: ${error.message}`
      };
    }
  }

  async syncSingleIndex(symbol: string): Promise<YahooSyncResult> {
    console.log(`=== 开始同步单个指数: ${symbol} ===`);

    try {
      const indexData = await this.fetchIndexData(symbol);

      if (!indexData) {
        console.error(`未能获取指数 ${symbol} 的数据`);
        return {
          success: false,
          processedIndices: 0,
          indices: [],
          dataSource: 'yahoo-finance',
          message: `未能获取指数 ${symbol} 的数据`
        };
      }

      const saved = await this.saveIndexData(indexData);

      if (!saved) {
        return {
          success: false,
          processedIndices: 0,
          indices: [],
          dataSource: 'yahoo-finance',
          message: `保存指数 ${symbol} 数据失败`
        };
      }

      console.log(`=== 指数 ${symbol} 同步完成 ===`);

      return {
        success: true,
        processedIndices: 1,
        indices: [symbol],
        dataSource: 'yahoo-finance',
        message: `指数 ${symbol} 数据同步成功`
      };
    } catch (error: any) {
      console.error(`指数 ${symbol} 同步失败:`, error);
      return {
        success: false,
        processedIndices: 0,
        indices: [],
        dataSource: 'yahoo-finance',
        message: `指数 ${symbol} 同步失败: ${error.message}`
      };
    }
  }
}

export const yahooFinanceFreeService = new YahooFinanceFreeService();
export type { YahooSyncResult, YahooIndexData };