
-- Create clients table
CREATE TABLE public.clients (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  address text,
  property_name text,
  service_type text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own clients" ON public.clients
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clients" ON public.clients
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clients" ON public.clients
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clients" ON public.clients
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create storage bucket for client files
INSERT INTO storage.buckets (id, name, public) VALUES ('client-files', 'client-files', false);

-- Storage RLS policies
CREATE POLICY "Users can upload client files" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'client-files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view own client files" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'client-files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own client files" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'client-files' AND (storage.foldername(name))[1] = auth.uid()::text);
