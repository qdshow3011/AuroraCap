import { NewsSyncService } from './news-sync-service.js';

export class NewsScheduler {
  constructor(supabaseUrl, supabaseKey, finnhubApiKey) {
    this.newsSyncService = new NewsSyncService(supabaseUrl, supabaseKey, finnhubApiKey);
    this.intervalId = null;
    this.isRunning = false;
  }

  start(intervalMinutes = 1) {
    if (this.isRunning) {
      console.log('[NewsScheduler] 定时任务已在运行');
      return;
    }

    console.log(`[NewsScheduler] 启动定时任务，间隔: ${intervalMinutes} 分钟`);
    this.isRunning = true;

    this.syncNews();

    this.intervalId = setInterval(() => {
      this.syncNews();
    }, intervalMinutes * 60 * 1000);
  }

  stop() {
    if (!this.isRunning) {
      console.log('[NewsScheduler] 定时任务未运行');
      return;
    }

    console.log('[NewsScheduler] 停止定时任务');
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async syncNews() {
    try {
      console.log('[NewsScheduler] 开始同步新闻...');
      const result = await this.newsSyncService.syncNews('general', 3);
      
      if (result.success) {
        console.log(`[NewsScheduler] 同步成功，保存了 ${result.saved} 条新闻`);
      } else {
        console.error(`[NewsScheduler] 同步失败: ${result.error}`);
      }
    } catch (error) {
      console.error('[NewsScheduler] 同步新闻时发生错误:', error.message);
    }
  }
}
