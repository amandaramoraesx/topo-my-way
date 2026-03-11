import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { useApp } from "@/context/AppContext";
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
};

export default function AppLayout() {
  const { currentView } = useApp();
  const ViewComponent = viewComponents[currentView] || PlaceholderView;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="ml-[var(--sidebar-width)] flex-1 flex flex-col min-h-screen">
        <Topbar />
        <div className="p-6 flex-1">
          <ViewComponent />
        </div>
      </div>
    </div>
  );
}
