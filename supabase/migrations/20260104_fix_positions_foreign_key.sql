-- 修复positions表的外键约束，将fund_id从指向funds表改为指向products表

-- 删除现有的外键约束
ALTER TABLE positions DROP CONSTRAINT IF EXISTS positions_fund_id_fkey;

-- 添加新的外键约束，指向products表
ALTER TABLE positions ADD CONSTRAINT positions_fund_id_fkey FOREIGN KEY (fund_id) REFERENCES products(id) ON DELETE CASCADE;