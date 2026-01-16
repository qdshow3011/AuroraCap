import { createClient } from '@supabase/supabase-js';
import { FinnhubNewsService } from './finnhub-news-service.js';
import { TranslationService } from './translation-service.js';

export class NewsSyncService {
  constructor(supabaseUrl, supabaseKey, finnhubApiKey) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.finnhubService = new FinnhubNewsService(finnhubApiKey);
    this.translationService = new TranslationService();
    
    this.categoryMap = {
      'top news': 'market',
      'general': 'other',
      'forex': 'market',
      'crypto': 'market',
      'merger': 'company',
      'market': 'market',
      'company': 'company',
      'industry': 'industry',
      'other': 'other'
    };
  }

  mapCategory(category) {
    return this.categoryMap[category] || 'other';
  }

  async syncNews(category = 'general', limit = 20) {
    try {
      console.log(`[NewsSync] 开始同步新闻，分类: ${category}, 限制: ${limit}`);

      const newsList = await this.finnhubService.getNews(category);
      console.log(`[NewsSync] 获取到 ${newsList.length} 条新闻`);

      const translatedNews = [];
      const savedNews = [];

      for (const newsItem of newsList.slice(0, limit)) {
        try {
          const translated = await this.translationService.translateNewsItem(newsItem);
          translatedNews.push(translated);

          const originalCategory = newsItem.category || 'other';
          const mappedCategory = this.mapCategory(originalCategory);
          
          const newsData = {
            title: newsItem.headline,
            content: newsItem.summary,
            category: mappedCategory,
            status: 'published',
            title_cn: translated.title_cn,
            content_cn: translated.content_cn,
            category_cn: translated.category_cn,
            source: 'finnhub',
            source_id: String(newsItem.id),
            image_url: newsItem.image,
            url: newsItem.url,
            published_at: new Date(newsItem.datetime * 1000).toISOString()
          };

          console.log(`[NewsSync] 准备保存新闻: source_id=${newsData.source_id}, title=${newsData.title}`);
          console.log(`[NewsSync] 新闻数据:`, JSON.stringify(newsData, null, 2));

          const { data: existingNews, error: checkError } = await this.supabase
            .from('news')
            .select('id')
            .eq('source_id', newsData.source_id)
            .maybeSingle();

          if (checkError) {
            console.error('[NewsSync] 检查新闻是否存在失败:', checkError.message);
            continue;
          }

          if (existingNews) {
            console.log(`[NewsSync] 新闻已存在，跳过: source_id=${newsData.source_id}`);
            continue;
          }

          const { data, error } = await this.supabase
            .from('news')
            .insert(newsData)
            .select();

          if (error) {
            console.error('[NewsSync] 保存新闻失败:', error.message);
            console.error('[NewsSync] 错误详情:', error);
          } else {
            savedNews.push(newsData);
            console.log(`[NewsSync] 成功保存新闻: ${newsData.title}, source_id=${newsData.source_id}`);
          }
        } catch (error) {
          console.error('[NewsSync] 处理新闻失败:', error.message);
        }
      }

      console.log(`[NewsSync] 同步完成，成功保存 ${savedNews.length} 条新闻`);
      return {
        success: true,
        total: newsList.length,
        saved: savedNews.length,
        data: savedNews
      };
    } catch (error) {
      console.error('[NewsSync] 同步新闻失败:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async getLatestNews(limit = 20) {
    try {
      const { data, error } = await this.supabase
        .from('news')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('[NewsSync] 获取最新新闻失败:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}
