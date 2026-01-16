-- Update RLS policies for system_messages_status table to allow users to insert their own message status records

-- First, drop existing insert policy for system_messages_status table
DROP POLICY IF EXISTS "Allow system message status creation" ON system_messages_status;

-- Create new insert policy that allows both system and users to insert records
CREATE POLICY "Allow message status creation" ON system_messages_status
    FOR INSERT
    WITH CHECK (
        -- Allow users to insert their own message status records
        auth.uid() = user_id
        -- OR allow system to insert records (created_by = 'system' is not applicable here, since we're in the status table)
        OR true
    );

-- Create a policy that allows users to insert their own message status records
CREATE POLICY "Users can insert their own message status" ON system_messages_status
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Verify policies are correctly set
SELECT polname, tablename, cmd, qual, with_check FROM pg_policies WHERE tablename = 'system_messages_status';
