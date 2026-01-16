import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

async function convertNewsIdToInteger() {
  try {
    console.log('[Migration] 开始将news表的id从UUID转换为整数自增...');

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_KEY');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[Migration] 步骤1: 获取所有新闻记录...');
    const { data: newsData, error: fetchError } = await supabase
      .from('news')
      .select('id')
      .order('published_at', { ascending: false, nullsFirst: false });

    if (fetchError) {
      throw new Error(`Failed to fetch news: ${fetchError.message}`);
    }

    console.log(`[Migration] 找到 ${newsData.length} 条新闻记录`);

    console.log('[Migration] 步骤2: 创建新的整数id列...');
    const { error: addColumnError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE news 
        ADD COLUMN IF NOT EXISTS new_id BIGINT;
      `
    });

    if (addColumnError && !addColumnError.message.includes('function public.exec_sql')) {
      throw new Error(`Failed to add new_id column: ${addColumnError.message}`);
    }

    console.log('[Migration] 步骤3: 为每条记录分配新的整数id...');
    for (let i = 0; i < newsData.length; i++) {
      const newsItem = newsData[i];
      const newId = i + 1;
      
      const { error: updateError } = await supabase
        .from('news')
        .update({ new_id: newId })
        .eq('id', newsItem.id);

      if (updateError) {
        console.error(`[Migration] 更新记录 ${newsItem.id} 失败:`, updateError.message);
      } else {
        console.log(`[Migration] 记录 ${newsItem.id} -> new_id: ${newId}`);
      }
    }

    console.log('[Migration] 步骤4: 删除旧的UUID id列...');
    const { error: dropIdError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE news 
        DROP COLUMN IF EXISTS id;
      `
    });

    if (dropIdError && !dropIdError.message.includes('function public.exec_sql')) {
      console.warn('[Migration] 无法删除旧id列，需要手动执行SQL');
    }

    console.log('[Migration] 步骤5: 重命名new_id为id...');
    const { error: renameError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE news 
        RENAME COLUMN new_id TO id;
      `
    });

    if (renameError && !renameError.message.includes('function public.exec_sql')) {
      console.warn('[Migration] 无法重命名列，需要手动执行SQL');
    }

    console.log('[Migration] 步骤6: 将id设置为主键和自增...');
    const { error: primaryKeyError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE news 
        ADD PRIMARY KEY (id);
        
        CREATE SEQUENCE IF NOT EXISTS news_id_seq;
        
        ALTER TABLE news 
        ALTER COLUMN id 
        SET DEFAULT nextval('news_id_seq');
        
        ALTER SEQUENCE news_id_seq 
        RESTART WITH ${newsData.length + 1};
      `
    });

    if (primaryKeyError && !primaryKeyError.message.includes('function public.exec_sql')) {
      console.warn('[Migration] 无法设置主键和自增，需要手动执行SQL');
    }

    console.log('[Migration] 完成！');
    console.log(`[Migration] 已将 ${newsData.length} 条记录的id从UUID转换为整数`);
    console.log('[Migration] 下次插入的id将从', newsData.length + 1, '开始');
    
    process.exit(0);
  } catch (error) {
    console.error('[Migration] 执行迁移失败:', error.message);
    process.exit(1);
  }
}

convertNewsIdToInteger();
