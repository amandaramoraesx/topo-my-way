import { useApp } from "@/context/AppContext";

export default function DashboardView() {
  const { projetos, financas, setCurrentView } = useApp();
  const ativos = projetos.filter(p => p.status !== "concluido").length;
  const exig = projetos.filter(p => p.status === "exigencia").length;
  const mes = new Date().getMonth();
  const ano = new Date().getFullYear();
  const rec = financas.filter(f => f.tipo === "receita" && new Date(f.data).getMonth() === mes && new Date(f.data).getFullYear() === ano).reduce((s, f) => s + f.valor, 0);

  const tools = [
    { id: "topogeo", icon: "📐", name: "TopoGEO v2", desc: "Memorial descritivo, planta, volumes, DXF, ODS SIGEF", status: "✓ Pronto", statusClass: "bg-success/15 text-success" },
    { id: "exigencia", icon: "⚖️", name: "Exigência Zero", desc: "Resolve exigências de cartório com IA em segundos", status: "✓ Pronto", statusClass: "bg-success/15 text-success" },
    { id: "orcamento", icon: "📋", name: "Orçamento IA", desc: "Gera proposta profissional para qualquer serviço", status: "✦ Novo", statusClass: "bg-primary/15 text-primary" },
    { id: "laudos", icon: "📄", name: "Laudos & Perícias", desc: "Laudos técnicos padrão ABNT gerados com IA", status: "✦ Novo", statusClass: "bg-primary/15 text-primary" },
    { id: "financeiro", icon: "💰", name: "Financeiro", desc: "Receitas, despesas, margem por tipo de serviço", status: "✦ Novo", statusClass: "bg-primary/15 text-primary" },
    { id: "instagram", icon: "📸", name: "Instagram IA", desc: "Conteúdo profissional para redes sociais com IA", status: "✦ Novo", statusClass: "bg-primary/15 text-primary" },
  ];

  const phases = [
    { label: "Fase 1 — Ferramentas IA", pct: 100, color: "bg-success", textColor: "text-success" },
    { label: "Fase 2 — Agentes no Navegador", pct: 20, color: "bg-accent", textColor: "text-accent" },
    { label: "Fase 3 — Comunicação & Portal", pct: 5, color: "bg-purple", textColor: "text-purple" },
    { label: "Fase 4 — Empresa Autônoma", pct: 2, color: "bg-muted-foreground", textColor: "text-muted-foreground" },
  ];

  const statusMap: Record<string, string> = { em_andamento: "Em Andamento", exigencia: "Exigência", aguardando: "Aguardando", concluido: "Concluído" };
  const statusBadge: Record<string, string> = { em_andamento: "bg-accent/20 text-accent", exigencia: "bg-warning/20 text-warning", aguardando: "bg-gold/20 text-gold", concluido: "bg-success/20 text-success" };

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        {[
          { value: ativos, label: "Projetos Ativos", color: "", sub: "cadastre projetos" },
          { value: exig, label: "Exigências Pendentes", color: "text-warning", sub: "verifique sempre" },
          { value: `R$${rec.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`, label: "Receita do Mês", color: "text-success", sub: "financeiro" },
          { value: "14", label: "Automações Mapeadas", color: "text-primary", sub: "4 fases ativas" },
        ].map((s, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-5">
            <div className={`text-3xl font-bold font-mono ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            <div className="text-[11px] mt-2 px-2 py-0.5 rounded bg-success/10 text-success inline-block">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Tools */}
        <div>
          <h2 className="text-xl font-bold mb-3.5">Ferramentas Disponíveis</h2>
          <div className="grid grid-cols-2 gap-3 mb-3">
            {tools.map(t => (
              <div key={t.id} onClick={() => setCurrentView(t.id as any)} className="bg-card border border-border rounded-xl p-5 cursor-pointer flex flex-col gap-2.5 transition-all hover:border-primary hover:bg-secondary hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,212,170,.1)]">
                <div className="text-[26px]">{t.icon}</div>
                <div className="font-bold text-sm">{t.name}</div>
                <div className="text-xs text-muted-foreground leading-relaxed">{t.desc}</div>
                <div className={`text-[10px] font-bold px-2 py-0.5 rounded self-start uppercase tracking-wide ${t.statusClass}`}>{t.status}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: "agente-sigef", icon: "🤖", name: "Agente SIGEF", desc: "Gerencie processos INCRA", status: "Ativo", cls: "bg-success/15 text-success" },
              { icon: "🏛️", name: "Agente Cartório", desc: "Age dentro do site do cartório", status: "Fase 2", cls: "bg-accent/15 text-accent", disabled: true },
              { icon: "🌿", name: "Licenciamento Amb.", desc: "Gera RAS, EAS, EIA e checklists", status: "Fase 3", cls: "bg-purple/15 text-purple", disabled: true },
            ].map((t, i) => (
              <div key={i} onClick={() => t.id && setCurrentView(t.id as any)} className={`bg-card border border-border rounded-xl p-5 flex flex-col gap-2.5 transition-all ${t.disabled ? "opacity-45 cursor-not-allowed" : "cursor-pointer hover:border-primary hover:bg-secondary hover:-translate-y-0.5"}`}>
                <div className="text-[26px]">{t.icon}</div>
                <div className="font-bold text-sm">{t.name}</div>
                <div className="text-xs text-muted-foreground leading-relaxed">{t.desc}</div>
                <div className={`text-[10px] font-bold px-2 py-0.5 rounded self-start ${t.cls}`}>{t.status}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div>
          <h2 className="text-xl font-bold mb-3.5">Projetos Recentes</h2>
          <div className="bg-card border border-border rounded-xl overflow-hidden mb-5">
            {projetos.length === 0 ? (
              <div className="p-10 text-center text-muted-foreground text-[13px]">
                <div className="text-[28px] mb-2">📁</div>
                Nenhum projeto cadastrado ainda.<br />
                <span onClick={() => setCurrentView("projetos")} className="text-primary cursor-pointer">Cadastrar projeto →</span>
              </div>
            ) : (
              projetos.slice(0, 6).map(p => (
                <div key={p.id} className="flex items-center justify-between px-3.5 py-2.5 border-b border-border">
                  <div>
                    <div className="text-[13px] font-semibold">{p.nome}</div>
                    <div className="text-[11px] text-muted-foreground">{p.tipo} · {p.cliente || "—"}</div>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${statusBadge[p.status] || "bg-accent/20 text-accent"}`}>
                      {statusMap[p.status] || p.status}
                    </span>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{p.prazo || "—"}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="h-px bg-border my-4" />
          <h2 className="text-xl font-bold mb-3.5">Mapa de Progresso</h2>
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex flex-col gap-3">
              {phases.map((ph, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span>{ph.label}</span>
                    <span className={ph.textColor}>{ph.pct === 100 ? "100%" : ph.pct > 10 ? "Em construção" : ph.pct > 3 ? "Em breve" : "Visão futura"}</span>
                  </div>
                  <div className="h-1 bg-border rounded-sm overflow-hidden">
                    <div className={`h-full rounded-sm transition-all ${ph.color}`} style={{ width: `${ph.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
