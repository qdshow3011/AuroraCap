import axios from 'axios';

const TIINGO_BASE_URL = 'https://api.tiingo.com';

export class TiingoService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.timeout = parseInt(process.env.REQUEST_TIMEOUT) || 30000;
    this.maxRetries = parseInt(process.env.MAX_RETRIES) || 3;
  }

  async fetchIndexData(symbol) {
    try {
      console.log(`[Tiingo] 正在获取指数 ${symbol} 的数据...`);
      
      const url = `${TIINGO_BASE_URL}/tiingo/iex/${symbol}`;
      
      const response = await this.makeRequest(url);
      
      if (!response.data || response.data.length === 0) {
        throw new Error('Tiingo API返回的数据为空');
      }
      
      const latestData = response.data[0];
      
      console.log(`[Tiingo] 成功获取指数 ${symbol} 的数据`);
      
      return {
        symbol: symbol,
        name: this.getIndexName(symbol),
        price: latestData.last,
        change: latestData.change,
        change_percent: latestData.changePercent,
        previous_close: latestData.prevClose,
        open: latestData.open,
        high: latestData.high,
        low: latestData.low,
        volume: latestData.volume,
        timestamp: new Date().toISOString(),
        source: 'tiingo'
      };
    } catch (error) {
      console.error(`[Tiingo] 获取指数 ${symbol} 数据失败:`, error.message);
      throw error;
    }
  }

  async fetchMultipleIndices(symbols) {
    try {
      console.log(`[Tiingo] 正在批量获取 ${symbols.length} 个指数的数据...`);
      
      const promises = symbols.map(symbol => this.fetchIndexData(symbol));
      const results = await Promise.allSettled(promises);
      
      const successfulResults = results
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value);
      
      const failedResults = results
        .filter(result => result.status === 'rejected')
        .map(result => result.reason);
      
      console.log(`[Tiingo] 成功获取 ${successfulResults.length} 个指数，失败 ${failedResults.length} 个`);
      
      return {
        success: successfulResults,
        failed: failedResults
      };
    } catch (error) {
      console.error('[Tiingo] 批量获取指数数据失败:', error.message);
      throw error;
    }
  }

  async makeRequest(url, retryCount = 0) {
    try {
      const response = await axios.get(url, {
        headers: {
          'Authorization': `Token ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: this.timeout
      });
      
      return response;
    } catch (error) {
      if (retryCount < this.maxRetries && this.isRetryableError(error)) {
        const delay = Math.pow(2, retryCount) * 1000;
        console.log(`[Tiingo] 请求失败，${delay}ms 后重试 (${retryCount + 1}/${this.maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.makeRequest(url, retryCount + 1);
      }
      throw error;
    }
  }

  isRetryableError(error) {
    if (error.response) {
      const status = error.response.status;
      return status >= 500 || status === 429;
    }
    return error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT';
  }

  getIndexName(symbol) {
    const names = {
      '^GSPC': 'S&P 500',
      '^IXIC': 'NASDAQ Composite',
      '^DJI': 'Dow Jones Industrial Average',
      '^RUT': 'Russell 2000',
      '^TNX': '10-Year Treasury Note Yield',
      '^VIX': 'CBOE Volatility Index',
      '^FTSE': 'FTSE 100',
      '^N225': 'Nikkei 225',
      '^HSI': 'Hang Seng Index',
      '^STOXX50E': 'EURO STOXX 50'
    };
    return names[symbol] || symbol;
  }
}