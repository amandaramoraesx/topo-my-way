
-- Drop the restrictive admin-only SELECT policy
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

-- The "Users can view own role" policy already exists and allows users to see their own roles
-- This is sufficient - users can check their own role, admins don't need to see all roles for the system to work
