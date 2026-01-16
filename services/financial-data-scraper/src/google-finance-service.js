import axios from 'axios';
import * as cheerio from 'cheerio';

export class GoogleFinanceService {
  constructor() {
    this.timeout = parseInt(process.env.REQUEST_TIMEOUT) || 30000;
    this.maxRetries = parseInt(process.env.MAX_RETRIES) || 3;
    this.userAgents = this.generateUserAgents();
  }

  generateUserAgents() {
    const browsers = [
      {
        name: 'Chrome',
        versions: ['115.0.0.0', '116.0.0.0', '117.0.0.0', '118.0.0.0', '119.0.0.0', '120.0.0.0'],
        os: ['Windows NT 10.0; Win64; x64', 'Macintosh; Intel Mac OS X 10_15_7', 'X11; Linux x86_64']
      },
      {
        name: 'Firefox',
        versions: ['115.0', '116.0', '117.0', '118.0', '119.0', '120.0'],
        os: ['Windows NT 10.0; Win64; x64', 'Macintosh; Intel Mac OS X 10.15', 'X11; Linux x86_64']
      },
      {
        name: 'Safari',
        versions: ['15.6', '16.0', '16.1', '16.2', '16.3', '16.4'],
        os: ['Macintosh; Intel Mac OS X 10_15_7', 'Macintosh; Intel Mac OS X 13_0_1']
      }
    ];

    const agents = [];
    browsers.forEach(browser => {
      browser.versions.forEach(version => {
        browser.os.forEach(os => {
          if (browser.name === 'Chrome') {
            agents.push(`Mozilla/5.0 (${os}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version} Safari/537.36`);
          } else if (browser.name === 'Firefox') {
            agents.push(`Mozilla/5.0 (${os}; rv:${version.split('.')[0]}.0) Gecko/20100101 Firefox/${version}`);
          } else if (browser.name === 'Safari') {
            agents.push(`Mozilla/5.0 (${os}) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${version} Safari/605.1.15`);
          }
        });
      });
    });

    return agents;
  }

  getRandomUserAgent() {
    const index = Math.floor(Math.random() * this.userAgents.length);
    return this.userAgents[index];
  }

  async fetchIndexData(symbol) {
    try {
      console.log(`[Google Finance] 正在抓取指数 ${symbol} 的数据...`);
      
      const userAgent = this.getRandomUserAgent();
      const url = `https://www.google.com/finance/quote/${symbol}`;
      
      const response = await this.makeRequest(url, userAgent);
      
      const data = this.parseGoogleFinanceData(response.data, symbol);
      
      console.log(`[Google Finance] 成功抓取指数 ${symbol} 的数据`);
      
      return {
        ...data,
        timestamp: new Date().toISOString(),
        source: 'google-finance'
      };
    } catch (error) {
      console.error(`[Google Finance] 抓取指数 ${symbol} 数据失败:`, error.message);
      throw error;
    }
  }

  async fetchMultipleIndices(symbols) {
    try {
      console.log(`[Google Finance] 正在批量抓取 ${symbols.length} 个指数的数据...`);
      
      const promises = symbols.map(symbol => this.fetchIndexData(symbol));
      const results = await Promise.allSettled(promises);
      
      const successfulResults = results
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value);
      
      const failedResults = results
        .filter(result => result.status === 'rejected')
        .map(result => result.reason);
      
      console.log(`[Google Finance] 成功抓取 ${successfulResults.length} 个指数，失败 ${failedResults.length} 个`);
      
      return {
        success: successfulResults,
        failed: failedResults
      };
    } catch (error) {
      console.error('[Google Finance] 批量抓取指数数据失败:', error.message);
      throw error;
    }
  }

  async makeRequest(url, userAgent, retryCount = 0) {
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Cache-Control': 'max-age=0'
        },
        timeout: this.timeout
      });
      
      return response;
    } catch (error) {
      if (retryCount < this.maxRetries && this.isRetryableError(error)) {
        const delay = Math.pow(2, retryCount) * 1000;
        console.log(`[Google Finance] 请求失败，${delay}ms 后重试 (${retryCount + 1}/${this.maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.makeRequest(url, this.getRandomUserAgent(), retryCount + 1);
      }
      throw error;
    }
  }

  isRetryableError(error) {
    if (error.response) {
      const status = error.response.status;
      return status >= 500 || status === 429 || status === 403;
    }
    return error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT';
  }

  parseGoogleFinanceData(html, symbol) {
    const $ = cheerio.load(html);
    
    const name = this.extractText($, 'div[data-module-name="QuoteHeader"] .zzDege');
    const price = this.extractPrice($, 'div[data-module-name="QuoteHeader"] .YMlKec.fxKbKc');
    const change = this.extractChange($, 'div[data-module-name="QuoteHeader"] .P2Luy');
    const changePercent = this.extractChangePercent($, 'div[data-module-name="QuoteHeader"] .P2Luy');
    
    return {
      symbol: symbol,
      name: name || this.getIndexName(symbol),
      price: price || 0,
      change: change || 0,
      change_percent: changePercent || 0,
      previous_close: (price || 0) - (change || 0),
      open: 0,
      high: 0,
      low: 0,
      volume: 0
    };
  }

  extractText($, selector) {
    const element = $(selector).first();
    return element.text().trim() || null;
  }

  extractPrice($, selector) {
    const text = this.extractText($, selector);
    if (!text) return null;
    const price = text.replace(/[^0-9.-]/g, '');
    return parseFloat(price) || null;
  }

  extractChange($, selector) {
    const text = this.extractText($, selector);
    if (!text) return null;
    const match = text.match(/([+-]?[0-9,]+\.?[0-9]*)/);
    if (match) {
      return parseFloat(match[1].replace(/,/g, '')) || null;
    }
    return null;
  }

  extractChangePercent($, selector) {
    const text = this.extractText($, selector);
    if (!text) return null;
    const match = text.match(/\(([+-]?[0-9,]+\.?[0-9]*)%\)/);
    if (match) {
      return parseFloat(match[1].replace(/,/g, '')) || null;
    }
    return null;
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