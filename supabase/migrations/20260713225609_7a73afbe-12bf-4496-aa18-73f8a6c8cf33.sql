-- Valor da diária paga em sábados/feriados trabalhados (separado do salário mensal fixo)
ALTER TABLE public.employees
  ADD COLUMN saturday_holiday_rate numeric NOT NULL DEFAULT 100;
