import crypto from 'crypto';
import axios from 'axios';

export class TencentTranslationService {
  constructor() {
    this.appId = process.env.TENCENT_APP_ID || '';
    this.appKey = process.env.TENCENT_APP_KEY || '';
    this.baseUrl = 'https://api.fanyi.qq.com/api/translate/v2/index';
    this.enableTranslation = process.env.ENABLE_TRANSLATION !== 'false';
    this.timeout = 10000;
  }

  generateSign(text, salt) {
    const str = this.appId + text + salt + this.appKey;
    return crypto.createHash('md5').update(str).digest('hex');
  }

  async translateToChinese(text, retryCount = 0) {
    if (!text || text.trim() === '') {
      return '';
    }

    if (!this.enableTranslation) {
      return text;
    }

    if (!this.appId || !this.appKey) {
      console.error('[TencentTranslation] 腾讯翻译API密钥未配置');
      return text;
    }

    try {
      const salt = Date.now().toString();
      const sign = this.generateSign(text, salt);

      const response = await axios.get(this.baseUrl, {
        params: {
          q: text,
          from: 'en',
          to: 'zh',
          appid: this.appId,
          salt: salt,
          sign: sign
        },
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      if (response.data.errorCode !== '0') {
        throw new Error(response.data.errorMsg || '翻译失败');
      }

      const translatedText = response.data.translateResult
        .map(item => item.map(t => t.tgt).join(''))
        .join('');

      return translatedText;
    } catch (error) {
      if (retryCount < 3) {
        const delay = 1000 * (retryCount + 1);
        console.log(`[TencentTranslation] 翻译失败，${delay}ms后重试 ${retryCount + 1}/3:`, error.message);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.translateToChinese(text, retryCount + 1);
      }
      console.error('[TencentTranslation] 翻译失败，使用原文:', error.message);
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
      'other': '其他',
      'top news': '头条新闻'
    };

    return categoryMap[category] || category;
  }

  async translateNewsItem(newsItem) {
    console.log(`[TencentTranslation] 开始翻译新闻: ${newsItem.headline.substring(0, 50)}...`);

    const titleCn = await this.translateToChinese(newsItem.headline);
    await new Promise(resolve => setTimeout(resolve, 500));

    const contentCn = await this.translateToChinese(newsItem.summary);
    await new Promise(resolve => setTimeout(resolve, 500));

    const categoryCn = await this.translateCategory(newsItem.category);

    console.log(`[TencentTranslation] 翻译完成: ${titleCn.substring(0, 30)}...`);

    return {
      ...newsItem,
      title_cn: titleCn,
      content_cn: contentCn,
      category_cn: categoryCn
    };
  }
}
