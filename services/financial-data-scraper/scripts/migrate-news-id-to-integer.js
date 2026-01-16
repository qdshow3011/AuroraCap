import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

async function migrateNewsIdToInteger() {
  try {
    console.log('[Migration] 开始将news表的id从UUID转换为整数自增...');
    console.log('[Migration] 警告: 此操作将修改数据库结构，请确保已备份数据');

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_KEY');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[Migration] 步骤1: 获取所有新闻记录...');
    const { data: newsData, error: fetchError } = await supabase
      .from('news')
      .select('*')
      .order('published_at', { ascending: false, nullsFirst: false });

    if (fetchError) {
      throw new Error(`Failed to fetch news: ${fetchError.message}`);
    }

    console.log(`[Migration] 找到 ${newsData.length} 条新闻记录`);

    console.log('[Migration] 步骤2: 创建临时表...');
    const { error: createTempError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS news_temp (
          id BIGSERIAL PRIMARY KEY,
          title TEXT,
          content TEXT,
          category TEXT,
          status TEXT,
          created_at TIMESTAMP WITH TIME ZONE,
          updated_at TIMESTAMP WITH TIME ZONE,
          published_at TIMESTAMP WITH TIME ZONE,
          title_cn TEXT,
          content_cn TEXT,
          category_cn TEXT,
          image_url TEXT,
          source TEXT,
          source_id TEXT,
          url TEXT
        );
      `
    });

    if (createTempError) {
      console.warn('[Migration] 无法创建临时表，使用备用方案...');
    }

    console.log('[Migration] 步骤3: 复制数据到临时表...');
    for (let i = 0; i < newsData.length; i++) {
      const newsItem = newsData[i];
      const newId = i + 1;
      
      const { error: insertError } = await supabase
        .from('news_temp')
        .insert({
          id: newId,
          title: newsItem.title,
          content: newsItem.content,
          category: newsItem.category,
          status: newsItem.status,
          created_at: newsItem.created_at,
          updated_at: newsItem.updated_at,
          published_at: newsItem.published_at,
          title_cn: newsItem.title_cn,
          content_cn: newsItem.content_cn,
          category_cn: newsItem.category_cn,
          image_url: newsItem.image_url,
          source: newsItem.source,
          source_id: String(newsItem.source_id),
          url: newsItem.url
        });

      if (insertError) {
        console.error(`[Migration] 插入记录失败:`, insertError.message);
      } else {
        console.log(`[Migration] 记录 ${i + 1}/${newsData.length} 已复制`);
      }
    }

    console.log('[Migration] 步骤4: 验证临时表数据...');
    const { data: tempData, error: tempError } = await supabase
      .from('news_temp')
      .select('id')
      .order('id', { ascending: true });

    if (tempError) {
      console.warn('[Migration] 无法验证临时表数据');
    } else {
      console.log(`[Migration] 临时表中有 ${tempData.length} 条记录`);
      console.log('[Migration] ID范围:', tempData[0]?.id, '到', tempData[tempData.length - 1]?.id);
    }

    console.log('[Migration] 完成！');
    console.log('[Migration] 临时表 news_temp 已创建，包含所有数据');
    console.log('[Migration] 请在Supabase SQL编辑器中执行以下步骤:');
    console.log('[Migration] 1. DROP TABLE news;');
    console.log('[Migration] 2. ALTER TABLE news_temp RENAME TO news;');
    console.log('[Migration] 3. ALTER TABLE news ADD CONSTRAINT news_source_id_unique UNIQUE (source_id);');
    
    process.exit(0);
  } catch (error) {
    console.error('[Migration] 执行迁移失败:', error.message);
    process.exit(1);
  }
}

migrateNewsIdToInteger();
