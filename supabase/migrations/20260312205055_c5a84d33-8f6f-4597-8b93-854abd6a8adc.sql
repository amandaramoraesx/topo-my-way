
-- Fix: restrict UPDATE to admin/gerente or owner
DROP POLICY "All authenticated can update projects" ON public.projects;
CREATE POLICY "Owner or admin can update projects" ON public.projects FOR UPDATE TO authenticated USING (auth.uid() = user_id OR is_admin_or_gerente(auth.uid()));
