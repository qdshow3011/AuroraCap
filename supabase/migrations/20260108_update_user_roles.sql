-- 更新用户角色系统，将角色改为英文，并删除观察员角色

-- 创建user_roles表（如果不存在）
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 插入新的角色数据
INSERT INTO user_roles (name, code, description) VALUES
('管理员', 'admin', '系统管理员，拥有最高权限'),
('合伙人', 'partner', '合伙人用户'),
('客户', 'client', '普通客户用户'),
('服务员', 'waiter', '服务员用户，辅助管理')
ON CONFLICT (code) DO NOTHING;

-- 更新现有用户的角色为英文
UPDATE users SET role = 'admin' WHERE role IN ('管理员', 'admin');
UPDATE users SET role = 'partner' WHERE role IN ('合伙人', 'partner');
UPDATE users SET role = 'client' WHERE role IN ('客户', 'client');
UPDATE users SET role = 'waiter' WHERE role IN ('服务员', 'waiter');

-- 将观察员角色的用户改为服务员角色
UPDATE users SET role = 'waiter' WHERE role IN ('观察员', 'observer');

-- 更新角色字段为枚举类型
ALTER TABLE users ALTER COLUMN role TYPE TEXT;

-- 添加外键约束（如果需要）
-- ALTER TABLE users ADD CONSTRAINT fk_user_role FOREIGN KEY (role) REFERENCES user_roles(code);
