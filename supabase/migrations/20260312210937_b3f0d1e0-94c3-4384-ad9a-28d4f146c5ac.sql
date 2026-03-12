
-- Compartilhar clientes entre todos os usuários autenticados
DROP POLICY "Users can view own clients" ON public.clients;
CREATE POLICY "All authenticated can view clients" ON public.clients FOR SELECT TO authenticated USING (true);

DROP POLICY "Users can insert own clients" ON public.clients;
CREATE POLICY "All authenticated can insert clients" ON public.clients FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY "Users can update own clients" ON public.clients;
CREATE POLICY "All authenticated can update clients" ON public.clients FOR UPDATE TO authenticated USING (true);

DROP POLICY "Users can delete own clients" ON public.clients;
CREATE POLICY "Admin/gerente can delete clients" ON public.clients FOR DELETE TO authenticated USING (is_admin_or_gerente(auth.uid()));
