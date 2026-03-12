import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export type AppRole = "admin" | "gerente" | "funcionario";

export function useUserRole() {
  const { user } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setRoles([]); setLoading(false); return; }

    const fetch = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      setRoles((data || []).map((r: any) => r.role as AppRole));
      setLoading(false);
    };
    fetch();
  }, [user]);

  return {
    roles,
    loading,
    isAdmin: roles.includes("admin"),
    isGerente: roles.includes("gerente"),
    isAdminOrGerente: roles.includes("admin") || roles.includes("gerente"),
  };
}
