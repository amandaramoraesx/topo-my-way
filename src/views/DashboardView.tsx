import { useState, useEffect, useCallback } from "react";
import { useApp } from "@/context/AppContext";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";

interface DashProjeto {
  id: string;
  nome: string;
  tipo: string;
  cliente: string;
  status: string;
}

export default function DashboardView() {
  const { setCurrentView } = useApp();
  const { isAdminOrGerente } = useUserRole();
  const [projetos, setProjetos] = useState<DashProjeto[]>([]);
  const [rec, setRec] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      // Projetos
      const { data: pData } = await supabase
        .from("projects")
        .select("id, nome, tipo, cliente, status")
        .order("created_at", { ascending: false })
        .limit(10);
      setProjetos((pData || []).map((p: any) => ({ id: p.id, nome: p.nome, tipo: p.tipo, cliente: p.cliente || "", status: p.status })));

      // Receita do mês (ignora erro se não tiver permissão)
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);
      const { data: fData } = await supabase
        .from("finances")
        .select("valor")
        .eq("tipo", "receita")
        .gte("data", startOfMonth)
        .lte("data", endOfMonth);
      setRec((fData || []).reduce((s: number, f: any) => s + Number(f.valor), 0));
    };
    fetchData();
  }, []);

  const ativos = projetos.filter(p => p.status !== "concluido").length;
  const exig = projetos.filter(p => p.status === "exigencia").length;

  const stats = [
    { value: ativos, label: "Ativos", icon: "📁", color: "text-accent" },
    { value: exig, label: "Exigências", icon: "⚠️", color: "text-warning" },
    ...(isAdminOrGerente ? [{ value: `R$${rec.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`, label: "Receita", icon: "💰", color: "text-success" }] : []),
  ];

  const tools = [
    { id: "topogeo", icon: "📐", name: "TopoGEO v2", desc: "Memorial, planta, DXF, SIGEF", badge: "Pronto", badgeCls: "bg-success/15 text-success" },
    { id: "exigencia", icon: "⚖️", name: "Exigência Zero", desc: "Exigências com IA", badge: "Pronto", badgeCls: "bg-success/15 text-success" },
    { id: "orcamento", icon: "📋", name: "Orçamentos", desc: "Propostas profissionais", badge: "Novo", badgeCls: "bg-primary/15 text-primary" },
    { id: "laudos", icon: "📄", name: "Laudos & Perícias", desc: "Laudos ABNT com IA", badge: "Novo", badgeCls: "bg-primary/15 text-primary" },
    { id: "financeiro", icon: "💰", name: "Financeiro", desc: "Receitas e despesas", badge: "Novo", badgeCls: "bg-primary/15 text-primary" },
    { id: "instagram", icon: "📸", name: "Instagram IA", desc: "Conteúdo para redes", badge: "Novo", badgeCls: "bg-primary/15 text-primary" },
  ];

  const agents = [
    { id: "agente-sigef" as const, icon: "🤖", name: "Agente SIGEF", badge: "Ativo", badgeCls: "bg-success/15 text-success" },
    { icon: "🏛️", name: "Agente Cartório", badge: "Fase 2", badgeCls: "bg-accent/15 text-accent", disabled: true },
    { icon: "🌿", name: "Licenciamento", badge: "Fase 3", badgeCls: "bg-purple/15 text-purple", disabled: true },
  ];

  const statusMap: Record<string, string> = { em_andamento: "Em Andamento", exigencia: "Exigência", aguardando: "Aguardando", concluido: "Concluído" };
  const statusBadge: Record<string, string> = { em_andamento: "bg-accent/20 text-accent", exigencia: "bg-warning/20 text-warning", aguardando: "bg-gold/20 text-gold", concluido: "bg-success/20 text-success" };

  const phases = [
    { label: "Fase 1 — Ferramentas IA", pct: 100, color: "bg-success" },
    { label: "Fase 2 — Agentes", pct: 20, color: "bg-accent" },
    { label: "Fase 3 — Comunicação", pct: 5, color: "bg-purple" },
    { label: "Fase 4 — Autônoma", pct: 2, color: "bg-muted-foreground" },
  ];

  return (
    <div className="space-y-5 pb-6">
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
        {stats.map((s, i) => (
          <div key={i} className="min-w-[120px] flex-1 bg-card border border-border rounded-xl p-4 snap-start">
            <div className="text-lg mb-1">{s.icon}</div>
            <div className={`text-2xl md:text-3xl font-bold font-mono ${s.color}`}>{s.value}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-base font-bold mb-3">Ferramentas</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {tools.map(t => (
            <button
              key={t.id}
              onClick={() => setCurrentView(t.id as any)}
              className="bg-card border border-border rounded-xl p-4 text-left flex flex-col gap-2 transition-all active:scale-[0.97] hover:border-primary hover:bg-secondary min-h-[120px]"
            >
              <div className="text-2xl">{t.icon}</div>
              <div className="font-bold text-[13px] leading-tight">{t.name}</div>
              <div className="text-[11px] text-muted-foreground leading-snug flex-1">{t.desc}</div>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded self-start uppercase tracking-wider ${t.badgeCls}`}>
                {t.badge}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-base font-bold mb-3">Agentes IA</h2>
        <div className="grid grid-cols-3 gap-3">
          {agents.map((a, i) => (
            <button
              key={i}
              onClick={() => a.id && setCurrentView(a.id as any)}
              disabled={a.disabled}
              className={`bg-card border border-border rounded-xl p-3.5 text-left flex flex-col items-center gap-1.5 transition-all
                ${a.disabled ? "opacity-40 cursor-not-allowed" : "active:scale-[0.97] hover:border-primary hover:bg-secondary"}`}
            >
              <div className="text-2xl">{a.icon}</div>
              <div className="font-bold text-[11px] text-center leading-tight">{a.name}</div>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${a.badgeCls}`}>
                {a.badge}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold">Projetos Recentes</h2>
          <button onClick={() => setCurrentView("projetos")} className="text-[11px] text-primary font-semibold">
            Ver todos →
          </button>
        </div>
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {projetos.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-[13px]">
              <div className="text-2xl mb-2">📁</div>
              Nenhum projeto cadastrado.<br />
              <button onClick={() => setCurrentView("projetos")} className="text-primary font-semibold mt-1 inline-block">
                Cadastrar projeto →
              </button>
            </div>
          ) : (
            projetos.slice(0, 4).map(p => (
              <div key={p.id} className="flex items-center justify-between px-4 py-3 border-b border-border last:border-b-0">
                <div className="min-w-0 flex-1 mr-3">
                  <div className="text-[13px] font-semibold truncate">{p.nome}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{p.tipo} · {p.cliente || "—"}</div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap ${statusBadge[p.status] || "bg-accent/20 text-accent"}`}>
                  {statusMap[p.status] || p.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div>
        <h2 className="text-base font-bold mb-3">Progresso</h2>
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          {phases.map((ph, i) => (
            <div key={i}>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-muted-foreground">{ph.label}</span>
                <span className="font-mono text-foreground">{ph.pct}%</span>
              </div>
              <div className="h-1.5 bg-border rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${ph.color}`} style={{ width: `${ph.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
