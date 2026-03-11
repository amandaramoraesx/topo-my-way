import { useState } from "react";
import { useApp, type Financa } from "@/context/AppContext";

export default function FinanceiroView() {
  const { financas, setFinancas } = useApp();
  const [tipo, setTipo] = useState("receita");
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [desc, setDesc] = useState("");
  const [valor, setValor] = useState("");
  const [cat, setCat] = useState("Georreferenciamento");
  const [filtro, setFiltro] = useState("todos");

  const mes = new Date().getMonth();
  const ano = new Date().getFullYear();
  const rec = financas.filter(f => f.tipo === "receita" && new Date(f.data).getMonth() === mes && new Date(f.data).getFullYear() === ano).reduce((s, f) => s + f.valor, 0);
  const arec = financas.filter(f => f.tipo === "a_receber").reduce((s, f) => s + f.valor, 0);
  const desp = financas.filter(f => f.tipo === "despesa" && new Date(f.data).getMonth() === mes && new Date(f.data).getFullYear() === ano).reduce((s, f) => s + f.valor, 0);
  const margem = rec > 0 ? ((rec - desp) / rec * 100).toFixed(0) + "%" : "0%";
  const fmt = (v: number) => "R$" + v.toLocaleString("pt-BR", { minimumFractionDigits: 0 });

  const itens = filtro === "todos" ? financas : financas.filter(f => f.tipo === filtro);

  const adicionar = () => {
    if (!desc || !valor) return;
    const updated = [...financas, { id: Date.now(), tipo, data, desc, valor: parseFloat(valor), cat }];
    setFinancas(updated);
    localStorage.setItem("rt_financas", JSON.stringify(updated));
    setDesc(""); setValor("");
  };

  const del = (id: number) => {
    const updated = financas.filter(f => f.id !== id);
    setFinancas(updated);
    localStorage.setItem("rt_financas", JSON.stringify(updated));
  };

  return (
    <div>
      <div className="grid grid-cols-4 gap-4 mb-5">
        {[
          { v: fmt(rec), l: "Recebido no Mês", c: "text-success" },
          { v: fmt(arec), l: "A Receber", c: "text-gold" },
          { v: fmt(desp), l: "Despesas do Mês", c: "text-warning" },
          { v: margem, l: "Margem Líquida", c: "text-primary" },
        ].map((s, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-5">
            <div className={`text-3xl font-bold font-mono ${s.c}`}>{s.v}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.l}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-5">
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="mb-3.5 text-sm font-bold">+ Novo Lançamento</h3>
          <div className="space-y-2.5">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">Tipo</label>
                <select value={tipo} onChange={e => setTipo(e.target.value)} className="bg-secondary border border-border text-foreground px-3 py-2 rounded-md text-[13px] focus:outline-none focus:border-primary">
                  <option value="receita">💚 Receita</option>
                  <option value="despesa">🔴 Despesa</option>
                  <option value="a_receber">🟡 A Receber</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">Data</label>
                <input type="date" value={data} onChange={e => setData(e.target.value)} className="bg-secondary border border-border text-foreground px-3 py-2 rounded-md text-[13px] focus:outline-none focus:border-primary" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">Descrição</label>
              <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Ex: Georreferenciamento - Fazenda Boa Vista" className="bg-secondary border border-border text-foreground px-3 py-2 rounded-md text-[13px] focus:outline-none focus:border-primary w-full" />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">Valor (R$)</label>
                <input type="number" value={valor} onChange={e => setValor(e.target.value)} placeholder="0,00" className="bg-secondary border border-border text-foreground px-3 py-2 rounded-md text-[13px] focus:outline-none focus:border-primary w-full" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">Categoria</label>
                <select value={cat} onChange={e => setCat(e.target.value)} className="bg-secondary border border-border text-foreground px-3 py-2 rounded-md text-[13px] focus:outline-none focus:border-primary">
                  {["Georreferenciamento","Levantamento","Usucapião","Desmembramento","CCIR/CAR","Laudo","Assessoria","Despesa Operacional","Outros"].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            </div>
            <button onClick={adicionar} className="px-4 py-2 rounded-lg text-[13px] font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-all">+ Adicionar Lançamento</button>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3.5 border-b border-border flex justify-between items-center">
            <span className="font-bold text-sm">Lançamentos</span>
            <select value={filtro} onChange={e => setFiltro(e.target.value)} className="bg-secondary border border-border text-foreground px-2 py-1 rounded-md text-xs focus:outline-none focus:border-primary">
              <option value="todos">Todos</option>
              <option value="receita">Receitas</option>
              <option value="despesa">Despesas</option>
              <option value="a_receber">A Receber</option>
            </select>
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            {itens.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-[13px]">Nenhum lançamento ainda</div>
            ) : (
              itens.slice().reverse().map(f => (
                <div key={f.id} className="flex items-center justify-between px-3.5 py-2.5 border-b border-border">
                  <div>
                    <div className="text-[13px]">{f.desc}</div>
                    <div className="text-[11px] text-muted-foreground">{f.cat} · {f.data}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-mono text-[13px] font-bold ${f.tipo === "receita" ? "text-success" : f.tipo === "despesa" ? "text-warning" : ""}`}>
                      {f.tipo === "despesa" ? "-" : "+"}R${f.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                    <button onClick={() => del(f.id)} className="text-muted-foreground hover:text-warning transition-colors">✕</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
