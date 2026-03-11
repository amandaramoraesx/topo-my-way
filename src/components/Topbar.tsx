import { useApp, viewMeta } from "@/context/AppContext";

export default function Topbar() {
  const { currentView, setCurrentView, apiKey, provider } = useApp();
  const meta = viewMeta[currentView];

  return (
    <div className="bg-card border-b border-border px-6 py-3.5 flex items-center justify-between sticky top-0 z-40">
      <div>
        <h1 className="text-[17px] font-bold">{meta.title}</h1>
        <p className="text-xs text-muted-foreground mt-0.5">{meta.sub}</p>
      </div>
      <div className="flex gap-2 items-center">
        <span className="text-[11px]" style={{ color: apiKey ? "hsl(var(--success))" : "hsl(var(--muted-foreground))" }}>
          {apiKey ? (provider === "gemini" ? "🟢 Gemini (gratuito)" : "🟢 Claude configurado") : "⚪ API não configurada"}
        </span>
        <button
          onClick={() => setCurrentView("config")}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-secondary text-foreground border border-border hover:border-primary hover:text-primary transition-all"
        >
          ⚙️ Config
        </button>
      </div>
    </div>
  );
}
