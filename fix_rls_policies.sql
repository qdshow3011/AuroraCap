-- Update RLS policies for system_messages table to allow system-generated messages

-- First, drop existing policies if they exist
DROP POLICY IF EXISTS "Public can read system messages" ON system_messages;
DROP POLICY IF EXISTS "Admins can create, update, delete system messages" ON system_messages;
DROP POLICY IF EXISTS "System can create messages" ON system_messages;
DROP POLICY IF EXISTS "Users can create messages for themselves" ON system_messages;

-- Create new policies
CREATE POLICY "Public can read system messages" ON system_messages
    FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage system messages" ON system_messages
    FOR ALL
    USING (auth.role() = 'admin')
    WITH CHECK (auth.role() = 'admin');

-- Allow anyone to insert system-generated messages
CREATE POLICY "Allow system message creation" ON system_messages
    FOR INSERT
    WITH CHECK (created_by = 'system');

-- Allow authenticated users to insert messages for themselves
CREATE POLICY "Allow user message creation" ON system_messages
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Allow updates only by admins
CREATE POLICY "Allow admin updates" ON system_messages
    FOR UPDATE
    USING (auth.role() = 'admin')
    WITH CHECK (auth.role() = 'admin');

-- Allow deletes only by admins
CREATE POLICY "Allow admin deletes" ON system_messages
    FOR DELETE
    USING (auth.role() = 'admin');

-- Update RLS policies for system_messages_status table
DROP POLICY IF EXISTS "Users can read their own message status" ON system_messages_status;
DROP POLICY IF EXISTS "Users can update their own message status" ON system_messages_status;

CREATE POLICY "Users can read their own message status" ON system_messages_status
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own message status" ON system_messages_status
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Allow inserting message status records from system
CREATE POLICY "Allow system message status creation" ON system_messages_status
    FOR INSERT
    WITH CHECK (true);
