-- 数据库迁移脚本：将products表中的name字段改为name_cn，并增加name_en字段

-- 1. 先将现有的name字段重命名为name_cn
ALTER TABLE products RENAME COLUMN name TO name_cn;

-- 2. 增加name_en字段，默认为空字符串
ALTER TABLE products ADD COLUMN name_en VARCHAR(255) DEFAULT '' NOT NULL;

-- 3. 可选：更新现有记录的name_en字段（如果有英文名称数据）
-- UPDATE products SET name_en = <英文名称> WHERE id = <记录ID>;

-- 4. 查看表结构，确认变更是否成功
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'products';
