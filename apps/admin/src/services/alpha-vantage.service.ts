import { supabaseClient } from '../main';
import axios from 'axios';

interface AlphaVantageIndexData {
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

interface AlphaVantageSyncResult {
  success: boolean;
  processedIndices: number;
  indices: string[];
  dataSource: 'alpha-vantage';
  message: string;
}

class AlphaVantageService {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private lastCallTime: number = 0;
  private readonly CALL_INTERVAL: number = 12000; // 12秒，确保不超过5次/分钟的限制
  private readonly INDICES_TO_FETCH = [
    'SPY',   // SPDR S&P 500 ETF
    'QQQ',   // Invesco QQQ Trust (NASDAQ 100)
    'DIA',   // SPDR Dow Jones Industrial Average ETF
    'IWM',   // iShares Russell 2000 ETF
    'EWH',   // iShares MSCI Hong Kong ETF
    'EWJ'    // iShares MSCI Japan ETF
  ];

  private readonly INDEX_NAMES: Record<string, string> = {
    'SPY': 'SPDR S&P 500 ETF',
    'QQQ': 'Invesco QQQ Trust',
    'DIA': 'SPDR Dow Jones Industrial Average ETF',
    'IWM': 'iShares Russell 2000 ETF',
    'EWH': 'iShares MSCI Hong Kong ETF',
    'EWJ': 'iShares MSCI Japan ETF'
  };

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://www.alphavantage.co/query';
  }

  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCallTime;
    
    if (timeSinceLastCall < this.CALL_INTERVAL) {
      const waitTime = this.CALL_INTERVAL - timeSinceLastCall;
      console.log(`Alpha Vantage API 调用频率限制，等待 ${waitTime} 毫秒`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastCallTime = Date.now();
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

  private async fetchIndexData(symbol: string): Promise<AlphaVantageIndexData | null> {
    try {
      console.log(`正在获取 ETF ${symbol} 的数据...`);
      console.log(`使用的 API 密钥:`, this.apiKey.substring(0, 5) + '...' + this.apiKey.substring(this.apiKey.length - 5));

      await this.rateLimit();

      try {
        const result = await axios.get(this.baseUrl, {
          params: {
            function: 'GLOBAL_QUOTE',
            symbol: symbol,
            apikey: this.apiKey
          }
        });
        
        console.log(`获取 ETF ${symbol} 数据成功，状态码:`, result.status);
        console.log(`获取 ETF ${symbol} 数据成功，响应类型:`, typeof result.data);
        console.log(`获取 ETF ${symbol} 数据成功，响应内容:`, result.data);
        console.log(`获取 ETF ${symbol} 数据成功，响应键值:`, Object.keys(result.data));
        
        const quoteResponse = result.data;

        console.log(`ETF ${symbol} API 响应:`, JSON.stringify(quoteResponse, null, 2));

        if (!quoteResponse) {
          console.error(`ETF ${symbol} 返回数据格式不正确: 响应为空`);
          throw new Error(`ETF ${symbol} 返回数据格式不正确: 响应为空`);
        } else if (!quoteResponse['Global Quote']) {
          console.error(`ETF ${symbol} 返回数据格式不正确: 缺少 Global Quote 字段`);
          console.error(`ETF ${symbol} 响应内容:`, JSON.stringify(quoteResponse, null, 2));
          console.error(`ETF ${symbol} 响应键值:`, Object.keys(quoteResponse));
          throw new Error(`ETF ${symbol} 返回数据格式不正确: 缺少 Global Quote 字段`);
        }

        const quote = quoteResponse['Global Quote'];

        if (!quote) {
          console.error(`ETF ${symbol} 返回数据格式不正确: 缺少 Global Quote 字段`);
          throw new Error(`ETF ${symbol} 返回数据格式不正确: 缺少 Global Quote 字段`);
        }

        const price = parseFloat(quote['05. price']) || 0;
        const previousClose = parseFloat(quote['08. previous close']) || 0;
        const change = parseFloat(quote['09. change']) || 0;
        const changePercent = parseFloat(quote['10. change percent'].replace('%', '')) || 0;
        const open = parseFloat(quote['02. open']) || 0;
        const high = parseFloat(quote['03. high']) || 0;
        const low = parseFloat(quote['04. low']) || 0;
        const volume = parseFloat(quote['06. volume']) || 0;

        // 检查价格是否为0（可能是API限制或无效证券）
        if (price === 0) {
          console.error(`ETF ${symbol} 返回价格为0，可能是API限制或无效证券`);
          throw new Error(`ETF ${symbol} 返回价格为0，可能是API限制或无效证券`);
        }

        console.log(`ETF ${symbol} 数据:`, {
          price: price,
          previousClose: previousClose,
          change: change,
          changePercent: changePercent,
          open: open,
          high: high,
          low: low,
          volume: volume
        });

        const indexData: AlphaVantageIndexData = {
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

        console.log(`成功获取 ETF ${symbol} 数据:`, {
          price: indexData.price,
          change: indexData.change,
          change_percent: indexData.change_percent
        });

        return indexData;
      } catch (error: any) {
        console.error(`获取 ETF ${symbol} 数据失败 (内部):`, error.message);
        console.error(`获取 ETF ${symbol} 数据失败 (内部):`, error);
        throw error;
      }
    } catch (error: any) {
      console.error(`获取 ETF ${symbol} 数据失败:`, error.message);
      console.error(`获取 ETF ${symbol} 数据失败:`, error);
      throw error;
    }
  }

  // 获取模拟 ETF 数据作为备用
  private getMockIndexData(symbol: string): AlphaVantageIndexData {
    console.log(`使用模拟数据获取 ETF ${symbol} 数据`);
    
    const basePrices: Record<string, number> = {
      'SPY': 500,
      'QQQ': 400,
      'DIA': 400,
      'IWM': 200,
      'EWH': 20,
      'EWJ': 15
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

    const indexData: AlphaVantageIndexData = {
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

  private async saveIndexData(indexData: AlphaVantageIndexData): Promise<boolean> {
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
        data_source: 'alpha-vantage',
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

  async syncAllIndices(): Promise<AlphaVantageSyncResult> {
    console.log('=== 开始 Alpha Vantage ETF 数据同步 ===');
    console.log(`待同步 ETF 数量: ${this.INDICES_TO_FETCH.length}`);

    try {
      let processedCount = 0;
      const syncedIndices: string[] = [];

      for (const symbol of this.INDICES_TO_FETCH) {
        console.log(`正在同步 ETF: ${symbol}`);
        
        const indexData = await this.fetchIndexData(symbol);
        
        if (indexData) {
          const saved = await this.saveIndexData(indexData);
          
          if (saved) {
            processedCount++;
            syncedIndices.push(symbol);
            console.log(`ETF ${symbol} 同步成功`);
          } else {
            console.error(`ETF ${symbol} 保存失败`);
          }
        } else {
          console.error(`ETF ${symbol} 获取失败`);
        }
      }

      console.log(`=== Alpha Vantage ETF 数据同步完成 ===`);
      console.log(`成功获取: ${processedCount} 个 ETF`);
      console.log(`数据源: alpha-vantage`);

      return {
        success: processedCount > 0,
        processedIndices: processedCount,
        indices: syncedIndices,
        dataSource: 'alpha-vantage',
        message: `成功同步 ${processedCount} 个 ETF 数据`
      };
    } catch (error: any) {
      console.error('Alpha Vantage ETF 数据同步失败:', error);
      console.error('错误详情:', error.message);
      return {
        success: false,
        processedIndices: 0,
        indices: [],
        dataSource: 'alpha-vantage',
        message: `Alpha Vantage ETF 数据同步失败: ${error.message}`
      };
    }
  }

  async syncSingleIndex(symbol: string): Promise<AlphaVantageSyncResult> {
    console.log(`=== 开始同步单个 ETF: ${symbol} ===`);

    try {
      const indexData = await this.fetchIndexData(symbol);

      if (!indexData) {
        console.error(`未能获取 ETF ${symbol} 的数据`);
        return {
          success: false,
          processedIndices: 0,
          indices: [],
          dataSource: 'alpha-vantage',
          message: `未能获取 ETF ${symbol} 的数据`
        };
      }

      const saved = await this.saveIndexData(indexData);

      if (!saved) {
        return {
          success: false,
          processedIndices: 0,
          indices: [],
          dataSource: 'alpha-vantage',
          message: `保存 ETF ${symbol} 数据失败`
        };
      }

      console.log(`=== ETF ${symbol} 同步完成 ===`);

      return {
        success: true,
        processedIndices: 1,
        indices: [symbol],
        dataSource: 'alpha-vantage',
        message: `ETF ${symbol} 数据同步成功`
      };
    } catch (error: any) {
      console.error(`ETF ${symbol} 同步失败:`, error);
      return {
        success: false,
        processedIndices: 0,
        indices: [],
        dataSource: 'alpha-vantage',
        message: `ETF ${symbol} 同步失败: ${error.message}`
      };
    }
  }
}

// 使用 Alpha Vantage API 密钥（免费版）
// 注意：免费版有 5 次/分钟的调用限制
const API_KEY = 'BZ9JMFGTG94H5U08'; // 使用用户提供的真实 API 密钥

export const alphaVantageService = new AlphaVantageService(API_KEY);
export type { AlphaVantageSyncResult, AlphaVantageIndexData };