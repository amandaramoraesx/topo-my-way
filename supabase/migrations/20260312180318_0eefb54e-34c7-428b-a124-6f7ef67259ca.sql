
-- Create templates table
CREATE TABLE public.templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('memorial', 'orcamento')),
  sub_type text,
  description text,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint,
  mime_type text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own templates" ON public.templates
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own templates" ON public.templates
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates" ON public.templates
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates" ON public.templates
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON public.templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for template files
INSERT INTO storage.buckets (id, name, public) VALUES ('templates', 'templates', false);

-- Storage RLS policies
CREATE POLICY "Users can upload templates" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'templates' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view their templates" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'templates' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their templates" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'templates' AND (storage.foldername(name))[1] = auth.uid()::text);
