import { useState } from "react";
import { useApp, type Projeto } from "@/context/AppContext";

export default function ProjetosView() {
  const { projetos, setProjetos } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ nome: "", tipo: "Georreferenciamento Rural", cliente: "", status: "em_andamento", prazo: "", valor: "", obs: "" });
  const update = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const statusMap: Record<string, string> = { em_andamento: "🔵 Em Andamento", exigencia: "🔴 Exigência", aguardando: "🟡 Aguardando", concluido: "🟢 Concluído" };

  const salvar = () => {
    if (!form.nome) return;
    const updated = [...projetos, { id: Date.now(), ...form }];
    setProjetos(updated);
    localStorage.setItem("rt_projetos", JSON.stringify(updated));
    setModalOpen(false);
    setForm({ nome: "", tipo: "Georreferenciamento Rural", cliente: "", status: "em_andamento", prazo: "", valor: "", obs: "" });
  };

  const del = (id: number) => {
    const updated = projetos.filter(p => p.id !== id);
    setProjetos(updated);
    localStorage.setItem("rt_projetos", JSON.stringify(updated));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <div>
          <div className="text-xl font-bold">Projetos</div>
          <div className="text-[13px] text-muted-foreground">Acompanhe todos os projetos da Rodrigues Topografia</div>
        </div>
        <button onClick={() => setModalOpen(true)} className="px-4 py-2 rounded-lg text-[13px] font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-all">+ Novo Projeto</button>
      </div>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-secondary">
              {["Projeto","Tipo","Cliente","Status","Prazo","Valor","Ações"].map(h => (
                <th key={h} className="px-2.5 py-2 text-left text-[10px] text-muted-foreground uppercase tracking-wide border-b border-border">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {projetos.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-10 text-muted-foreground">Nenhum projeto cadastrado.</td></tr>
            ) : (
              projetos.map(p => (
                <tr key={p.id} className="hover:bg-secondary/30">
                  <td className="px-2.5 py-2 font-semibold border-b border-border">{p.nome}</td>
                  <td className="px-2.5 py-2 border-b border-border"><span className="text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded">{p.tipo}</span></td>
                  <td className="px-2.5 py-2 border-b border-border">{p.cliente || "—"}</td>
                  <td className="px-2.5 py-2 border-b border-border">{statusMap[p.status] || p.status}</td>
                  <td className="px-2.5 py-2 border-b border-border font-mono">{p.prazo || "—"}</td>
                  <td className="px-2.5 py-2 border-b border-border font-mono text-success">{p.valor ? `R$${parseFloat(p.valor).toLocaleString("pt-BR")}` : "—"}</td>
                  <td className="px-2.5 py-2 border-b border-border"><button onClick={() => del(p.id)} className="px-2 py-1 rounded text-xs bg-destructive/10 text-destructive border border-destructive/20">✕</button></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-background/80 z-[9999] flex items-center justify-center" onClick={e => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-[540px]">
            <div className="text-base font-bold mb-1">Novo Projeto</div>
            <div className="text-xs text-muted-foreground mb-4">Cadastre um novo projeto no sistema</div>
            <div className="space-y-2.5">
              <IF label="Nome do Projeto" value={form.nome} onChange={v => update("nome", v)} placeholder="Ex: Georrefer. Fazenda Boa Vista" />
              <div className="grid grid-cols-2 gap-2.5">
                <SF label="Tipo de Serviço" value={form.tipo} onChange={v => update("tipo", v)} options={["Georreferenciamento Rural","Levantamento Urbano","Usucapião","Desmembramento","Demarcação de Lotes","CCIR","CAR","Inventário Florestal","Laudo Técnico","Assessoria Ambiental"]} />
                <SF label="Status" value={form.status} onChange={v => update("status", v)} options={[{v:"em_andamento",l:"🔵 Em Andamento"},{v:"exigencia",l:"🔴 Com Exigência"},{v:"aguardando",l:"🟡 Aguardando Doc."},{v:"concluido",l:"🟢 Concluído"}]} />
              </div>
              <IF label="Cliente" value={form.cliente} onChange={v => update("cliente", v)} placeholder="Nome do cliente" />
              <div className="grid grid-cols-2 gap-2.5">
                <IF label="Prazo" value={form.prazo} onChange={v => update("prazo", v)} type="date" />
                <IF label="Valor (R$)" value={form.valor} onChange={v => update("valor", v)} type="number" placeholder="0,00" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={salvar} className="px-4 py-2 rounded-lg text-[13px] font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-all">Salvar Projeto</button>
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg text-[13px] font-semibold bg-secondary text-foreground border border-border hover:border-primary hover:text-primary transition-all">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function IF({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="bg-secondary border border-border text-foreground px-3 py-2 rounded-md text-[13px] focus:outline-none focus:border-primary w-full" />
    </div>
  );
}

function SF({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: (string | { v: string; l: string })[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)} className="bg-secondary border border-border text-foreground px-3 py-2 rounded-md text-[13px] focus:outline-none focus:border-primary w-full">
        {options.map(o => typeof o === "string" ? <option key={o}>{o}</option> : <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  );
}
