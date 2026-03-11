import { useApp, viewMeta } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { X, LogOut } from "lucide-react";

const navItems = [
  { section: "Principal" },
  { id: "home" as const, icon: "🏠", label: "Dashboard" },
  { section: "Ferramentas" },
  { id: "topogeo" as const, icon: "📐", label: "TopoGEO v2", badge: "PRONTO", badgeType: "ok" },
  { id: "exigencia" as const, icon: "⚖️", label: "Exigência Zero", badge: "PRONTO", badgeType: "ok" },
  { id: "orcamento" as const, icon: "📋", label: "Orçamento IA", badge: "NOVO", badgeType: "new" },
  { id: "laudos" as const, icon: "📄", label: "Laudos & Perícias", badge: "NOVO", badgeType: "new" },
  { section: "Gestão" },
  { id: "financeiro" as const, icon: "💰", label: "Financeiro", badge: "NOVO", badgeType: "new" },
  { id: "projetos" as const, icon: "📁", label: "Projetos", badge: "NOVO", badgeType: "new" },
  { section: "Marketing & IA" },
  { id: "instagram" as const, icon: "📸", label: "Instagram IA", badge: "NOVO", badgeType: "new" },
  { section: "Fase 2 — Ativo" },
  { id: "agente-sigef" as const, icon: "🤖", label: "Agente SIGEF", badge: "ATIVO", badgeType: "new" },
  { id: "agente-cart" as const, icon: "🏛️", label: "Agente Cartório", badge: "FASE 2", badgeType: "s2", disabled: true },
  { id: "licenc" as const, icon: "🌿", label: "Licenciamento Amb.", badge: "FASE 3", badgeType: "s3", disabled: true },
  { section: "Sistema" },
  { id: "config" as const, icon: "⚙️", label: "Configurações" },
];

const badgeStyles: Record<string, string> = {
  ok: "bg-success/20 text-success",
  new: "bg-primary/20 text-primary",
  s2: "bg-accent/20 text-accent",
  s3: "bg-purple/20 text-purple",
};

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { currentView, setCurrentView } = useApp();
  const { signOut, user } = useAuth();
  const isMobile = useIsMobile();

  const handleNav = (id: string) => {
    setCurrentView(id as any);
    if (isMobile && onClose) onClose();
  };

  const sidebarContent = (
    <>
      <div className="px-4 py-[18px] border-b border-border/50 flex items-center justify-between">
        <div>
          <div className="font-mono-display text-[10px] text-primary tracking-widest uppercase">▲ Rodrigues Topografia</div>
          <div className="text-[15px] font-bold text-foreground mt-0.5 leading-tight">Hub Central</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">Topógrafo Credenciado INCRA</div>
        </div>
        {isMobile && (
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {navItems.map((item, i) => {
          if ("section" in item && !("id" in item)) {
            return (
              <div key={i} className="text-[10px] text-muted-foreground tracking-widest uppercase px-4 pt-3.5 pb-1">
                {item.section}
              </div>
            );
          }
          if (!("id" in item)) return null;
          const isActive = currentView === item.id;
          const isDisabled = "disabled" in item && item.disabled;
          return (
            <div
              key={item.id}
              onClick={() => !isDisabled && handleNav(item.id!)}
              className={`flex items-center gap-2.5 px-4 py-2 mx-2 my-0.5 rounded-lg cursor-pointer text-[13px] font-medium transition-all
                ${isActive ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground border border-transparent"}
                ${isDisabled ? "opacity-45 cursor-not-allowed" : ""}
              `}
            >
              <span className="text-base w-[22px] text-center flex-shrink-0">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${badgeStyles[item.badgeType || "new"]}`}>
                  {item.badge}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="px-4 py-3 border-t border-border/50 space-y-2">
        <div className="text-[11px] text-muted-foreground truncate">
          {user?.email}
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-2 text-[12px] text-muted-foreground hover:text-destructive transition-colors w-full"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sair
        </button>
      </div>
    </>
  );

  // Mobile: overlay
  if (isMobile) {
    return (
      <>
        {open && (
          <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50" onClick={onClose} />
        )}
        <nav
          className={`fixed top-0 left-0 h-screen w-[260px] z-50 flex flex-col transition-transform duration-300 ease-in-out
            bg-card/70 backdrop-blur-2xl border-r border-border/30 shadow-2xl
            ${open ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          {sidebarContent}
        </nav>
      </>
    );
  }

  // Desktop: fixed glassmorphism sidebar
  return (
    <nav className="w-[var(--sidebar-width)] bg-card/70 backdrop-blur-2xl border-r border-border/30 flex flex-col fixed h-screen z-50">
      {sidebarContent}
    </nav>
  );
}
