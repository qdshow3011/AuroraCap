import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addImageUrlColumn() {
  try {
    console.log('开始添加image_url字段到news表...');

    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE news 
        ADD COLUMN IF NOT EXISTS image_url TEXT;
        
        COMMENT ON COLUMN news.image_url IS '新闻图片URL';
      `
    });

    if (error) {
      console.error('添加字段失败:', error);
      process.exit(1);
    }

    console.log('成功添加image_url字段到news表');
  } catch (error) {
    console.error('执行迁移失败:', error);
    process.exit(1);
  }
}

addImageUrlColumn();
