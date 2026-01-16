-- Create system_messages table to store system-generated messages
CREATE TABLE IF NOT EXISTS system_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    audience_type VARCHAR(50) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_by VARCHAR(50) DEFAULT 'system',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create system_messages_status table to track message read status
CREATE TABLE IF NOT EXISTS system_messages_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES system_messages(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT unique_message_user UNIQUE (message_id, user_id)
);

-- Add RLS policies for system_messages table
ALTER TABLE system_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read system messages" ON system_messages
    FOR SELECT
    USING (true);

CREATE POLICY "Admins can create, update, delete system messages" ON system_messages
    FOR ALL
    USING (auth.role() = 'admin')
    WITH CHECK (auth.role() = 'admin');

CREATE POLICY "System can create messages" ON system_messages
    FOR INSERT
    WITH CHECK (created_by = 'system');

CREATE POLICY "Users can create messages for themselves" ON system_messages
    FOR INSERT
    USING (auth.uid() IS NOT NULL)
    WITH CHECK (user_id = auth.uid() OR audience_type = 'user');

-- Add RLS policies for system_messages_status table
ALTER TABLE system_messages_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own message status" ON system_messages_status
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own message status" ON system_messages_status
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_system_messages_category ON system_messages(category);
CREATE INDEX idx_system_messages_audience_type ON system_messages(audience_type);
CREATE INDEX idx_system_messages_user_id ON system_messages(user_id);
CREATE INDEX idx_system_messages_status_message_id ON system_messages_status(message_id);
CREATE INDEX idx_system_messages_status_user_id ON system_messages_status(user_id);