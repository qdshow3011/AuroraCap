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
  dataSource: 'yahoo-finance' | 'manual';
  message: string;
}

class YahooFinanceService {
  private readonly INDICES_TO_FETCH = [
    '^GSPC',   // S&P 500
    '^IXIC',   // NASDAQ Composite
    '^DJI',    // Dow Jones Industrial Average
    '^RUT',    // Russell 2000
    '^TNX',    // 10-Year Treasury Yield
    '^VIX',    // CBOE Volatility Index
    '^FTSE',   // FTSE 100
    '^N225',   // Nikkei 225
    '^HSI',    // Hang Seng Index
    '^STOXX50E' // EURO STOXX 50
  ];

  private readonly INDEX_NAMES: Record<string, string> = {
    '^GSPC': 'S&P 500',
    '^IXIC': 'NASDAQ Composite',
    '^DJI': 'Dow Jones Industrial Average',
    '^RUT': 'Russell 2000',
    '^TNX': '10-Year Treasury Yield',
    '^VIX': 'CBOE Volatility Index',
    '^FTSE': 'FTSE 100',
    '^N225': 'Nikkei 225',
    '^HSI': 'Hang Seng Index',
    '^STOXX50E': 'EURO STOXX 50'
  };

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

      const response = await this.retry(async () => {
        return await Promise.race([
          axios.get(`https://query1.finance.yahoo.com/v6/finance/quote`, {
            params: {
              symbols: symbol,
              fields: 'regularMarketPrice,previousClose,regularMarketChange,regularMarketChangePercent,regularMarketOpen,regularMarketDayHigh,regularMarketDayLow,regularMarketVolume,regularMarketTime,longName,shortName'
            },
            timeout: 15000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('请求超时')), 15000)
          )
        ]);
      }, 2, 3000);

      console.log(`指数 ${symbol} API 响应:`, JSON.stringify(response.data, null, 2));

      const quoteResponse = response.data.quoteResponse?.result?.[0];

      if (!quoteResponse) {
        console.error(`指数 ${symbol} 返回数据格式不正确，响应数据:`, response.data);
        return null;
      }

      const price = quoteResponse.regularMarketPrice || 0;
      const previousClose = quoteResponse.previousClose || 0;
      const change = quoteResponse.regularMarketChange || 0;
      const changePercent = quoteResponse.regularMarketChangePercent || 0;

      const indexData: YahooIndexData = {
        symbol: symbol,
        name: quoteResponse.longName || quoteResponse.shortName || this.INDEX_NAMES[symbol] || symbol,
        price: price,
        change: change,
        change_percent: changePercent,
        previous_close: previousClose,
        open: quoteResponse.regularMarketOpen || 0,
        high: quoteResponse.regularMarketDayHigh || 0,
        low: quoteResponse.regularMarketDayLow || 0,
        volume: quoteResponse.regularMarketVolume || 0,
        timestamp: quoteResponse.regularMarketTime ? new Date(quoteResponse.regularMarketTime * 1000).toISOString() : new Date().toISOString()
      };

      console.log(`成功获取指数 ${symbol} 数据:`, {
        price: indexData.price,
        change: indexData.change,
        change_percent: indexData.change_percent
      });

      return indexData;
    } catch (error: any) {
      console.error(`获取指数 ${symbol} 数据失败:`, error.message);
      if (error.response) {
        console.error(`API 响应状态: ${error.response.status}`);
        console.error(`API 响应数据:`, error.response.data);
      }
      return null;
    }
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
        data_source: 'yahoo-finance',
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
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      console.log(`调用 API URL: ${apiUrl}/yahoo-sync`);
      
      const response = await axios.get(`${apiUrl}/yahoo-sync`, {
        timeout: 60000
      });

      console.log(`API 响应状态: ${response.status}`);
      console.log(`API 响应数据:`, response.data);

      if (response.status !== 200) {
        throw new Error(`API 请求失败，状态码: ${response.status}`);
      }

      const result = response.data;

      console.log(`=== Yahoo Finance 指数数据同步完成 ===`);
      console.log(`成功获取: ${result.processedIndices} 个指数`);
      console.log(`数据源: ${result.dataSource}`);

      return {
        success: true,
        processedIndices: result.processedIndices,
        indices: result.indices,
        dataSource: result.dataSource === 'yahoo-finance2' ? 'yahoo-finance' : 'manual',
        message: result.message
      };
    } catch (error: any) {
      console.error('Yahoo Finance 指数数据同步失败:', error);
      console.error('错误详情:', error.message);
      if (error.response) {
        console.error('响应状态:', error.response.status);
        console.error('响应数据:', error.response.data);
      }
      if (error.request) {
        console.error('请求已发送但没有收到响应');
      }
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

export const yahooFinanceService = new YahooFinanceService();
export type { YahooSyncResult, YahooIndexData };