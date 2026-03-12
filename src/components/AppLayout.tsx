import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { useApp } from "@/context/AppContext";
import { useIsMobile } from "@/hooks/use-mobile";
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
import ModelosView from "@/views/ModelosView";
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
  modelos: ModelosView,
};

export default function AppLayout() {
  const { currentView } = useApp();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const ViewComponent = viewComponents[currentView] || PlaceholderView;

  return (
    <div className="flex min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className={`flex-1 flex flex-col min-h-screen ${!isMobile ? "ml-[var(--sidebar-width)]" : ""}`}>
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <div className="p-3 md:p-6 flex-1 overflow-x-hidden">
          <ViewComponent />
        </div>
      </div>
    </div>
  );
}
