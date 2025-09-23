-- Create storage bucket for encrypted files
INSERT INTO storage.buckets (id, name, public) VALUES ('encrypted-files', 'encrypted-files', false);

-- Add file-related columns to pastes table
ALTER TABLE public.pastes 
ADD COLUMN file_name TEXT,
ADD COLUMN file_size BIGINT,
ADD COLUMN file_type TEXT,
ADD COLUMN is_file BOOLEAN DEFAULT false;

-- Create storage policies for encrypted files
CREATE POLICY "Anyone can upload encrypted files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'encrypted-files');

CREATE POLICY "Anyone can view encrypted files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'encrypted-files');

CREATE POLICY "Anyone can delete encrypted files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'encrypted-files');

-- Update the cleanup function trigger to handle file deletion
CREATE OR REPLACE FUNCTION public.cleanup_paste_files()
RETURNS TRIGGER AS $$
BEGIN
  -- If this paste has a file, delete it from storage
  IF OLD.is_file = true AND OLD.file_name IS NOT NULL THEN
    -- Delete the file from storage (this will be handled by the edge function)
    NULL; -- Placeholder - actual deletion happens in edge function
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to cleanup files when pastes are deleted
CREATE TRIGGER cleanup_paste_files_trigger
  AFTER DELETE ON public.pastes
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_paste_files();