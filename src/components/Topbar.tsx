import { useApp, viewMeta } from "@/context/AppContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu } from "lucide-react";

interface TopbarProps {
  onMenuClick?: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const { currentView, setCurrentView } = useApp();
  const meta = viewMeta[currentView];
  const isMobile = useIsMobile();

  return (
    <div className="bg-card/70 backdrop-blur-xl border-b border-border/30 px-4 md:px-6 py-3.5 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-3">
        {isMobile && (
          <button onClick={onMenuClick} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground">
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div>
          <h1 className="text-[15px] md:text-[17px] font-bold">{meta.title}</h1>
          <p className="text-[10px] md:text-xs text-muted-foreground mt-0.5 hidden sm:block">{meta.sub}</p>
        </div>
      </div>
      <div className="flex gap-2 items-center">
        <span className="text-[11px] hidden sm:inline text-success">🟢 IA Ativa</span>
        <button
          onClick={() => setCurrentView("config")}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-secondary/80 text-foreground border border-border/50 hover:border-primary hover:text-primary transition-all"
        >
          ⚙️
        </button>
      </div>
    </div>
  );
}
