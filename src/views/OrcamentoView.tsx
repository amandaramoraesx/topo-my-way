import { useState } from "react";
import ModelosView from "@/views/ModelosView";

export default function OrcamentoView() {
  const [activeTab, setActiveTab] = useState<"orcamento" | "modelos">("orcamento");

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab("orcamento")}
          className={`px-4 py-2.5 text-[13px] font-medium border-b-2 transition-all ${
            activeTab === "orcamento"
              ? "text-primary border-primary font-bold"
              : "text-muted-foreground border-transparent hover:text-foreground"
          }`}
        >
          📋 Orçamento
        </button>
        <button
          onClick={() => setActiveTab("modelos")}
          className={`px-4 py-2.5 text-[13px] font-medium border-b-2 transition-all ${
            activeTab === "modelos"
              ? "text-primary border-primary font-bold"
              : "text-muted-foreground border-transparent hover:text-foreground"
          }`}
        >
          📄 Referência
        </button>
      </div>

      {activeTab === "orcamento" && (
        <div className="grid grid-cols-[420px_1fr] gap-5 h-[calc(100vh-180px)] overflow-hidden">
          <div className="overflow-y-auto pr-1">
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="mb-3.5 text-[15px] font-bold">📋 Dados do Orçamento</h3>
              <div className="space-y-3">
                <InputField label="Cliente" placeholder="Nome do cliente" />
                <SelectField label="Tipo de Serviço" options={["Georreferenciamento Rural","Levantamento Topográfico Urbano","Usucapião","Desmembramento de Imóvel","Demarcação de Lotes","Loteamento Urbano","CCIR","CAR — Cadastro Ambiental Rural","Inventário Florestal","Laudo Técnico / Perícia","Assessoria Ambiental"]} />
                <div className="grid grid-cols-2 gap-2.5">
                  <InputField label="Área Aproximada" placeholder="Ex: 5 ha, 1200 m²" />
                  <InputField label="Município" placeholder="Cidade/UF" />
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <InputField label="Prazo Desejado" placeholder="Ex: 15 dias úteis" />
                  <SelectField label="Complexidade" options={["Normal","Moderada","Alta","Muito Alta"]} />
                </div>
                <TextAreaField label="Observações adicionais" placeholder="Informações extras..." />
                <div className="grid grid-cols-2 gap-2.5">
                  <InputField label="Valor Base (R$)" placeholder="Deixe em branco para IA calcular" type="number" />
                  <SelectField label="Validade da Proposta" options={["7 dias","15 dias","30 dias"]} />
                </div>
                <button className="w-full bg-gradient-to-r from-primary to-accent text-background font-mono text-xs px-6 py-3 rounded-lg font-bold tracking-wide hover:opacity-90 hover:-translate-y-px transition-all">
                  📋 GERAR PROPOSTA COMERCIAL
                </button>
              </div>
            </div>
          </div>
          <div className="overflow-y-auto pr-1">
            <div className="text-center py-16 text-muted-foreground">
              <div className="text-[40px] mb-3">💼</div>
              <p>Preencha os dados e a IA gera<br />uma proposta profissional completa</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === "modelos" && (
        <ModelosView categoryFilter="orcamento" />
      )}
    </div>
  );
}

function InputField({ label, placeholder, type = "text" }: { label: string; placeholder?: string; type?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">{label}</label>
      <input type={type} placeholder={placeholder} className="bg-secondary border border-border text-foreground px-3 py-2 rounded-md text-[13px] focus:outline-none focus:border-primary w-full" />
    </div>
  );
}

function SelectField({ label, options }: { label: string; options: string[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">{label}</label>
      <select className="bg-secondary border border-border text-foreground px-3 py-2 rounded-md text-[13px] focus:outline-none focus:border-primary w-full">
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
}

function TextAreaField({ label, placeholder }: { label: string; placeholder?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">{label}</label>
      <textarea placeholder={placeholder} rows={3} className="bg-secondary border border-border text-foreground px-3 py-2.5 rounded-md text-xs font-mono resize-y min-h-[90px] w-full focus:outline-none focus:border-primary" />
    </div>
  );
}
