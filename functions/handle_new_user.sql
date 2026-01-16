-- This function is called when a new user is created in the auth.users table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert user data into the public.users table
  INSERT INTO public.users (
    id,
    email,
    name,
    phone,
    id_number,
    role,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'id_number',
    (NEW.raw_user_meta_data->>'role')::user_role,
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger to execute the function when a new user is inserted
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();
