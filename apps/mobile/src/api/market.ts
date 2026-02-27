import axios from 'axios';
import { supabase } from '../lib/supabase';

// 金融API客户端
export class MarketApiClient {
  private apiKey: string;
  private baseUrl: string;
  private cache: Map<string, { data: any; timestamp: number }>;
  private cacheExpiry: number = 30000; // 缓存过期时间（毫秒）

  constructor(apiKey: string, baseUrl: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.cache = new Map();
  }

  // 获取市场指数数据
  async getMarketIndices(indices: string[]): Promise<any[]> {
    try {
      // 检查缓存
      const cachedData = this.getCachedData(`indices_${indices.join(',')}`);
      if (cachedData) {
        return cachedData;
      }

      try {
        // 使用 Finnhub API 获取市场指数数据
        const results = await Promise.all(
          indices.map(async (symbol) => {
            try {
              // 对于不同市场的指数，使用不同的API端点
              let response;
              if (symbol === '^GSPC' || symbol === '^DJI' || symbol === '^IXIC') {
                // 美股指数
                const ticker = symbol.replace('^', '');
                response = await axios.get(`${this.baseUrl}/quote`, {
                  params: {
                    token: this.apiKey,
                    symbol: ticker
                  }
                });
              } else if (symbol === '000001.SS') {
                // 上证指数
                response = await axios.get(`${this.baseUrl}/quote`, {
                  params: {
                    token: this.apiKey,
                    symbol: 'SSE'
                  }
                });
              } else if (symbol === '399001.SZ') {
                // 深证成指
                response = await axios.get(`${this.baseUrl}/quote`, {
                  params: {
                    token: this.apiKey,
                    symbol: 'SZSE'
                  }
                });
              } else if (symbol === '^HSI') {
                // 恒生指数
                response = await axios.get(`${this.baseUrl}/quote`, {
                  params: {
                    token: this.apiKey,
                    symbol: 'HSI'
                  }
                });
              } else if (symbol === '^N225') {
                // 日经225
                response = await axios.get(`${this.baseUrl}/quote`, {
                  params: {
                    token: this.apiKey,
                    symbol: 'N225'
                  }
                });
              } else {
                // 其他指数，使用通用API
                response = await axios.get(`${this.baseUrl}/quote`, {
                  params: {
                    token: this.apiKey,
                    symbol: symbol
                  }
                });
              }

              const data = response.data;
              return {
                symbol,
                name: this.getIndexName(symbol),
                price: data.c || 0, // 当前价格
                change: data.d || 0, // 涨跌额
                change_percent: data.dp || 0, // 涨跌幅百分比
                timestamp: new Date().toISOString()
              };
            } catch (error) {
              console.error(`获取指数数据失败 (${symbol}):`, error);
              // 如果API调用失败，使用模拟数据
              return this.getMockIndexData(symbol);
            }
          })
        );

        // 缓存数据
        this.setCachedData(`indices_${indices.join(',')}`, results);

        return results;
      } catch (error) {
        console.error('获取市场指数数据失败，使用模拟数据:', error);
        // 如果整体API调用失败，使用模拟数据
        const mockResults = indices.map(symbol => this.getMockIndexData(symbol));
        return mockResults;
      }
    } catch (error) {
      console.error('获取市场指数数据失败:', error);
      throw error;
    }
  }

  // 获取模拟指数数据
  private getMockIndexData(symbol: string): any {
    const basePrices: Record<string, number> = {
      '^GSPC': 5200,
      '^DJI': 38000,
      '^IXIC': 16000,
      '000001.SS': 3200,
      '399001.SZ': 12000,
      '^HSI': 18000,
      '^N225': 39000
    };

    const basePrice = basePrices[symbol] || 100;
    const randomFactor = 0.98 + Math.random() * 0.04; // 0.98 到 1.02 之间的随机因子
    const price = parseFloat((basePrice * randomFactor).toFixed(2));
    const change = parseFloat((price - basePrice).toFixed(2));
    const changePercent = parseFloat(((change / basePrice) * 100).toFixed(2));

    return {
      symbol,
      name: this.getIndexName(symbol),
      price,
      change,
      change_percent: changePercent,
      timestamp: new Date().toISOString()
    };
  }

  // 获取单个股票数据
  async getStockData(symbol: string): Promise<any> {
    try {
      // 检查缓存
      const cachedData = this.getCachedData(`stock_${symbol}`);
      if (cachedData) {
        return cachedData;
      }

      try {
        // 使用 Finnhub API 获取股票数据
        const response = await axios.get(`${this.baseUrl}/quote`, {
          params: {
            token: this.apiKey,
            symbol: symbol
          }
        });

        const data = response.data;
        const stockData = {
          symbol,
          name: this.getStockName(symbol),
          price: data.c || 0, // 当前价格
          change: data.d || 0, // 涨跌额
          change_percent: data.dp || 0, // 涨跌幅百分比
          open: data.o || 0, // 开盘价
          high: data.h || 0, // 最高价
          low: data.l || 0, // 最低价
          volume: data.v || 0, // 成交量
          timestamp: new Date().toISOString()
        };

        // 缓存数据
        this.setCachedData(`stock_${symbol}`, stockData);

        return stockData;
      } catch (error) {
        console.error(`获取股票数据失败 (${symbol}):`, error);
        // 如果API调用失败，使用模拟数据
        const mockData = this.getMockStockData(symbol);
        return mockData;
      }
    } catch (error) {
      console.error(`获取股票数据失败 (${symbol}):`, error);
      throw error;
    }
  }

  // 获取模拟股票数据
  private getMockStockData(symbol: string): any {
    const basePrices: Record<string, number> = {
      'AAPL': 220,
      'MSFT': 420,
      'GOOGL': 170,
      'AMZN': 180,
      'TSLA': 700,
      'BABA': 80,
      'PDD': 140,
      'JD': 40
    };

    const basePrice = basePrices[symbol] || 100;
    const randomFactor = 0.98 + Math.random() * 0.04; // 0.98 到 1.02 之间的随机因子
    const price = parseFloat((basePrice * randomFactor).toFixed(2));
    const change = parseFloat((price - basePrice).toFixed(2));
    const changePercent = parseFloat(((change / basePrice) * 100).toFixed(2));
    const open = parseFloat((basePrice * (0.99 + Math.random() * 0.02)).toFixed(2));
    const high = parseFloat((Math.max(price, open) * (1.0 + Math.random() * 0.01)).toFixed(2));
    const low = parseFloat((Math.min(price, open) * (0.99 + Math.random() * 0.01)).toFixed(2));
    const volume = Math.floor(Math.random() * 1000000) + 100000;

    return {
      symbol,
      name: this.getStockName(symbol),
      price,
      change,
      change_percent: changePercent,
      open,
      high,
      low,
      volume,
      timestamp: new Date().toISOString()
    };
  }

  // 批量获取股票数据
  async getBatchStockData(symbols: string[]): Promise<any[]> {
    try {
      // 检查缓存
      const cachedData = this.getCachedData(`batch_${symbols.join(',')}`);
      if (cachedData) {
        return cachedData;
      }

      // 并行请求多个股票数据
      const requests = symbols.map(symbol => this.getStockData(symbol));
      const results = await Promise.all(requests);

      // 缓存数据
      this.setCachedData(`batch_${symbols.join(',')}`, results);

      return results;
    } catch (error) {
      console.error('批量获取股票数据失败:', error);
      throw error;
    }
  }

  // 清除缓存
  clearCache() {
    this.cache.clear();
  }

  // 私有方法：获取缓存数据
  private getCachedData(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    this.cache.delete(key);
    return null;
  }

  // 私有方法：设置缓存数据
  private setCachedData(key: string, data: any) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // 私有方法：获取指数名称
  private getIndexName(symbol: string): string {
    const indexNames: Record<string, string> = {
      '^GSPC': '标普500',
      '^DJI': '道琼斯',
      '^IXIC': '纳斯达克',
      '000001.SS': '上证指数',
      '399001.SZ': '深证成指',
      '^HSI': '恒生指数',
      '^N225': '日经225'
    };
    return indexNames[symbol] || symbol;
  }

  // 私有方法：获取股票名称
  private getStockName(symbol: string): string {
    const stockNames: Record<string, string> = {
      'AAPL': '苹果公司',
      'MSFT': '微软公司',
      'GOOGL': 'Alphabet',
      'AMZN': '亚马逊',
      'TSLA': '特斯拉',
      'BABA': '阿里巴巴',
      'PDD': '拼多多',
      'JD': '京东'
    };
    return stockNames[symbol] || symbol;
  }
}

// 创建默认API客户端
const API_KEY = 'd5ecgkpr01qjckl39i40d5ecgkpr01qjckl39i4g';
const BASE_URL = 'https://finnhub.io/api/v1';

export const marketApi = new MarketApiClient(API_KEY, BASE_URL);

// 常用市场指数
export const DEFAULT_INDICES = {
  us: ['^GSPC', '^DJI', '^IXIC'],
  cn: ['000001.SS', '399001.SZ'],
  hk: ['^HSI'],
  other: ['^N225']
};

// 获取市场分类数据
export async function getMarketCategories(lang: 'zh' | 'en' = 'zh') {
  try {
    const categoryNames: Record<string, string> = {
      'us': lang === 'zh' ? '美股' : 'US Stocks',
      'cn': lang === 'zh' ? 'A股' : 'A-Shares',
      'hk': lang === 'zh' ? '港股' : 'HK Stocks',
      'other': lang === 'zh' ? '其他' : 'Others'
    };

    // 从数据库获取市场指数数据
    if (supabase) {
      const { data: indicesData, error } = await supabase
        .from('yahoo_indices')
        .select('*');

      if (!error && indicesData && indicesData.length > 0) {
        // 分类指数数据
        const categorizedIndices: Record<string, any[]> = {
          us: [],
          cn: [],
          hk: [],
          other: []
        };

        // 根据指数代码分类
        indicesData.forEach((index: any) => {
          const symbol = index.symbol;
          // 根据代码判断指数类型
          if (symbol.includes('^GSPC') || symbol.includes('^DJI') || symbol.includes('^IXIC') || 
              symbol.includes('NASDAQ') || symbol.includes('SPX') || symbol.includes('DJIA')) {
            categorizedIndices.us.push(index);
          } else if (symbol.includes('.SH') || symbol.includes('.SZ') || 
                     symbol.includes('000001') || symbol.includes('399001') || symbol.includes('399006')) {
            categorizedIndices.cn.push(index);
          } else if (symbol.includes('HSI') || symbol.includes('HSTECH') || symbol.includes('HSCEI')) {
            categorizedIndices.hk.push(index);
          } else {
            categorizedIndices.other.push(index);
          }
        });

        // 构建分类数据
        const categories = Object.entries(categorizedIndices).map(([type, indices]) => ({
          id: type,
          name: categoryNames[type] || type,
          indices: indices.map((item, index) => ({
            id: `${type}${index + 1}`,
            name: item.name,
            code: item.symbol,
            value: parseFloat(item.price) || 0,
            change: parseFloat(item.change) || 0,
            changePercent: parseFloat(item.changePercent) || 0
          }))
        })).filter(category => category.indices.length > 0);

        return categories;
      }
    }

    // 如果数据库获取失败，使用默认数据
    console.log('数据库获取失败，使用默认数据');
    const categories = await Promise.all(
      Object.entries(DEFAULT_INDICES).map(async ([type, symbols]) => {
        const indicesData = await marketApi.getMarketIndices(symbols);
        return {
          id: type,
          name: categoryNames[type] || type,
          indices: indicesData.map((item, index) => ({
            id: `${type}${index + 1}`,
            name: item.name,
            code: item.symbol,
            value: item.price,
            change: item.change,
            changePercent: item.change_percent
          }))
        };
      })
    );

    return categories;
  } catch (error) {
    console.error('获取市场分类数据失败:', error);
    return [];
  }
}
