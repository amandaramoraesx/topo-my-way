import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { useApp } from "@/context/AppContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserRole } from "@/hooks/useUserRole";
import DashboardView from "@/views/DashboardView";
import TopoGeoView from "@/views/TopoGeoView";
import ExigenciaView from "@/views/ExigenciaView";
import OrcamentoView from "@/views/OrcamentoView";
import LaudosView from "@/views/LaudosView";
import FinanceiroView from "@/views/FinanceiroView";
import ProjetosView from "@/views/ProjetosView";
import InstagramView from "@/views/InstagramView";
import ConfigView from "@/views/ConfigView";
import AgenteSigefView from "@/views/AgenteSigefView";
import FuncionariosView from "@/views/FuncionariosView";
import ClientesView from "@/views/ClientesView";
import PlaceholderView from "@/views/PlaceholderView";

const viewComponents: Record<string, React.ComponentType> = {
  home: DashboardView,
  topogeo: TopoGeoView,
  exigencia: ExigenciaView,
  orcamento: OrcamentoView,
  laudos: LaudosView,
  financeiro: FinanceiroView,
  projetos: ProjetosView,
  instagram: InstagramView,
  config: ConfigView,
  "agente-sigef": AgenteSigefView,
  funcionarios: FuncionariosView,
  clientes: ClientesView,
};

const restrictedViews = ["financeiro", "funcionarios"];

function AccessDenied() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="bg-card border border-border rounded-xl p-8 text-center max-w-md">
        <div className="text-4xl mb-3">🔒</div>
        <h2 className="text-lg font-bold mb-2">Acesso Restrito</h2>
        <p className="text-sm text-muted-foreground">Você não tem permissão para acessar este módulo. Entre em contato com o administrador.</p>
      </div>
    </div>
  );
}

export default function AppLayout() {
  const { currentView } = useApp();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isAdminOrGerente, loading: roleLoading } = useUserRole();
  const ViewComponent = viewComponents[currentView] || PlaceholderView;
  const isRestricted = restrictedViews.includes(currentView) && !isAdminOrGerente && !roleLoading;

  return (
    <div className="flex min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className={`flex-1 flex flex-col min-h-screen ${!isMobile ? "ml-[var(--sidebar-width)]" : ""}`}>
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <div className="p-3 md:p-6 flex-1 overflow-x-hidden">
          {isRestricted ? <AccessDenied /> : <ViewComponent />}
        </div>
      </div>
    </div>
  );
}
