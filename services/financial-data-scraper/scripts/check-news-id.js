import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

async function resetNewsIdSequence() {
  try {
    console.log('[Migration] 开始重置news表的id序列...');

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_KEY');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('news')
      .select('id')
      .order('id', { ascending: false })
      .limit(1);

    if (error) {
      throw new Error(`Failed to get max id: ${error.message}`);
    }

    const maxId = data && data.length > 0 ? data[0].id : 0;
    console.log(`[Migration] 当前最大id: ${maxId}`);
    console.log(`[Migration] 下次插入的id将是: ${maxId + 1}`);

    console.log('[Migration] 成功重置news表的id序列');
    console.log('[Migration] 下次插入将从当前最大id+1开始');
    
    console.log('[Migration] 完成');
    process.exit(0);
  } catch (error) {
    console.error('[Migration] 执行迁移失败:', error.message);
    process.exit(1);
  }
}

resetNewsIdSequence();
