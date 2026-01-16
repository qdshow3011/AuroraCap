-- Update RLS policies for system_messages_status table to allow users to insert their own message status records

-- Drop existing INSERT policies if they exist
DROP POLICY IF EXISTS "Allow system message status creation" ON system_messages_status;
DROP POLICY IF EXISTS "Allow message status creation" ON system_messages_status;
DROP POLICY IF EXISTS "Users can insert their own message status" ON system_messages_status;

-- Create a single INSERT policy that allows users to insert their own message status records
CREATE POLICY "Users can insert their own message status" ON system_messages_status
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Ensure UPDATE policy still works correctly
CREATE POLICY "Users can update their own message status" ON system_messages_status
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Ensure SELECT policy still works correctly
CREATE POLICY "Users can read their own message status" ON system_messages_status
    FOR SELECT
    USING (auth.uid() = user_id);

-- Verify policies are correctly set
SELECT polname, tablename, cmd, qual, with_check FROM pg_policies WHERE tablename = 'system_messages_status';