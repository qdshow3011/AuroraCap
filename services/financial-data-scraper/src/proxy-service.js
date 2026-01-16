import axios from 'axios';

export class ProxyService {
  constructor(workerUrl) {
    this.workerUrl = workerUrl;
    this.timeout = parseInt(process.env.REQUEST_TIMEOUT) || 30000;
    this.maxRetries = parseInt(process.env.MAX_RETRIES) || 3;
  }

  async proxyRequest(url, method = 'GET', headers = {}, body = null) {
    try {
      console.log(`[Proxy] 正在通过Cloudflare Worker代理请求: ${url}`);
      
      const proxyUrl = `${this.workerUrl}/proxy?url=${encodeURIComponent(url)}&method=${method}`;
      
      const response = await this.makeProxyRequest(proxyUrl, headers, body);
      
      console.log(`[Proxy] 代理请求成功，状态码: ${response.status}`);
      
      return response;
    } catch (error) {
      console.error(`[Proxy] 代理请求失败:`, error.message);
      throw error;
    }
  }

  async makeProxyRequest(url, headers, body, retryCount = 0) {
    try {
      const config = {
        method: 'GET',
        url: url,
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      };

      if (body) {
        config.method = 'POST';
        config.data = body;
      }

      const response = await axios(config);
      return response;
    } catch (error) {
      if (retryCount < this.maxRetries && this.isRetryableError(error)) {
        const delay = Math.pow(2, retryCount) * 1000;
        console.log(`[Proxy] 代理请求失败，${delay}ms 后重试 (${retryCount + 1}/${this.maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.makeProxyRequest(url, headers, body, retryCount + 1);
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

  async checkHealth() {
    try {
      const healthUrl = `${this.workerUrl}/health`;
      const response = await axios.get(healthUrl, {
        timeout: 5000
      });
      return response.data;
    } catch (error) {
      console.error('[Proxy] 健康检查失败:', error.message);
      throw error;
    }
  }
}