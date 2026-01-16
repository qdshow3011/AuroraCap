-- Fix INSERT RLS policy for system_messages_status table to allow users to insert their own message status

-- Drop existing INSERT policies if they exist
DROP POLICY IF EXISTS "Allow system message status creation" ON system_messages_status;

-- Create new INSERT policies

-- Allow system to insert message status records
CREATE POLICY "Allow system message status creation" ON system_messages_status
    FOR INSERT
    WITH CHECK (auth.role() = 'admin' OR auth.uid() IS NULL);

-- Allow authenticated users to insert their own message status records
CREATE POLICY "Allow user message status creation" ON system_messages_status
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Ensure UPDATE policy still works correctly
CREATE POLICY "Users can update their own message status" ON system_messages_status
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);