// 盈透证券API客户端实现

interface IBApiConfig {
  baseUrl: string;
  apiKey: string;
}

export interface MarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: number;
}

export class IBApiClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: IBApiConfig) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
  }

  // 获取市场指数数据
  async getMarketIndices(indices: string[]): Promise<MarketData[]> {
    try {
      // 这里需要替换为实际的盈透证券API调用
      // 盈透证券API需要认证，通常使用OAuth2或API密钥
      // 以下是模拟实现，实际项目中需要替换为真实API调用
      const response = await fetch(`${this.baseUrl}/api/v1/market/indices`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching market indices from IB API:', error);
      // 如果API调用失败，返回模拟数据
      return this.getMockMarketIndices(indices);
    }
  }

  // 模拟市场指数数据（用于开发和测试）
  private getMockMarketIndices(indices: string[]): MarketData[] {
    // 模拟不同市场的指数数据
    const mockData: Record<string, MarketData> = {
      // 美股
      'DJIA': { symbol: 'DJIA', price: 38454.40, change: 128.22, changePercent: 0.33, timestamp: Date.now() },
      'NASDAQ': { symbol: 'NASDAQ', price: 16217.81, change: 126.28, changePercent: 0.78, timestamp: Date.now() },
      'SPX': { symbol: 'SPX', price: 5130.00, change: 28.23, changePercent: 0.55, timestamp: Date.now() },
      // A股
      '000001.SH': { symbol: '000001.SH', price: 3023.30, change: 15.67, changePercent: 0.52, timestamp: Date.now() },
      '399001.SZ': { symbol: '399001.SZ', price: 9856.21, change: 78.32, changePercent: 0.80, timestamp: Date.now() },
      '399006.SZ': { symbol: '399006.SZ', price: 1923.45, change: 23.67, changePercent: 1.25, timestamp: Date.now() },
      // 港股
      'HSI': { symbol: 'HSI', price: 17893.45, change: 123.67, changePercent: 0.70, timestamp: Date.now() },
      'HSTECH': { symbol: 'HSTECH', price: 4012.34, change: 67.89, changePercent: 1.72, timestamp: Date.now() },
      'HSCEI': { symbol: 'HSCEI', price: 5987.65, change: 45.32, changePercent: 0.76, timestamp: Date.now() },
      // 黄金
      'GC': { symbol: 'GC', price: 2158.30, change: 12.45, changePercent: 0.58, timestamp: Date.now() },
      'XAUUSD': { symbol: 'XAUUSD', price: 2165.80, change: 14.23, changePercent: 0.66, timestamp: Date.now() },
    };

    // 返回请求的指数数据
    return indices.map(index => mockData[index] || {
      symbol: index,
      price: 0,
      change: 0,
      changePercent: 0,
      timestamp: Date.now()
    });
  }
}

// 创建IB API客户端实例
export const ibApiClient = new IBApiClient({
  baseUrl: process.env.EXPO_PUBLIC_IB_API_BASE_URL || 'https://api.interactivebrokers.com',
  apiKey: process.env.EXPO_PUBLIC_IB_API_KEY || 'demo_key'
});
