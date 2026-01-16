import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

async function checkNewsTableStructure() {
  try {
    console.log('[Check] 开始检查news表结构...');

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_KEY');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('news')
      .select('*')
      .limit(3);

    if (error) {
      throw new Error(`Failed to get news data: ${error.message}`);
    }

    console.log('[Check] News表数据示例:');
    console.log(JSON.stringify(data, null, 2));

    console.log('[Check] 完成');
    process.exit(0);
  } catch (error) {
    console.error('[Check] 检查失败:', error.message);
    process.exit(1);
  }
}

checkNewsTableStructure();
