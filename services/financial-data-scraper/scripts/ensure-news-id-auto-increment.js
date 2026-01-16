import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function executeMigration() {
  try {
    console.log('[Migration] 开始执行news表id自增迁移...');

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_KEY');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const migrationPath = join(__dirname, '../../supabase/migrations/20260106_ensure_news_id_auto_increment.sql');
    const sql = readFileSync(migrationPath, 'utf-8');

    console.log('[Migration] 读取迁移SQL文件成功');

    const { data, error } = await supabase.rpc('exec_sql', {
      sql: sql
    });

    if (error) {
      console.error('[Migration] 执行迁移失败:', error);
      throw error;
    }

    console.log('[Migration] 迁移执行成功');
    console.log('[Migration] news表的id字段现在已设置为自动递增');
    console.log('[Migration] 新插入的新闻将自动获得连续的ID：1、2、3、4、5...');
    
    process.exit(0);
  } catch (error) {
    console.error('[Migration] 执行迁移失败:', error.message);
    process.exit(1);
  }
}

executeMigration();
