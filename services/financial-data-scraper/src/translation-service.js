import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';

export class TranslationService {
  constructor() {
    this.baseUrl = 'https://translate.googleapis.com/translate_a/single';
    this.maxRetries = 5;
    this.timeout = 30000;
    this.enableTranslation = process.env.ENABLE_TRANSLATION !== 'false';
    this.requestQueue = [];
    this.isProcessing = false;
    this.queueDelay = 500;

    const proxyUrl = process.env.HTTP_PROXY || process.env.HTTPS_PROXY;
    if (proxyUrl) {
      console.log(`[Translation] 使用代理: ${proxyUrl}`);
      this.httpsAgent = new HttpsProxyAgent(proxyUrl);
    } else {
      console.log('[Translation] 未配置代理，将使用直连');
      this.httpsAgent = undefined;
    }
  }

  async translateToChinese(text, retryCount = 0) {
    if (!text || text.trim() === '') {
      return '';
    }

    if (!this.enableTranslation) {
      console.log('[Translation] 翻译功能已禁用，使用原文');
      return text;
    }

    try {
      console.log(`[Translation] 开始翻译: ${text.substring(0, 50)}...`);
      const axiosConfig = {
        params: {
          client: 'gtx',
          sl: 'en',
          tl: 'zh-CN',
          dt: 't',
          q: text
        },
        timeout: this.timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      };

      if (this.httpsAgent) {
        axiosConfig.httpsAgent = this.httpsAgent;
      }

      const response = await axios.get(this.baseUrl, axiosConfig);

      console.log(`[Translation] API响应状态: ${response.status}`);
      console.log(`[Translation] API响应数据结构:`, JSON.stringify(response.data).substring(0, 200));

      if (!response.data || !response.data[0]) {
        console.error('[Translation] API响应数据格式错误');
        return text;
      }

      const translatedText = response.data[0].map(item => item[0]).join('');
      console.log(`[Translation] 翻译结果: ${translatedText.substring(0, 50)}...`);
      return translatedText;
    } catch (error) {
      if (retryCount < this.maxRetries) {
        const delay = 2000 * (retryCount + 1);
        console.log(`[Translation] 翻译失败，${delay}ms后重试 ${retryCount + 1}/${this.maxRetries}:`, error.message);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.translateToChinese(text, retryCount + 1);
      }
      console.error('[Translation] 翻译失败，使用原文:', error.message);
      return text;
    }
  }

  async translateCategory(category) {
    const categoryMap = {
      'general': '综合',
      'forex': '外汇',
      'crypto': '加密货币',
      'merger': '并购',
      'market': '市场动态',
      'company': '公司新闻',
      'industry': '行业资讯',
      'other': '其他'
    };

    return categoryMap[category] || category;
  }

  async translateNewsItem(newsItem) {
    console.log(`[Translation] 开始翻译新闻: ${newsItem.headline.substring(0, 50)}...`);

    const titleCn = await this.translateToChinese(newsItem.headline);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const contentCn = await this.translateToChinese(newsItem.summary);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const categoryCn = await this.translateCategory(newsItem.category);

    console.log(`[Translation] 翻译完成: ${titleCn.substring(0, 30)}...`);

    return {
      ...newsItem,
      title_cn: titleCn,
      content_cn: contentCn,
      category_cn: categoryCn
    };
  }
}
