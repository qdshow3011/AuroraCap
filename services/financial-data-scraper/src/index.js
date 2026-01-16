import express from 'express';
import { FinancialDataService } from './financial-data-service.js';
import { NewsSyncService } from './news-sync-service.js';
import { NewsScheduler } from './news-scheduler.js';
import migrationRouter from './routes/migration.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

app.use(express.json());

const corsMiddleware = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Max-Age', '86400');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
};

app.use(corsMiddleware);

app.use('/api/migration', migrationRouter);

let newsScheduler = null;

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'financial-data-scraper',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.get('/api/indices', async (req, res) => {
  try {
    console.log('[API] 收到获取所有指数数据的请求');
    
    const tiingoApiKey = process.env.TIINGO_API_KEY;
    const cloudflareWorkerUrl = process.env.CLOUDFLARE_WORKER_URL;
    
    if (!tiingoApiKey) {
      return res.status(500).json({
        success: false,
        error: 'Tiingo API key not configured'
      });
    }
    
    const service = new FinancialDataService(tiingoApiKey, cloudflareWorkerUrl);
    const result = await service.fetchAllIndices();
    
    res.json(result);
  } catch (error) {
    console.error('[API] 获取指数数据失败:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/indices/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    console.log(`[API] 收到获取指数 ${symbol} 数据的请求`);
    
    const tiingoApiKey = process.env.TIINGO_API_KEY;
    const cloudflareWorkerUrl = process.env.CLOUDFLARE_WORKER_URL;
    
    if (!tiingoApiKey) {
      return res.status(500).json({
        success: false,
        error: 'Tiingo API key not configured'
      });
    }
    
    const service = new FinancialDataService(tiingoApiKey, cloudflareWorkerUrl);
    const result = await service.fetchSingleIndex(symbol);
    
    res.json(result);
  } catch (error) {
    console.error('[API] 获取指数数据失败:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/indices/list', (req, res) => {
  const tiingoApiKey = process.env.TIINGO_API_KEY;
  const cloudflareWorkerUrl = process.env.CLOUDFLARE_WORKER_URL;
  
  const service = new FinancialDataService(tiingoApiKey, cloudflareWorkerUrl);
  const indices = service.getIndicesList();
  
  res.json({
    success: true,
    count: indices.length,
    data: indices
  });
});

app.post('/api/indices/sync', async (req, res) => {
  try {
    console.log('[API] 收到同步指数数据的请求');
    
    const { symbols } = req.body;
    
    const tiingoApiKey = process.env.TIINGO_API_KEY;
    const cloudflareWorkerUrl = process.env.CLOUDFLARE_WORKER_URL;
    
    if (!tiingoApiKey) {
      return res.status(500).json({
        success: false,
        error: 'Tiingo API key not configured'
      });
    }
    
    const service = new FinancialDataService(tiingoApiKey, cloudflareWorkerUrl);
    
    let result;
    if (symbols && Array.isArray(symbols) && symbols.length > 0) {
      const promises = symbols.map(symbol => service.fetchSingleIndex(symbol));
      const results = await Promise.allSettled(promises);
      
      const successfulResults = results
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value.data);
      
      const failedResults = results
        .filter(r => r.status === 'rejected')
        .map(r => r.reason.message);
      
      result = {
        success: true,
        count: successfulResults.length,
        failed: failedResults.length,
        data: successfulResults,
        timestamp: new Date().toISOString()
      };
    } else {
      result = await service.fetchAllIndices();
    }
    
    res.json(result);
  } catch (error) {
    console.error('[API] 同步指数数据失败:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.post('/api/news/sync', async (req, res) => {
  try {
    console.log('[API] 收到同步新闻的请求');
    
    const { category, limit } = req.body;
    
    const finnhubApiKey = process.env.FINNHUB_API_KEY;
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    
    if (!finnhubApiKey) {
      return res.status(500).json({
        success: false,
        error: 'Finnhub API key not configured'
      });
    }
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        success: false,
        error: 'Supabase credentials not configured'
      });
    }
    
    const newsSyncService = new NewsSyncService(supabaseUrl, supabaseKey, finnhubApiKey);
    const result = await newsSyncService.syncNews(category, limit);
    
    res.json(result);
  } catch (error) {
    console.error('[API] 同步新闻失败:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/news', async (req, res) => {
  try {
    console.log('[API] 收到获取新闻的请求');
    
    const { limit } = req.query;
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        success: false,
        error: 'Supabase credentials not configured'
      });
    }
    
    const newsSyncService = new NewsSyncService(supabaseUrl, supabaseKey, '');
    const result = await newsSyncService.getLatestNews(parseInt(limit) || 20);
    
    res.json(result);
  } catch (error) {
    console.error('[API] 获取新闻失败:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.post('/api/news/scheduler/start', async (req, res) => {
  try {
    console.log('[API] 收到启动新闻定时任务的请求');
    
    if (newsScheduler && newsScheduler.isRunning) {
      return res.json({
        success: true,
        message: '新闻定时任务已在运行',
        isRunning: true
      });
    }
    
    const finnhubApiKey = process.env.FINNHUB_API_KEY;
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    
    if (!finnhubApiKey) {
      return res.status(500).json({
        success: false,
        error: 'Finnhub API key not configured'
      });
    }
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({
        success: false,
        error: 'Supabase credentials not configured'
      });
    }
    
    if (!newsScheduler) {
      newsScheduler = new NewsScheduler(supabaseUrl, supabaseKey, finnhubApiKey);
    }
    
    const intervalMinutes = parseInt(process.env.NEWS_SYNC_INTERVAL) || 1;
    newsScheduler.start(intervalMinutes);
    
    res.json({
      success: true,
      message: `新闻定时任务已启动，间隔: ${intervalMinutes} 分钟`,
      isRunning: true,
      intervalMinutes: intervalMinutes
    });
  } catch (error) {
    console.error('[API] 启动新闻定时任务失败:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.post('/api/news/scheduler/stop', async (req, res) => {
  try {
    console.log('[API] 收到停止新闻定时任务的请求');
    
    if (!newsScheduler) {
      return res.json({
        success: true,
        message: '新闻定时任务未初始化',
        isRunning: false
      });
    }
    
    newsScheduler.stop();
    
    res.json({
      success: true,
      message: '新闻定时任务已停止',
      isRunning: false
    });
  } catch (error) {
    console.error('[API] 停止新闻定时任务失败:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/news/scheduler/status', async (req, res) => {
  try {
    console.log('[API] 收到获取新闻定时任务状态的请求');
    
    const isRunning = newsScheduler ? newsScheduler.isRunning : false;
    const intervalMinutes = parseInt(process.env.NEWS_SYNC_INTERVAL) || 1;
    
    res.json({
      success: true,
      isRunning: isRunning,
      intervalMinutes: intervalMinutes,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[API] 获取新闻定时任务状态失败:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    availableEndpoints: [
      'GET /health',
      'GET /api/indices',
      'GET /api/indices/:symbol',
      'GET /api/indices/list',
      'POST /api/indices/sync',
      'POST /api/news/sync',
      'GET /api/news',
      'POST /api/news/scheduler/start',
      'POST /api/news/scheduler/stop',
      'GET /api/news/scheduler/status'
    ]
  });
});

app.use((err, req, res, next) => {
  console.error('[API] 服务器错误:', err);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`[Server] 金融数据抓取服务已启动`);
  console.log(`[Server] 监听端口: ${PORT}`);
  console.log(`[Server] 健康检查: http://localhost:${PORT}/health`);
  console.log(`[Server] API端点: http://localhost:${PORT}/api/indices`);
  console.log(`[Server] Tiingo API Key: ${process.env.TIINGO_API_KEY ? '已配置' : '未配置'}`);
  console.log(`[Server] Cloudflare Worker: ${process.env.CLOUDFLARE_WORKER_URL ? '已配置' : '未配置'}`);
  console.log(`[Server] Finnhub API Key: ${process.env.FINNHUB_API_KEY ? '已配置' : '未配置'}`);
  console.log(`[Server] Supabase: ${process.env.SUPABASE_URL ? '已配置' : '未配置'}`);
  console.log(`[Server] 新闻定时任务: 需要通过API手动启动`);
});