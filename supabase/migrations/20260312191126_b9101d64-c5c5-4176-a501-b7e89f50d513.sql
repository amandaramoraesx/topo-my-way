
-- 1. Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'gerente', 'funcionario');

-- 2. User roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 4. Helper: check if user is admin or gerente
CREATE OR REPLACE FUNCTION public.is_admin_or_gerente(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'gerente')
  )
$$;

-- 5. RLS for user_roles (only admins can manage)
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own role" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 6. Employees table
CREATE TABLE public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  role text DEFAULT 'Funcionário',
  phone text,
  email text,
  salary numeric DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/gerente can view employees" ON public.employees
  FOR SELECT TO authenticated
  USING (public.is_admin_or_gerente(auth.uid()) OR auth.uid() = user_id);

CREATE POLICY "Admin/gerente can insert employees" ON public.employees
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_gerente(auth.uid()));

CREATE POLICY "Admin/gerente can update employees" ON public.employees
  FOR UPDATE TO authenticated
  USING (public.is_admin_or_gerente(auth.uid()));

CREATE POLICY "Admin/gerente can delete employees" ON public.employees
  FOR DELETE TO authenticated
  USING (public.is_admin_or_gerente(auth.uid()));

-- 7. Time records (ponto)
CREATE TABLE public.time_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  clock_in timestamptz,
  clock_out timestamptz,
  lunch_out timestamptz,
  lunch_in timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.time_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/gerente can view all time records" ON public.time_records
  FOR SELECT TO authenticated
  USING (public.is_admin_or_gerente(auth.uid()) OR auth.uid() = user_id);

CREATE POLICY "Users can insert own time records" ON public.time_records
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR public.is_admin_or_gerente(auth.uid()));

CREATE POLICY "Admin/gerente can update time records" ON public.time_records
  FOR UPDATE TO authenticated
  USING (public.is_admin_or_gerente(auth.uid()) OR auth.uid() = user_id);

CREATE POLICY "Admin/gerente can delete time records" ON public.time_records
  FOR DELETE TO authenticated
  USING (public.is_admin_or_gerente(auth.uid()));

-- 8. Employee payments
CREATE TABLE public.employee_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  description text,
  payment_type text DEFAULT 'salario',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.employee_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/gerente can view payments" ON public.employee_payments
  FOR SELECT TO authenticated
  USING (public.is_admin_or_gerente(auth.uid()));

CREATE POLICY "Admin/gerente can insert payments" ON public.employee_payments
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin_or_gerente(auth.uid()));

CREATE POLICY "Admin/gerente can delete payments" ON public.employee_payments
  FOR DELETE TO authenticated
  USING (public.is_admin_or_gerente(auth.uid()));

-- 9. Triggers for updated_at
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_time_records_updated_at BEFORE UPDATE ON public.time_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Grant current user admin role (via trigger on first signup or manual)
-- We'll handle this in the app by assigning admin to the first user
