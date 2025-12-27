-- Create storage bucket for problem files
INSERT INTO storage.buckets (id, name, public)
VALUES ('problem-files', 'problem-files', false);

-- Allow authenticated users to upload their own files
CREATE POLICY "Users can upload their own problem files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'problem-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view their own files
CREATE POLICY "Users can view their own problem files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'problem-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own problem files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'problem-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);