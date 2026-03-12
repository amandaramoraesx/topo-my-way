
-- Create storage bucket for exigencia files
INSERT INTO storage.buckets (id, name, public)
VALUES ('exigencias', 'exigencias', false);

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload exigencia files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'exigencias' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to read their own files
CREATE POLICY "Users can read own exigencia files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'exigencias' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own exigencia files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'exigencias' AND (storage.foldername(name))[1] = auth.uid()::text);
