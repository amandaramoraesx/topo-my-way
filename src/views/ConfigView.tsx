import { useState } from "react";
import { useApp } from "@/context/AppContext";

export default function ConfigView() {
  const { apiKey, setApiKey, provider, setProvider, model, setModel, empresa, setEmpresa } = useApp();
  const [localKey, setLocalKey] = useState(apiKey ? "••••••••••••••••••••••" : "");
  const [localProvider, setLocalProvider] = useState(provider);
  const [localModel, setLocalModel] = useState(model);
  const [emp, setEmp] = useState(empresa);
  const [apiStatus, setApiStatus] = useState("");

  const salvarAPI = () => {
    if (localKey && !localKey.startsWith("•")) { setApiKey(localKey); localStorage.setItem("rt_api_key", localKey); }
    setProvider(localProvider); localStorage.setItem("rt_provider", localProvider);
    setModel(localModel); localStorage.setItem("rt_model", localModel);
    setApiStatus(`✅ Salvo! Usando: ${localProvider === "gemini" ? "Gemini (Gratuito)" : "Claude (Anthropic)"}`);
  };

  const salvarEmpresa = () => {
    setEmpresa(emp);
    localStorage.setItem("rt_empresa", JSON.stringify(emp));
    alert("✅ Dados da empresa salvos!");
  };

  const tools = [
    { name: "TopoGEO v2", status: "✓ Pronto", cls: "bg-success/20 text-success" },
    { name: "Exigência Zero", status: "✓ Pronto", cls: "bg-success/20 text-success" },
    { name: "Orçamento IA", status: "✓ Pronto", cls: "bg-success/20 text-success" },
    { name: "Laudos & Perícias", status: "✓ Pronto", cls: "bg-success/20 text-success" },
    { name: "Financeiro", status: "✓ Pronto", cls: "bg-success/20 text-success" },
    { name: "Instagram IA", status: "✓ Pronto", cls: "bg-success/20 text-success" },
    { name: "Agente SIGEF", status: "Fase 2", cls: "bg-accent/20 text-accent" },
    { name: "Agente Cartório", status: "Fase 2", cls: "bg-accent/20 text-accent" },
  ];

  return (
    <div className="grid grid-cols-2 gap-5">
      <div className="space-y-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="mb-3.5 text-[15px] font-bold">🔑 Configuração de IA</h3>
          <div className="space-y-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">Provedor de IA</label>
              <select value={localProvider} onChange={e => setLocalProvider(e.target.value as any)} className="bg-secondary border border-border text-foreground px-3 py-2 rounded-md text-[13px] focus:outline-none focus:border-primary">
                <option value="anthropic">Anthropic — Claude (Pago, melhor qualidade)</option>
                <option value="gemini">Google — Gemini (Gratuito ✦)</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">Chave de API</label>
              <input type="password" value={localKey} onChange={e => setLocalKey(e.target.value)} placeholder={localProvider === "gemini" ? "AIzaSy..." : "sk-ant-..."} className="bg-secondary border border-border text-foreground px-3 py-2 rounded-md text-[13px] focus:outline-none focus:border-primary w-full" />
              <span className="text-[11px] text-muted-foreground">{localProvider === "gemini" ? "Obter em: aistudio.google.com → Get API Key (gratuito)" : "Obter em: console.anthropic.com"}</span>
            </div>
            {localProvider === "anthropic" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">Modelo de IA</label>
                <select value={localModel} onChange={e => setLocalModel(e.target.value)} className="bg-secondary border border-border text-foreground px-3 py-2 rounded-md text-[13px] focus:outline-none focus:border-primary">
                  <option value="claude-sonnet-4-6">claude-sonnet-4-6 (Recomendado)</option>
                  <option value="claude-haiku-4-5-20251001">claude-haiku-4-5 (Mais rápido/barato)</option>
                </select>
              </div>
            )}
            {localProvider === "gemini" && (
              <div className="p-3 rounded-lg bg-accent/10 border border-accent/20 text-accent text-xs">
                🆓 <strong>Como obter chave Gemini gratuita:</strong><br />1. Acesse aistudio.google.com<br />2. Clique em Get API Key<br />3. Crie um projeto e copie a chave
              </div>
            )}
            <button onClick={salvarAPI} className="px-4 py-2 rounded-lg text-[13px] font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-all">💾 Salvar Configurações de API</button>
            {apiStatus && <div className="text-xs text-muted-foreground">{apiStatus}</div>}
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="mb-3.5 text-[15px] font-bold">🏢 Dados da Empresa</h3>
          <div className="space-y-3">
            <IF label="Nome da Empresa" value={emp.nome} onChange={v => setEmp(p => ({ ...p, nome: v }))} />
            <IF label="Responsável Técnico" value={emp.rt} onChange={v => setEmp(p => ({ ...p, rt: v }))} placeholder="Nome do topógrafo" />
            <div className="grid grid-cols-2 gap-2.5">
              <IF label="CREA / CONFEA" value={emp.crea} onChange={v => setEmp(p => ({ ...p, crea: v }))} />
              <IF label="Telefone" value={emp.tel} onChange={v => setEmp(p => ({ ...p, tel: v }))} placeholder="(00) 00000-0000" />
            </div>
            <IF label="E-mail" value={emp.email} onChange={v => setEmp(p => ({ ...p, email: v }))} placeholder="email@empresa.com" />
            <IF label="Cidade/UF" value={emp.cidade} onChange={v => setEmp(p => ({ ...p, cidade: v }))} placeholder="Ex: Goiânia/GO" />
            <button onClick={salvarEmpresa} className="px-4 py-2 rounded-lg text-[13px] font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-all">💾 Salvar Dados da Empresa</button>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="mb-3.5 text-[15px] font-bold">📊 Status do Sistema</h3>
          <div className="flex flex-col gap-2.5 text-[13px]">
            {tools.map(t => (
              <div key={t.name} className="flex justify-between items-center p-2 bg-secondary rounded-md">
                <span>{t.name}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${t.cls}`}>{t.status}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="mb-2.5 text-[15px] font-bold">ℹ️ Sobre</h3>
          <div className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Rodrigues Topografia — Hub Central</strong><br />
            Versão 2.0 — Março 2026<br />
            Desenvolvido com Claude (Anthropic)<br /><br />
            Topógrafo Agrimensor Credenciado INCRA<br />
            Fase 1 completa · Fase 2 em andamento
          </div>
        </div>
      </div>
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
