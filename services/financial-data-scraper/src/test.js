import { FinancialDataService } from './financial-data-service.js';

const tiingoApiKey = process.env.TIINGO_API_KEY || 'demo';
const cloudflareWorkerUrl = process.env.CLOUDFLARE_WORKER_URL || '';

async function testService() {
  console.log('=== 金融数据抓取服务测试 ===\n');
  
  const service = new FinancialDataService(tiingoApiKey, cloudflareWorkerUrl);
  
  console.log('1. 测试获取指数列表');
  const indices = service.getIndicesList();
  console.log(`   找到 ${indices.length} 个指数:`);
  indices.forEach(index => {
    console.log(`   - ${index.symbol}: ${index.name}`);
  });
  console.log();
  
  console.log('2. 测试获取单个指数数据 (^GSPC)');
  try {
    const singleResult = await service.fetchSingleIndex('^GSPC');
    console.log('   成功:', JSON.stringify(singleResult, null, 2));
  } catch (error) {
    console.log('   失败:', error.message);
  }
  console.log();
  
  console.log('3. 测试获取所有指数数据');
  try {
    const allResult = await service.fetchAllIndices();
    console.log(`   成功获取 ${allResult.count} 个指数数据`);
    console.log(`   数据源: ${allResult.source}`);
    console.log(`   使用代理: ${allResult.useProxy ? '是' : '否'}`);
    console.log('   数据预览:');
    allResult.data.slice(0, 3).forEach(item => {
      console.log(`   - ${item.symbol}: ${item.price} (${item.change_percent > 0 ? '+' : ''}${item.change_percent.toFixed(2)}%)`);
    });
  } catch (error) {
    console.log('   失败:', error.message);
  }
  console.log();
  
  console.log('=== 测试完成 ===');
}

testService().catch(error => {
  console.error('测试失败:', error);
  process.exit(1);
});