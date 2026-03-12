
-- Drop the old SELECT policy that restricts to own templates
DROP POLICY IF EXISTS "Users can view their own templates" ON public.templates;

-- Create new SELECT policy: ALL authenticated users can view ALL templates
CREATE POLICY "All authenticated users can view templates"
ON public.templates FOR SELECT
TO authenticated
USING (true);

-- Storage: allow all authenticated users to download template files
CREATE POLICY "All authenticated can download templates"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'templates');
