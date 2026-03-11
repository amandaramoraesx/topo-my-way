import { useState } from "react";

export default function ExigenciaView() {
  const [formData, setFormData] = useState({ prof: "Rodrigues Topografia", cart: "", tipo: "Erro no Memorial Descritivo", texto: "", memorial: "" });
  const update = (k: string, v: string) => setFormData(p => ({ ...p, [k]: v }));

  return (
    <div className="grid grid-cols-[420px_1fr] gap-5 h-[calc(100vh-116px)] overflow-hidden">
      <div className="overflow-y-auto pr-1">
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <Field label="Profissional / Empresa" value={formData.prof} onChange={v => update("prof", v)} placeholder="Rodrigues Topografia" />
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Cartório / CRI" value={formData.cart} onChange={v => update("cart", v)} placeholder="Ex: 1º CRI de Goiânia" />
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">Tipo de Exigência</label>
              <select value={formData.tipo} onChange={e => update("tipo", e.target.value)} className="bg-secondary border border-border text-foreground px-3 py-2 rounded-md text-[13px] focus:outline-none focus:border-primary">
                {["Erro no Memorial Descritivo","Divergência de Área","Confrontantes Incorretos","Coordenadas Fora do Padrão","ART Ausente ou Inválida","Outro"].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">Texto da Exigência</label>
            <textarea value={formData.texto} onChange={e => update("texto", e.target.value)} placeholder="Cole o texto da exigência do cartório aqui..." rows={5} className="bg-secondary border border-border text-foreground px-3 py-2.5 rounded-md text-xs font-mono resize-y min-h-[90px] w-full focus:outline-none focus:border-primary" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">Memorial Atual (opcional)</label>
            <textarea value={formData.memorial} onChange={e => update("memorial", e.target.value)} placeholder="Cole o memorial que foi rejeitado..." rows={5} className="bg-secondary border border-border text-foreground px-3 py-2.5 rounded-md text-xs font-mono resize-y min-h-[90px] w-full focus:outline-none focus:border-primary" />
          </div>
          <button className="w-full bg-gradient-to-r from-primary to-accent text-background font-mono text-xs px-6 py-3 rounded-lg font-bold tracking-wide hover:opacity-90 hover:-translate-y-px transition-all">
            ⚖️ RESOLVER EXIGÊNCIA COM IA
          </button>
        </div>
      </div>
      <div className="overflow-y-auto pr-1">
        <div className="text-center py-16 text-muted-foreground">
          <div className="text-[40px] mb-3">⚖️</div>
          <p>Preencha os dados da exigência<br />e clique em <strong className="text-primary">Resolver com IA</strong></p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="bg-secondary border border-border text-foreground px-3 py-2 rounded-md text-[13px] focus:outline-none focus:border-primary w-full" />
    </div>
  );
}
