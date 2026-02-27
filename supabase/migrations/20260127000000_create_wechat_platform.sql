-- 创建公众号表
CREATE TABLE IF NOT EXISTS wechat_official_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  avatar TEXT,
  cover_image TEXT,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_wechat_official_accounts_user_id ON wechat_official_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_wechat_official_accounts_name ON wechat_official_accounts(name);
CREATE INDEX IF NOT EXISTS idx_wechat_official_accounts_status ON wechat_official_accounts(status);

-- 添加注释
COMMENT ON TABLE wechat_official_accounts IS '公众号表';
COMMENT ON COLUMN wechat_official_accounts.id IS '公众号ID';
COMMENT ON COLUMN wechat_official_accounts.user_id IS '用户ID，关联users表';
COMMENT ON COLUMN wechat_official_accounts.name IS '公众号名称';
COMMENT ON COLUMN wechat_official_accounts.description IS '公众号描述';
COMMENT ON COLUMN wechat_official_accounts.avatar IS '公众号头像URL';
COMMENT ON COLUMN wechat_official_accounts.cover_image IS '公众号封面图URL';
COMMENT ON COLUMN wechat_official_accounts.status IS '公众号状态（active/inactive）';
COMMENT ON COLUMN wechat_official_accounts.created_at IS '创建时间';
COMMENT ON COLUMN wechat_official_accounts.updated_at IS '更新时间';

-- 创建关注表
CREATE TABLE IF NOT EXISTS account_follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES wechat_official_accounts(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, account_id)
);

-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_account_follows_user_id ON account_follows(user_id);
CREATE INDEX IF NOT EXISTS idx_account_follows_account_id ON account_follows(account_id);

-- 添加注释
COMMENT ON TABLE account_follows IS '公众号关注表';
COMMENT ON COLUMN account_follows.id IS '关注记录ID';
COMMENT ON COLUMN account_follows.user_id IS '用户ID，关联users表';
COMMENT ON COLUMN account_follows.account_id IS '公众号ID，关联wechat_official_accounts表';
COMMENT ON COLUMN account_follows.created_at IS '关注时间';

-- 扩展文章表，添加必要字段
ALTER TABLE internal_references
ADD COLUMN account_id UUID REFERENCES wechat_official_accounts(id) ON DELETE SET NULL,
ADD COLUMN read_count INTEGER DEFAULT 0,
ADD COLUMN like_count INTEGER DEFAULT 0,
ADD COLUMN comment_count INTEGER DEFAULT 0;

-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_internal_references_account_id ON internal_references(account_id);
CREATE INDEX IF NOT EXISTS idx_internal_references_read_count ON internal_references(read_count);
CREATE INDEX IF NOT EXISTS idx_internal_references_like_count ON internal_references(like_count);

-- 创建文章留言表
CREATE TABLE IF NOT EXISTS article_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID REFERENCES internal_references(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES article_comments(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'approved',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_article_comments_article_id ON article_comments(article_id);
CREATE INDEX IF NOT EXISTS idx_article_comments_user_id ON article_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_article_comments_parent_id ON article_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_article_comments_status ON article_comments(status);

-- 添加注释
COMMENT ON TABLE article_comments IS '文章留言表';
COMMENT ON COLUMN article_comments.id IS '留言ID';
COMMENT ON COLUMN article_comments.article_id IS '文章ID，关联internal_references表';
COMMENT ON COLUMN article_comments.user_id IS '用户ID，关联users表';
COMMENT ON COLUMN article_comments.content IS '留言内容';
COMMENT ON COLUMN article_comments.parent_id IS '父留言ID，用于回复功能';
COMMENT ON COLUMN article_comments.status IS '留言状态（approved/pending/spam）';
COMMENT ON COLUMN article_comments.created_at IS '创建时间';

-- 创建触发器以自动更新 updated_at 字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 为公众号表添加更新触发器
CREATE TRIGGER update_wechat_official_accounts_updated_at
  BEFORE UPDATE ON wechat_official_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 创建触发器以更新文章的评论数
CREATE OR REPLACE FUNCTION update_article_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE internal_references
    SET comment_count = comment_count + 1
    WHERE id = NEW.article_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE internal_references
    SET comment_count = GREATEST(0, comment_count - 1)
    WHERE id = OLD.article_id;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 为留言表添加插入和删除触发器
CREATE TRIGGER update_article_comment_count_after_insert
  AFTER INSERT ON article_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_article_comment_count();

CREATE TRIGGER update_article_comment_count_after_delete
  AFTER DELETE ON article_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_article_comment_count();
