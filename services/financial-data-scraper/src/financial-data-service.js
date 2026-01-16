import { TiingoService } from './tiingo-service.js';
import { GoogleFinanceService } from './google-finance-service.js';
import { ProxyService } from './proxy-service.js';

export class FinancialDataService {
  constructor(tiingoApiKey, cloudflareWorkerUrl) {
    this.tiingoService = new TiingoService(tiingoApiKey);
    this.googleFinanceService = new GoogleFinanceService();
    this.proxyService = cloudflareWorkerUrl ? new ProxyService(cloudflareWorkerUrl) : null;
    
    this.indices = [
      { symbol: 'spx', name: 'S&P 500' },
      { symbol: 'iix', name: 'NASDAQ Composite' },
      { symbol: 'dji', name: 'Dow Jones Industrial Average' },
      { symbol: 'rut', name: 'Russell 2000' },
      { symbol: 'tnx', name: '10-Year Treasury Note Yield' },
      { symbol: 'vix', name: 'CBOE Volatility Index' },
      { symbol: 'ukx', name: 'FTSE 100' },
      { symbol: 'nky', name: 'Nikkei 225' },
      { symbol: 'hsi', name: 'Hang Seng Index' },
      { symbol: 'sx5e', name: 'EURO STOXX 50' }
    ];
  }

  async fetchAllIndices() {
    console.log('[FinancialDataService] 开始获取所有指数数据...');
    
    const symbols = this.indices.map(index => index.symbol);
    
    let results = [];
    let source = 'unknown';
    let useProxy = false;

    try {
      console.log('[FinancialDataService] 尝试使用 Tiingo API 获取数据...');
      
      const tiingoResult = await this.tiingoService.fetchMultipleIndices(symbols);
      
      if (tiingoResult.success.length > 0) {
        console.log(`[FinancialDataService] Tiingo API 成功获取 ${tiingoResult.success.length} 个指数`);
        results = tiingoResult.success;
        source = 'tiingo';
        
        if (tiingoResult.failed.length > 0) {
          console.log(`[FinancialDataService] Tiingo API 失败 ${tiingoResult.failed.length} 个指数，尝试回退到 Google Finance`);
          const failedSymbols = tiingoResult.failed.map(f => {
            const match = f.message.match(/symbol\s+([^\s]+)/i);
            return match ? match[1] : null;
          }).filter(s => s);
          
          if (failedSymbols.length > 0) {
            const googleResult = await this.googleFinanceService.fetchMultipleIndices(failedSymbols);
            results = [...results, ...googleResult.success];
            source = 'tiingo+google-finance';
          }
        }
      } else {
        throw new Error('Tiingo API 返回空结果');
      }
    } catch (error) {
      console.error('[FinancialDataService] Tiingo API 失败:', error.message);
      console.log('[FinancialDataService] 回退到 Google Finance 网页抓取...');
      
      try {
        const googleResult = await this.googleFinanceService.fetchMultipleIndices(symbols);
        
        if (googleResult.success.length > 0) {
          console.log(`[FinancialDataService] Google Finance 成功抓取 ${googleResult.success.length} 个指数`);
          results = googleResult.success;
          source = 'google-finance';
        } else {
          throw new Error('Google Finance 返回空结果');
        }
      } catch (googleError) {
        console.error('[FinancialDataService] Google Finance 也失败了:', googleError.message);
        
        if (this.proxyService) {
          console.log('[FinancialDataService] 尝试通过 Cloudflare Worker 代理请求...');
          useProxy = true;
          
          try {
            await this.proxyService.checkHealth();
            console.log('[FinancialDataService] Cloudflare Worker 健康检查通过');
            
            const googleResult = await this.googleFinanceService.fetchMultipleIndices(symbols);
            
            if (googleResult.success.length > 0) {
              console.log(`[FinancialDataService] 通过代理成功抓取 ${googleResult.success.length} 个指数`);
              results = googleResult.success;
              source = 'google-finance-proxy';
            } else {
              throw new Error('代理请求返回空结果');
            }
          } catch (proxyError) {
            console.error('[FinancialDataService] 代理请求也失败了:', proxyError.message);
            throw new Error('所有数据源都失败了');
          }
        } else {
          throw new Error('Tiingo API 和 Google Finance 都失败了，且未配置代理');
        }
      }
    }

    console.log(`[FinancialDataService] 最终获取 ${results.length} 个指数数据，数据源: ${source}${useProxy ? ' (通过代理)' : ''}`);
    
    return {
      success: true,
      source: source,
      useProxy: useProxy,
      count: results.length,
      data: results,
      timestamp: new Date().toISOString()
    };
  }

  async fetchSingleIndex(symbol) {
    console.log(`[FinancialDataService] 开始获取指数 ${symbol} 的数据...`);
    
    let result = null;
    let source = 'unknown';
    let useProxy = false;

    try {
      console.log(`[FinancialDataService] 尝试使用 Tiingo API 获取 ${symbol} 数据...`);
      result = await this.tiingoService.fetchIndexData(symbol);
      source = 'tiingo';
    } catch (error) {
      console.error(`[FinancialDataService] Tiingo API 获取 ${symbol} 失败:`, error.message);
      console.log(`[FinancialDataService] 回退到 Google Finance 网页抓取 ${symbol}...`);
      
      try {
        result = await this.googleFinanceService.fetchIndexData(symbol);
        source = 'google-finance';
      } catch (googleError) {
        console.error(`[FinancialDataService] Google Finance 获取 ${symbol} 也失败了:`, googleError.message);
        
        if (this.proxyService) {
          console.log(`[FinancialDataService] 尝试通过 Cloudflare Worker 代理请求 ${symbol}...`);
          useProxy = true;
          
          try {
            await this.proxyService.checkHealth();
            result = await this.googleFinanceService.fetchIndexData(symbol);
            source = 'google-finance-proxy';
          } catch (proxyError) {
            console.error(`[FinancialDataService] 代理请求 ${symbol} 也失败了:`, proxyError.message);
            throw new Error(`所有数据源都失败了: ${symbol}`);
          }
        } else {
          throw new Error(`Tiingo API 和 Google Finance 都失败了: ${symbol}`);
        }
      }
    }

    console.log(`[FinancialDataService] 成功获取 ${symbol} 数据，数据源: ${source}${useProxy ? ' (通过代理)' : ''}`);
    
    return {
      success: true,
      source: source,
      useProxy: useProxy,
      data: result,
      timestamp: new Date().toISOString()
    };
  }

  getIndicesList() {
    return this.indices;
  }
}