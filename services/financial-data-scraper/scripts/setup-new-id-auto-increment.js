import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

async function setupNewIdAutoIncrement() {
  let client;
  try {
    console.log('[Migration] 开始设置new_id字段的自动递增功能...');

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_KEY');
    }

    const connectionString = supabaseUrl.replace('https://', 'postgresql://') + '?pgbouncer=true';
    
    const pool = new Pool({
      connectionString: connectionString,
      password: supabaseKey
    });

    client = await pool.connect();

    console.log('[Migration] 步骤1: 创建序列...');
    await client.query(`CREATE SEQUENCE IF NOT EXISTS news_new_id_seq START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;`);
    console.log('[Migration] 序列创建成功');

    console.log('[Migration] 步骤2: 为现有记录分配new_id值...');
    const updateResult = await client.query(`
      UPDATE news 
      SET new_id = subquery.row_num
      FROM (
        SELECT 
          id,
          ROW_NUMBER() OVER (ORDER BY published_at DESC NULLS LAST, created_at DESC) as row_num
        FROM news
        WHERE new_id IS NULL
      ) subquery
      WHERE news.id = subquery.id;
    `);
    console.log(`[Migration] 更新了 ${updateResult.rowCount} 条记录`);

    console.log('[Migration] 步骤3: 设置new_id的默认值为序列的下一个值...');
    await client.query(`ALTER TABLE news ALTER COLUMN new_id SET DEFAULT nextval('news_new_id_seq');`);
    console.log('[Migration] 默认值设置成功');

    console.log('[Migration] 步骤4: 设置序列的所有者...');
    await client.query(`ALTER SEQUENCE news_new_id_seq OWNED BY news.new_id;`);
    console.log('[Migration] 序列所有者设置成功');

    console.log('[Migration] 步骤5: 重置序列到当前最大new_id + 1...');
    await client.query(`SELECT setval('news_new_id_seq', COALESCE((SELECT MAX(new_id) FROM news), 0) + 1, false);`);
    console.log('[Migration] 序列重置成功');

    console.log('[Migration] 步骤6: 验证设置...');
    const verifyResult = await client.query(`
      SELECT 
        '当前最大new_id' as description,
        COALESCE(MAX(new_id), 0) as value
      FROM news
      UNION ALL
      SELECT 
        '序列当前值' as description,
        last_value as value
      FROM news_new_id_seq;
    `);
    
    console.log('[Migration] 验证结果:');
    verifyResult.rows.forEach(row => {
      console.log(`  ${row.description}: ${row.value}`);
    });

    console.log('[Migration] 完成！new_id字段已设置为自动递增');
    console.log('[Migration] 新插入的新闻将自动获得连续的new_id：1、2、3、4、5...');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('[Migration] 执行失败:', error.message);
    console.error('[Migration] 错误详情:', error);
    process.exit(1);
  }
}

setupNewIdAutoIncrement();
