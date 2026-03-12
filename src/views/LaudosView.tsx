import { useState, lazy, Suspense } from "react";

const ModelosView = lazy(() => import("@/views/ModelosView"));

export default function LaudosView() {
  const [activeTab, setActiveTab] = useState<"laudo" | "referência">("laudo");
  const tabs = ["laudo", "referência"];

  return (
    <div className="space-y-4">
      <div className="flex border-b border-border">
        {tabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t as any)} className={`px-4 py-2.5 text-[13px] font-medium border-b-2 transition-all ${activeTab === t ? "text-primary border-primary font-bold" : "text-muted-foreground border-transparent hover:text-foreground"}`}>
            {t === "laudo" ? "📋 Laudo" : "📄 Referência"}
          </button>
        ))}
      </div>

      {activeTab === "laudo" && (
        <div className="grid grid-cols-[420px_1fr] gap-5 h-[calc(100vh-170px)] overflow-hidden">
          <div className="overflow-y-auto pr-1">
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="mb-3.5 text-[15px] font-bold">📄 Dados do Laudo</h3>
              <div className="space-y-3">
                <SF label="Tipo de Laudo" options={["Laudo de Avaliação de Imóvel Rural","Laudo de Avaliação de Imóvel Urbano","Laudo Pericial Topográfico","Laudo de Vistoria de Obra","Laudo de Confrontação de Limites","Laudo de Inventário Florestal","Laudo Ambiental"]} />
                <IF label="Solicitante / Contratante" placeholder="Nome completo / Razão social" />
                <div className="grid grid-cols-2 gap-2.5">
                  <IF label="Imóvel / Objeto" placeholder="Descrição do imóvel" />
                  <IF label="Município/UF" placeholder="Cidade/UF" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">Situação / Fatos Relevantes</label>
                  <textarea placeholder="Descreva a situação..." rows={5} className="bg-secondary border border-border text-foreground px-3 py-2.5 rounded-md text-xs font-mono resize-y min-h-[90px] w-full focus:outline-none focus:border-primary" />
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <IF label="Área (m² ou ha)" placeholder="Ex: 1.250,00 m²" />
                  <SF label="Finalidade" options={["Judicial","Extrajudicial","Bancário/Financiamento","Compra e Venda","Inventário","Administrativo"]} />
                </div>
                <button className="w-full bg-gradient-to-r from-primary to-accent text-background font-mono text-xs px-6 py-3 rounded-lg font-bold tracking-wide hover:opacity-90 hover:-translate-y-px transition-all">
                  📄 GERAR LAUDO TÉCNICO COM IA
                </button>
              </div>
            </div>
          </div>
          <div className="overflow-y-auto pr-1">
            <div className="text-center py-16 text-muted-foreground">
              <div className="text-[40px] mb-3">📋</div>
              <p>Preencha os dados e a IA gera<br />um laudo técnico padrão ABNT</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "referência" && (
        <Suspense fallback={<div className="text-center py-16 text-muted-foreground text-[13px]">Carregando...</div>}>
          <ModelosView categoryFilter="laudo" />
        </Suspense>
      )}
    </div>
  );
}

function IF({ label, placeholder }: { label: string; placeholder?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">{label}</label>
      <input placeholder={placeholder} className="bg-secondary border border-border text-foreground px-3 py-2 rounded-md text-[13px] focus:outline-none focus:border-primary w-full" />
    </div>
  );
}
function SF({ label, options }: { label: string; options: string[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">{label}</label>
      <select className="bg-secondary border border-border text-foreground px-3 py-2 rounded-md text-[13px] focus:outline-none focus:border-primary w-full">
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
}
