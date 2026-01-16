import axios from 'axios';

export class FinnhubNewsService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://finnhub.io/api/v1';
  }

  async getNews(category = 'general', minId = 0) {
    try {
      const response = await axios.get(`${this.baseUrl}/news`, {
        params: {
          category,
          minId,
          token: this.apiKey
        },
        timeout: 10000
      });

      return response.data;
    } catch (error) {
      console.error('[Finnhub] 获取新闻失败:', error.message);
      throw error;
    }
  }

  async getCompanyNews(symbol, from, to) {
    try {
      const response = await axios.get(`${this.baseUrl}/company-news`, {
        params: {
          symbol,
          from,
          to,
          token: this.apiKey
        },
        timeout: 10000
      });

      return response.data;
    } catch (error) {
      console.error('[Finnhub] 获取公司新闻失败:', error.message);
      throw error;
    }
  }

  async getNewsSentiment(symbol) {
    try {
      const response = await axios.get(`${this.baseUrl}/news-sentiment`, {
        params: {
          symbol,
          token: this.apiKey
        },
        timeout: 10000
      });

      return response.data;
    } catch (error) {
      console.error('[Finnhub] 获取新闻情感分析失败:', error.message);
      throw error;
    }
  }
}
