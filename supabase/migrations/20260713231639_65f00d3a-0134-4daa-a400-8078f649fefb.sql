-- Permite vincular um lançamento financeiro (ex: despesa) a um cliente já cadastrado
ALTER TABLE public.finances
  ADD COLUMN client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL;
