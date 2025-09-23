-- Fix the function search path security issue
CREATE OR REPLACE FUNCTION public.cleanup_paste_files()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- If this paste has a file, delete it from storage
  IF OLD.is_file = true AND OLD.file_name IS NOT NULL THEN
    -- Delete the file from storage (this will be handled by the edge function)
    NULL; -- Placeholder - actual deletion happens in edge function
  END IF;
  
  RETURN OLD;
END;
$$;