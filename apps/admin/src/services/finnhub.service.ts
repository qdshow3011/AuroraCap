import { supabaseClient } from '../main';
import axios from 'axios';

interface FinnhubIndexData {
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

interface FinnhubSyncResult {
  success: boolean;
  processedIndices: number;
  indices: string[];
  dataSource: 'finnhub';
  message: string;
}

class FinnhubService {
  private readonly apiKey: string;
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

  constructor(apiKey: string, baseUrl: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
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

  private async fetchIndexData(symbol: string): Promise<FinnhubIndexData | null> {
    try {
      console.log(`正在获取指数 ${symbol} 的数据...`);

      // 转换指数代码以适应 Finnhub API
      let finnhubSymbol = symbol;
      if (symbol === '^GSPC') {
        finnhubSymbol = 'SPX';
      } else if (symbol === '^IXIC') {
        finnhubSymbol = 'NDX';
      } else if (symbol === '^DJI') {
        finnhubSymbol = 'DJI';
      } else if (symbol === '^RUT') {
        finnhubSymbol = 'RUT';
      } else if (symbol === '^HSI') {
        finnhubSymbol = 'HSI';
      } else if (symbol === '^N225') {
        finnhubSymbol = 'N225';
      }

      const quoteResponse = await this.retry(async () => {
        try {
          const result = await axios.get(`${this.baseUrl}/quote`, {
            params: {
              token: this.apiKey,
              symbol: finnhubSymbol
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

      if (!quoteResponse) {
        console.error(`指数 ${symbol} 返回数据格式不正确: 响应为空`);
        throw new Error(`指数 ${symbol} 返回数据格式不正确: 响应为空`);
      }

      if (typeof quoteResponse !== 'object') {
        console.error(`指数 ${symbol} 返回数据格式不正确: 响应不是对象`);
        throw new Error(`指数 ${symbol} 返回数据格式不正确: 响应不是对象`);
      }

      // 检查是否有错误信息
      if (quoteResponse.error) {
        console.error(`指数 ${symbol} API 返回错误:`, quoteResponse.error);
        throw new Error(`指数 ${symbol} API 返回错误: ${quoteResponse.error}`);
      }

      // 检查价格是否为0或null（可能是API限制）
      if (!quoteResponse.c || quoteResponse.c === 0) {
        console.error(`指数 ${symbol} 返回价格为0，可能是API限制`);
        throw new Error(`指数 ${symbol} 返回价格为0，可能是API限制`);
      }

      const price = quoteResponse.c || 0;
      const previousClose = quoteResponse.pc || 0;
      const change = quoteResponse.d || 0;
      const changePercent = quoteResponse.dp || 0;

      console.log(`指数 ${symbol} 数据:`, {
        price: quoteResponse.c,
        previousClose: quoteResponse.pc,
        change: quoteResponse.d,
        changePercent: quoteResponse.dp
      });

      const indexData: FinnhubIndexData = {
        symbol: symbol,
        name: this.INDEX_NAMES[symbol] || symbol,
        price: price,
        change: change,
        change_percent: changePercent,
        previous_close: previousClose,
        open: quoteResponse.o || 0,
        high: quoteResponse.h || 0,
        low: quoteResponse.l || 0,
        volume: quoteResponse.v || 0,
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
      throw error;
    }
  }

  // 获取模拟指数数据作为备用
  private getMockIndexData(symbol: string): FinnhubIndexData {
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

    const indexData: FinnhubIndexData = {
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

  private async saveIndexData(indexData: FinnhubIndexData): Promise<boolean> {
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
        data_source: 'finnhub',
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

  async syncAllIndices(): Promise<FinnhubSyncResult> {
    console.log('=== 开始 Finnhub 指数数据同步 ===');
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

      console.log(`=== Finnhub 指数数据同步完成 ===`);
      console.log(`成功获取: ${processedCount} 个指数`);
      console.log(`数据源: finnhub`);

      return {
        success: processedCount > 0,
        processedIndices: processedCount,
        indices: syncedIndices,
        dataSource: 'finnhub',
        message: `成功同步 ${processedCount} 个指数数据`
      };
    } catch (error: any) {
      console.error('Finnhub 指数数据同步失败:', error);
      console.error('错误详情:', error.message);
      return {
        success: false,
        processedIndices: 0,
        indices: [],
        dataSource: 'finnhub',
        message: `Finnhub 指数数据同步失败: ${error.message}`
      };
    }
  }

  async syncSingleIndex(symbol: string): Promise<FinnhubSyncResult> {
    console.log(`=== 开始同步单个指数: ${symbol} ===`);

    try {
      const indexData = await this.fetchIndexData(symbol);

      if (!indexData) {
        console.error(`未能获取指数 ${symbol} 的数据`);
        return {
          success: false,
          processedIndices: 0,
          indices: [],
          dataSource: 'finnhub',
          message: `未能获取指数 ${symbol} 的数据`
        };
      }

      const saved = await this.saveIndexData(indexData);

      if (!saved) {
        return {
          success: false,
          processedIndices: 0,
          indices: [],
          dataSource: 'finnhub',
          message: `保存指数 ${symbol} 数据失败`
        };
      }

      console.log(`=== 指数 ${symbol} 同步完成 ===`);

      return {
        success: true,
        processedIndices: 1,
        indices: [symbol],
        dataSource: 'finnhub',
        message: `指数 ${symbol} 数据同步成功`
      };
    } catch (error: any) {
      console.error(`指数 ${symbol} 同步失败:`, error);
      return {
        success: false,
        processedIndices: 0,
        indices: [],
        dataSource: 'finnhub',
        message: `指数 ${symbol} 同步失败: ${error.message}`
      };
    }
  }
}

// 使用用户提供的 Finnhub API 密钥
const API_KEY = 'd5ecgkpr01qjckl39i40d5ecgkpr01qjckl39i4g';
const BASE_URL = 'https://finnhub.io/api/v1';

export const finnhubService = new FinnhubService(API_KEY, BASE_URL);
export type { FinnhubSyncResult, FinnhubIndexData };