import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;

async function resetNewsIdSequence() {
  try {
    console.log('[Migration] 开始重置news表的id序列...');

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_KEY');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const connectionString = supabaseUrl.replace('https://', 'postgresql://') + '?pgbouncer=true';
    
    const pool = new Pool({
      connectionString: connectionString,
      password: supabaseKey
    });

    const client = await pool.connect();

    try {
      const result = await client.query(`
        SELECT setval(
          pg_get_serial_sequence('news', 'id'),
          COALESCE((SELECT MAX(id) FROM news), 0) + 1,
          false
        );
      `);

      console.log('[Migration] 成功重置news表的id序列');
      console.log('[Migration] 下次插入将从当前最大id+1开始');
      
      const maxIdResult = await client.query('SELECT MAX(id) as max_id FROM news');
      const maxId = maxIdResult.rows[0].max_id || 0;
      console.log(`[Migration] 当前最大id: ${maxId}`);
      console.log(`[Migration] 下次插入的id将是: ${maxId + 1}`);
      
    } finally {
      client.release();
    }

    await pool.end();

    console.log('[Migration] 完成');
    process.exit(0);
  } catch (error) {
    console.error('[Migration] 执行迁移失败:', error.message);
    process.exit(1);
  }
}

resetNewsIdSequence();
