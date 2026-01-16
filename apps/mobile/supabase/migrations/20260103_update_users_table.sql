-- 更新用户表结构，添加身份证号/护照号码和邀请码字段

-- 1. 添加身份证号/护照号码字段
ALTER TABLE users
ADD COLUMN IF NOT EXISTS id_number TEXT;

-- 2. 添加邀请码字段
ALTER TABLE users
ADD COLUMN IF NOT EXISTS invite_code TEXT;

-- 3. 添加手机号码字段（如果不存在）
ALTER TABLE users
ADD COLUMN IF NOT EXISTS phone TEXT;

-- 4. 更新现有记录的id_number和phone，避免约束冲突
-- 先为所有NULL的id_number设置值
UPDATE users SET id_number = CONCAT('temp_', id) WHERE id_number IS NULL;

-- 为所有NULL的phone设置唯一值
UPDATE users 
SET phone = CONCAT('130', LPAD(ABS((('x' || SUBSTRING(md5(id::TEXT), 1, 8))::BIT(32))::INT)::TEXT, 8, '0')) 
WHERE phone IS NULL;

-- 处理可能的重复phone值
WITH numbered AS (
    SELECT id, phone, 
           ROW_NUMBER() OVER (PARTITION BY phone ORDER BY id) as rn
    FROM users
)
UPDATE users
SET phone = CONCAT('130', LPAD((ABS((('x' || SUBSTRING(md5(users.id::TEXT), 1, 8))::BIT(32))::INT) + numbered.rn * 1000000)::TEXT, 8, '0'))
FROM numbered
WHERE users.id = numbered.id AND numbered.rn > 1;

-- 5. 设置身份证号/护照号码为必填字段
ALTER TABLE users
ALTER COLUMN id_number SET NOT NULL;

-- 6. 设置手机号码为必填字段
ALTER TABLE users
ALTER COLUMN phone SET NOT NULL;

-- 7. 添加唯一约束，确保身份证号/护照号码不重复
ALTER TABLE users
ADD CONSTRAINT users_id_number_unique UNIQUE (id_number);

-- 8. 添加唯一约束，确保手机号码不重复
ALTER TABLE users
ADD CONSTRAINT users_phone_unique UNIQUE (phone);