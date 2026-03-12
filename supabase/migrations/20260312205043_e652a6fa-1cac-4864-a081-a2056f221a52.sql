
-- Tabela de projetos (todos autenticados podem ver/editar)
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  tipo text NOT NULL DEFAULT 'Georreferenciamento Rural',
  cliente text DEFAULT '',
  status text NOT NULL DEFAULT 'em_andamento',
  prazo text DEFAULT '',
  valor text DEFAULT '',
  obs text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Todos autenticados podem ver todos os projetos
CREATE POLICY "All authenticated can view projects" ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "All authenticated can insert projects" ON public.projects FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "All authenticated can update projects" ON public.projects FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Admin/gerente can delete projects" ON public.projects FOR DELETE TO authenticated USING (is_admin_or_gerente(auth.uid()));

-- Tabela de finanças (apenas admin/gerente)
CREATE TABLE public.finances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo text NOT NULL DEFAULT 'receita',
  data date NOT NULL DEFAULT CURRENT_DATE,
  descricao text NOT NULL DEFAULT '',
  valor numeric NOT NULL DEFAULT 0,
  categoria text NOT NULL DEFAULT 'Georreferenciamento',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.finances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/gerente can view finances" ON public.finances FOR SELECT TO authenticated USING (is_admin_or_gerente(auth.uid()));
CREATE POLICY "Admin/gerente can insert finances" ON public.finances FOR INSERT TO authenticated WITH CHECK (is_admin_or_gerente(auth.uid()));
CREATE POLICY "Admin/gerente can update finances" ON public.finances FOR UPDATE TO authenticated USING (is_admin_or_gerente(auth.uid()));
CREATE POLICY "Admin/gerente can delete finances" ON public.finances FOR DELETE TO authenticated USING (is_admin_or_gerente(auth.uid()));

-- Tabela de configurações da empresa (singleton compartilhado)
CREATE TABLE public.company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL DEFAULT 'Rodrigues Topografia',
  rt text DEFAULT '',
  crea text DEFAULT '',
  tel text DEFAULT '',
  email text DEFAULT '',
  cidade text DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated can view company" ON public.company_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin/gerente can update company" ON public.company_settings FOR UPDATE TO authenticated USING (is_admin_or_gerente(auth.uid()));
CREATE POLICY "Admin/gerente can insert company" ON public.company_settings FOR INSERT TO authenticated WITH CHECK (is_admin_or_gerente(auth.uid()));

-- Inserir registro inicial da empresa
INSERT INTO public.company_settings (nome) VALUES ('Rodrigues Topografia');

-- Triggers para updated_at
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_company_updated_at BEFORE UPDATE ON public.company_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
