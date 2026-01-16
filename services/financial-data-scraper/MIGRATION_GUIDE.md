# News表ID迁移指南

## 概述
此迁移将news表的id从UUID类型转换为整数自增类型（1、2、3、4……）。

## 迁移步骤

### 方法1: 使用Supabase SQL编辑器（推荐）

1. 登录到 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择您的项目
3. 在左侧导航栏中，点击 "SQL Editor"
4. 点击 "New query"
5. 复制以下SQL语句并粘贴到编辑器中：
   ```sql
   -- 将news表的id从UUID转换为整数自增
   -- 执行此迁移前请确保已备份数据

   -- 步骤1: 创建新的news表，使用整数ID
   CREATE TABLE IF NOT EXISTS news_new (
     id BIGSERIAL PRIMARY KEY,
     title TEXT NOT NULL,
     content TEXT,
     category TEXT DEFAULT 'market',
     status TEXT DEFAULT 'published',
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     published_at TIMESTAMP WITH TIME ZONE,
     title_cn TEXT,
     content_cn TEXT,
     category_cn TEXT,
     image_url TEXT,
     source TEXT,
     source_id TEXT,
     url TEXT
   );

   -- 步骤2: 复制数据到新表，按published_at降序排列，ID从1开始
   INSERT INTO news_new (id, title, content, category, status, created_at, updated_at, published_at, title_cn, content_cn, category_cn, image_url, source, source_id, url)
   SELECT 
     ROW_NUMBER() OVER (ORDER BY published_at DESC NULLS LAST) as id,
     title,
     content,
     category,
     status,
     created_at,
     updated_at,
     published_at,
     title_cn,
     content_cn,
     category_cn,
     image_url,
     source,
     source_id,
     url
   FROM news;

   -- 步骤3: 删除旧表
   DROP TABLE news;

   -- 步骤4: 重命名新表为news
   ALTER TABLE news_new RENAME TO news;

   -- 步骤5: 添加唯一约束
   ALTER TABLE news 
   ADD CONSTRAINT IF NOT EXISTS news_source_id_unique UNIQUE (source_id);

   -- 步骤6: 重置序列，确保下次插入从正确的ID开始
   SELECT setval(
     pg_get_serial_sequence('news', 'id'),
     COALESCE((SELECT MAX(id) FROM news), 0) + 1,
     false
   );

   -- 步骤7: 添加注释
   COMMENT ON TABLE news IS '新闻表';
   COMMENT ON COLUMN news.id IS '新闻ID（整数自增）';
   COMMENT ON COLUMN news.title IS '新闻标题';
   COMMENT ON COLUMN news.content IS '新闻内容';
   COMMENT ON COLUMN news.category IS '新闻分类';
   COMMENT ON COLUMN news.status IS '新闻状态';
   COMMENT ON COLUMN news.title_cn IS '标题（中文翻译）';
   COMMENT ON COLUMN news.content_cn IS '内容（中文翻译）';
   COMMENT ON COLUMN news.category_cn IS '分类（中文翻译）';
   COMMENT ON COLUMN news.image_url IS '新闻图片URL';
   COMMENT ON COLUMN news.source IS '新闻来源';
   COMMENT ON COLUMN news.source_id IS '新闻来源ID';
   COMMENT ON COLUMN news.url IS '新闻链接';
   ```
6. 点击 "Run" 按钮执行SQL
7. 检查执行结果，确保没有错误

### 方法2: 使用Supabase CLI

如果您已安装Supabase CLI，可以运行以下命令：

```bash
supabase db push
```

这将自动应用所有待执行的迁移文件。

## 验证迁移

执行迁移后，您可以通过以下方式验证：

1. 在SQL编辑器中运行：
   ```sql
   SELECT id, title, published_at FROM news ORDER BY id LIMIT 10;
   ```
   确认id是从1开始的连续整数。

2. 插入一条新记录：
   ```sql
   INSERT INTO news (title, content, category) 
   VALUES ('测试新闻', '这是一条测试新闻', 'market');
   ```
   确认新记录的id是正确的（应该是当前最大id+1）。

## 注意事项

1. **备份数据**: 在执行迁移前，请确保已备份重要数据
2. **停用服务**: 建议在迁移期间停用新闻同步服务，避免数据冲突
3. **外键关系**: 如果有其他表引用news表的id，需要更新这些外键关系
4. **应用代码**: 确保应用代码中处理id的部分兼容整数类型（通常不需要修改）

## 回滚

如果需要回滚此迁移，请执行以下SQL：

```sql
-- 创建回滚表（使用UUID）
CREATE TABLE IF NOT EXISTS news_rollback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  category TEXT DEFAULT 'market',
  status TEXT DEFAULT 'published',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE,
  title_cn TEXT,
  content_cn TEXT,
  category_cn TEXT,
  image_url TEXT,
  source TEXT,
  source_id TEXT,
  url TEXT
);

-- 复制数据
INSERT INTO news_rollback (title, content, category, status, created_at, updated_at, published_at, title_cn, content_cn, category_cn, image_url, source, source_id, url)
SELECT title, content, category, status, created_at, updated_at, published_at, title_cn, content_cn, category_cn, image_url, source, source_id, url
FROM news;

-- 删除新表
DROP TABLE news;

-- 重命名回滚表
ALTER TABLE news_rollback RENAME TO news;
```

## 迁移文件位置
`supabase/migrations/20260106_convert_news_id_to_integer.sql`
