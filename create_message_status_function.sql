-- Create a function to insert system message status with conflict handling
CREATE OR REPLACE FUNCTION insert_system_message_status(
    p_message_id UUID,
    p_user_id UUID
) RETURNS VOID AS $$
BEGIN
    -- Insert the message status record, ignore if already exists
    INSERT INTO system_messages_status (message_id, user_id, is_read)
    VALUES (p_message_id, p_user_id, false)
    ON CONFLICT (message_id, user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql;