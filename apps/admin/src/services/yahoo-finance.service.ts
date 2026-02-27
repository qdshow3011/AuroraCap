import { supabaseClient } from '../main';
import axios from 'axios';
import yahooFinance from 'yahoo-finance2';

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

      const quoteResponse = await this.retry(async () => {
        try {
          const result = await yahooFinance.quote(symbol);
          console.log(`获取指数 ${symbol} 数据成功，响应类型:`, typeof result);
          console.log(`获取指数 ${symbol} 数据成功，响应内容:`, result);
          return result;
        } catch (error: any) {
          console.error(`获取指数 ${symbol} 数据失败 (内部):`, error.message);
          console.error(`获取指数 ${symbol} 数据失败 (内部):`, error);
          throw error;
        }
      }, 2, 3000);

      console.log(`指数 ${symbol} API 响应:`, JSON.stringify(quoteResponse, null, 2));

      if (!quoteResponse) {
        console.error(`指数 ${symbol} 返回数据格式不正确: 响应为空`);
        return null;
      }

      if (typeof quoteResponse !== 'object') {
        console.error(`指数 ${symbol} 返回数据格式不正确: 响应不是对象`);
        return null;
      }

      const price = quoteResponse.regularMarketPrice || 0;
      const previousClose = quoteResponse.previousClose || 0;
      const change = quoteResponse.regularMarketChange || 0;
      const changePercent = quoteResponse.regularMarketChangePercent || 0;

      console.log(`指数 ${symbol} 数据:`, {
        regularMarketPrice: quoteResponse.regularMarketPrice,
        previousClose: quoteResponse.previousClose,
        regularMarketChange: quoteResponse.regularMarketChange,
        regularMarketChangePercent: quoteResponse.regularMarketChangePercent
      });

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
      console.error(`获取指数 ${symbol} 数据失败:`, error);
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

export const yahooFinanceService = new YahooFinanceService();
export type { YahooSyncResult, YahooIndexData };