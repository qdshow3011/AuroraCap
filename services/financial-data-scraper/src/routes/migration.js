import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = Router();

router.post('/add-image-url', async (req, res) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ 
        success: false, 
        error: 'Missing SUPABASE_URL or SUPABASE_KEY' 
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[Migration] 开始添加image_url字段到news表...');

    const { data, error } = await supabase
      .from('news')
      .select('image_url')
      .limit(1);

    if (error && error.message.includes('column "image_url" does not exist')) {
      console.log('[Migration] image_url字段不存在，需要添加');
      
      const { error: alterError } = await supabase.rpc('exec_sql', {
        sql: `
          ALTER TABLE news 
          ADD COLUMN IF NOT EXISTS image_url TEXT;
          
          COMMENT ON COLUMN news.image_url IS '新闻图片URL';
        `
      });

      if (alterError) {
        console.error('[Migration] 添加字段失败:', alterError);
        return res.status(500).json({ 
          success: false, 
          error: alterError.message 
        });
      }

      console.log('[Migration] 成功添加image_url字段');
      return res.json({ 
        success: true, 
        message: '成功添加image_url字段到news表' 
      });
    } else if (error) {
      console.error('[Migration] 检查字段失败:', error);
      return res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    } else {
      console.log('[Migration] image_url字段已存在');
      return res.json({ 
        success: true, 
        message: 'image_url字段已存在' 
      });
    }
  } catch (error) {
    console.error('[Migration] 执行迁移失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

router.post('/add-unique-constraint', async (req, res) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ 
        success: false, 
        error: 'Missing SUPABASE_URL or SUPABASE_KEY' 
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[Migration] 开始为news表的source_id字段添加唯一约束...');

    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE news 
        ADD CONSTRAINT IF NOT EXISTS news_source_id_unique UNIQUE (source_id);
        
        COMMENT ON CONSTRAINT news_source_id_unique ON news IS '确保source_id字段的唯一性，避免重复新闻';
      `
    });

    if (error) {
      console.error('[Migration] 添加唯一约束失败:', error);
      return res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }

    console.log('[Migration] 成功添加唯一约束');
    return res.json({ 
      success: true, 
      message: '成功为news表的source_id字段添加唯一约束' 
    });
  } catch (error) {
    console.error('[Migration] 执行迁移失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

router.post('/reset-news-id-sequence', async (req, res) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ 
        success: false, 
        error: 'Missing SUPABASE_URL or SUPABASE_KEY' 
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[Migration] 开始重置news表的id序列...');

    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT setval(
          pg_get_serial_sequence('news', 'id'),
          COALESCE((SELECT MAX(id) FROM news), 0) + 1,
          false
        );
      `
    });

    if (error) {
      console.error('[Migration] 重置id序列失败:', error);
      return res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }

    console.log('[Migration] 成功重置news表的id序列');
    return res.json({ 
      success: true, 
      message: '成功重置news表的id序列，下次插入将从当前最大id+1开始' 
    });
  } catch (error) {
    console.error('[Migration] 执行迁移失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

router.post('/setup-new-id-auto-increment', async (req, res) => {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ 
        success: false, 
        error: 'Missing SUPABASE_URL or SUPABASE_KEY' 
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[Migration] 开始设置new_id字段的自动递增功能...');

    const sqlStatements = [
      `CREATE SEQUENCE IF NOT EXISTS news_new_id_seq START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;`,
      `UPDATE news SET new_id = subquery.row_num FROM (SELECT id, ROW_NUMBER() OVER (ORDER BY published_at DESC NULLS LAST, created_at DESC) as row_num FROM news WHERE new_id IS NULL) subquery WHERE news.id = subquery.id;`,
      `ALTER TABLE news ALTER COLUMN new_id SET DEFAULT nextval('news_new_id_seq');`,
      `ALTER SEQUENCE news_new_id_seq OWNED BY news.new_id;`,
      `SELECT setval('news_new_id_seq', COALESCE((SELECT MAX(new_id) FROM news), 0) + 1, false);`
    ];

    for (const sql of sqlStatements) {
      console.log('[Migration] 执行SQL:', sql.substring(0, 50) + '...');
      
      const { error } = await supabase.rpc('exec_sql', { sql });
      
      if (error) {
        console.error('[Migration] 执行SQL失败:', error);
        return res.status(500).json({ 
          success: false, 
          error: error.message,
          sql: sql
        });
      }
    }

    const { data: verifyData, error: verifyError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          '当前最大new_id' as description,
          COALESCE(MAX(new_id), 0) as value
        FROM news
        UNION ALL
        SELECT 
          '序列当前值' as description,
          last_value as value
        FROM news_new_id_seq;
      `
    });

    if (verifyError) {
      console.error('[Migration] 验证失败:', verifyError);
    } else {
      console.log('[Migration] 验证结果:', verifyData);
    }

    console.log('[Migration] 成功设置new_id字段的自动递增功能');
    return res.json({ 
      success: true, 
      message: '成功设置new_id字段的自动递增功能，新插入的新闻将自动获得连续的new_id：1、2、3、4、5...',
      verification: verifyData
    });
  } catch (error) {
    console.error('[Migration] 执行迁移失败:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

export default router;
