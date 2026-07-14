-- Habilita atualizações em tempo real (Supabase Realtime) para as telas de
-- Funcionários (ponto, cadastro, pagamentos), Financeiro e Clientes.

ALTER TABLE public.employees REPLICA IDENTITY FULL;
ALTER TABLE public.time_records REPLICA IDENTITY FULL;
ALTER TABLE public.employee_payments REPLICA IDENTITY FULL;
ALTER TABLE public.finances REPLICA IDENTITY FULL;
ALTER TABLE public.clients REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'employees') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.employees;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'time_records') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.time_records;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'employee_payments') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.employee_payments;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'finances') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.finances;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'clients') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.clients;
  END IF;
END $$;
