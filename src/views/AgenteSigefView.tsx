import { useState, useEffect } from "react";

interface Processo {
  denom: string;
  prop: string;
  mun: string;
  area: string;
  tipo: string;
  status: string;
  cod: string;
  ccir: string;
  obs: string;
  data: string;
}

const STATUS_SIGEF: Record<string, { label: string; color: string; icon: string }> = {
  preparando: { label: "Preparando ODS", color: "#a0aec0", icon: "📝" },
  protocolado: { label: "Protocolado", color: "#3b82f6", icon: "📤" },
  analise: { label: "Em Análise", color: "#f59e0b", icon: "🔍" },
  notificado: { label: "Notificado ⚠️", color: "#ef4444", icon: "🔔" },
  certificado: { label: "Certificado ✓", color: "#00d4aa", icon: "✅" },
};

const TIPO_LABELS: Record<string, string> = {
  georref_rural: "Georreferenciamento Rural",
  retificacao: "Retificação",
  desmembramento: "Desmembramento",
  remembramento: "Remembramento",
  usucapiao: "Usucapião",
};

export default function AgenteSigefView() {
  const [processos, setProcessos] = useState<Processo[]>(() => JSON.parse(localStorage.getItem("rt_sigef") || "[]"));
  const [tab, setTab] = useState("processos");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ denom: "", prop: "", mun: "", area: "", tipo: "georref_rural", status: "preparando", cod: "", ccir: "", obs: "" });

  const save = (data: Processo[]) => { setProcessos(data); localStorage.setItem("rt_sigef", JSON.stringify(data)); };

  const counts = { preparando: 0, protocolado: 0, analise: 0, notificado: 0, certificado: 0 };
  processos.forEach(p => { if (counts[p.status as keyof typeof counts] !== undefined) counts[p.status as keyof typeof counts]++; });

  const salvar = () => {
    if (!form.denom || !form.prop) return;
    save([{ ...form, data: new Date().toLocaleDateString("pt-BR") }, ...processos]);
    setModalOpen(false);
  };

  const mudarStatus = (i: number, s: string) => {
    const updated = [...processos];
    updated[i].status = s;
    save(updated);
  };

  const excluir = (i: number) => { if (confirm("Excluir?")) save(processos.filter((_, idx) => idx !== i)); };

  const tabs = ["processos", "notif", "guia"];

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
        <div>
          <h2 className="text-xl font-bold">🤖 Agente SIGEF</h2>
          <p className="text-muted-foreground text-[13px] mt-1">Gerencie processos de certificação no INCRA/SIGEF</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setModalOpen(true)} className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-secondary text-foreground border border-border hover:border-primary hover:text-primary transition-all">➕ Novo Processo</button>
          <a href="https://sigef.incra.gov.br" target="_blank" className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-accent text-accent-foreground no-underline inline-flex items-center gap-1.5">🔗 Abrir SIGEF</a>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { v: processos.length, l: "Total", c: "" },
          { v: counts.analise + counts.protocolado, l: "Em Andamento", c: "text-gold" },
          { v: counts.notificado, l: "Notificados", c: "text-destructive" },
          { v: counts.certificado, l: "Certificados", c: "text-primary" },
        ].map((s, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-3.5 text-center">
            <div className={`text-2xl font-bold ${s.c}`}>{s.v}</div>
            <div className="text-[11px] text-muted-foreground mt-1">{s.l}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border mb-4">
        {[{ id: "processos", l: "📋 Processos" }, { id: "notif", l: "🔔 Analisar Notificação" }, { id: "guia", l: "📖 Guia Passo a Passo" }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2.5 text-[13px] border-b-2 transition-all ${tab === t.id ? "text-primary border-primary font-bold" : "text-muted-foreground border-transparent"}`}>{t.l}</button>
        ))}
      </div>

      {tab === "processos" && (
        <div className="flex flex-col gap-2.5">
          {processos.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-[13px]">Nenhum processo cadastrado.</div>
          ) : (
            processos.map((p, i) => {
              const st = STATUS_SIGEF[p.status] || STATUS_SIGEF.preparando;
              return (
                <div key={i} className="bg-card border border-border rounded-xl p-4 flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-bold text-sm">{p.denom}</span>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full" style={{ background: st.color + "22", color: st.color, border: `1px solid ${st.color}55` }}>{st.icon} {st.label}</span>
                    </div>
                    <div className="text-xs text-muted-foreground flex gap-4 flex-wrap">
                      <span>👤 {p.prop}</span>
                      {p.mun && <span>📍 {p.mun}</span>}
                      {p.area && <span>📐 {p.area} ha</span>}
                      <span>📋 {TIPO_LABELS[p.tipo] || p.tipo}</span>
                      <span>📅 {p.data || "—"}</span>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <select value={p.status} onChange={e => mudarStatus(i, e.target.value)} className="px-2 py-1 bg-secondary border border-border rounded-md text-foreground text-xs cursor-pointer">
                      {Object.entries(STATUS_SIGEF).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
                    </select>
                    <button onClick={() => excluir(i)} className="px-2.5 py-1 bg-secondary border border-border rounded-md text-muted-foreground text-xs cursor-pointer hover:text-destructive">🗑</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {tab === "guia" && (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="font-bold text-primary mb-3.5">📖 Como protocolar um georreferenciamento no SIGEF</div>
          <div className="flex flex-col gap-3.5">
            {[
              { n: "1", t: "Gerar a ODS no TopoGEO v2", d: "Insira os vértices → clique em \"Exportar ODS SIGEF\"." },
              { n: "2", t: "Acessar o SIGEF com certificado digital", d: "Abra sigef.incra.gov.br → insira o e-CPF." },
              { n: "3", t: "Criar novo requerimento", d: "\"Novo Requerimento\" → preencher dados → upload da ODS." },
              { n: "4", t: "Acompanhar status aqui no Hub", d: "Cadastre o processo e atualize conforme o SIGEF responde." },
            ].map(s => (
              <div key={s.n} className="flex gap-3 items-start">
                <div className="min-w-[28px] h-7 rounded-full bg-primary flex items-center justify-center font-bold text-primary-foreground text-[13px]">{s.n}</div>
                <div><strong>{s.t}</strong><br /><span className="text-muted-foreground text-[13px]">{s.d}</span></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "notif" && (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="font-bold text-primary mb-3">🔔 Analisador de Notificação SIGEF</div>
          <p className="text-[13px] text-muted-foreground mb-3">Recebeu uma notificação do INCRA? Cole o texto abaixo e a IA identifica os problemas.</p>
          <textarea rows={7} placeholder="Cole aqui o texto da notificação do SIGEF/INCRA..." className="bg-secondary border border-border text-foreground px-3 py-2.5 rounded-md text-[13px] resize-y w-full focus:outline-none focus:border-primary mb-3" />
          <button className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-secondary text-foreground border border-border hover:border-primary hover:text-primary transition-all">🔍 Analisar com IA</button>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-background/80 z-[9999] flex items-center justify-center" onClick={e => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-[520px] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <strong className="text-base">📋 Novo Processo SIGEF</strong>
              <button onClick={() => setModalOpen(false)} className="text-muted-foreground text-xl">✕</button>
            </div>
            <div className="space-y-2.5">
              <IF label="Denominação do Imóvel *" value={form.denom} onChange={v => setForm(p => ({ ...p, denom: v }))} placeholder="Ex: Fazenda Santa Rosa" />
              <IF label="Proprietário *" value={form.prop} onChange={v => setForm(p => ({ ...p, prop: v }))} placeholder="Nome completo" />
              <div className="grid grid-cols-2 gap-2.5">
                <IF label="Município" value={form.mun} onChange={v => setForm(p => ({ ...p, mun: v }))} placeholder="Município/UF" />
                <IF label="Área (ha)" value={form.area} onChange={v => setForm(p => ({ ...p, area: v }))} placeholder="0.0000" />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">Tipo de Serviço</label>
                  <select value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))} className="bg-secondary border border-border text-foreground px-3 py-2 rounded-md text-[13px] focus:outline-none focus:border-primary">
                    {Object.entries(TIPO_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">Status Inicial</label>
                  <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className="bg-secondary border border-border text-foreground px-3 py-2 rounded-md text-[13px] focus:outline-none focus:border-primary">
                    {Object.entries(STATUS_SIGEF).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
                  </select>
                </div>
              </div>
              <IF label="Código SIGEF (opcional)" value={form.cod} onChange={v => setForm(p => ({ ...p, cod: v }))} placeholder="Se já protocolar" />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={salvar} className="px-4 py-2 rounded-lg text-[13px] font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-all">Salvar Processo</button>
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg text-[13px] font-semibold bg-secondary text-foreground border border-border">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function IF({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="bg-secondary border border-border text-foreground px-3 py-2 rounded-md text-[13px] focus:outline-none focus:border-primary w-full" />
    </div>
  );
}
