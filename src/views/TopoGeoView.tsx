import { useState, useCallback, useRef, useEffect } from "react";
import type { Vertice } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import ModelosView from "@/views/ModelosView";

function calcArea(pts: Vertice[]) {
  let a = 0;
  for (let i = 0; i < pts.length; i++) { const j = (i + 1) % pts.length; a += pts[i].e * pts[j].n - pts[j].e * pts[i].n; }
  return Math.abs(a) / 2;
}
function calcPerim(pts: Vertice[]) {
  let p = 0;
  for (let i = 0; i < pts.length; i++) { const j = (i + 1) % pts.length; p += Math.hypot(pts[j].e - pts[i].e, pts[j].n - pts[i].n); }
  return p;
}
function calcAz(p1: Vertice, p2: Vertice) {
  let az = Math.atan2(p2.e - p1.e, p2.n - p1.n) * 180 / Math.PI;
  return ((az % 360) + 360) % 360;
}
function fmtAz(deg: number) {
  const d = Math.floor(deg); const m = Math.floor((deg - d) * 60); const s = ((deg - d) * 3600 - m * 60).toFixed(1);
  return `${d}°${String(m).padStart(2, "0")}'${String(s).padStart(4, "0")}"`;
}

export default function TopoGeoView() {
  const { empresa } = useApp();
  const { session } = useAuth();
  const { toast } = useToast();
  const [vertices, setVertices] = useState<Vertice[]>([]);
  const [tipoServico, setTipoServico] = useState("georref_rural");
  const [activeTab, setActiveTab] = useState("memorial");
  const [memorialContent, setMemorialContent] = useState("");
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Form refs
  const [formData, setFormData] = useState({
    prop: "", denom: "", mun: "", uf: "", fuso: "22S", mat: "", cart: "", rt: "", crea: "", art: "", data: ""
  });

  const updateForm = (key: string, val: string) => setFormData(p => ({ ...p, [key]: val }));

  const area = vertices.length >= 3 ? calcArea(vertices) : 0;
  const perim = vertices.length >= 2 ? calcPerim(vertices) : 0;

  const addVertex = () => {
    setVertices(v => [...v, { label: `M-${String(v.length + 1).padStart(2, "0")}`, e: 0, n: 0, alt: 0, tipo: "M", cf: "" }]);
  };

  const updateVertex = (i: number, field: keyof Vertice, value: any) => {
    setVertices(v => v.map((vt, idx) => idx === i ? { ...vt, [field]: value } : vt));
  };

  const delVertex = (i: number) => setVertices(v => v.filter((_, idx) => idx !== i));

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const txt = ev.target?.result as string;
      const lines = txt.split("\n").map(l => l.trim()).filter(l => l && !/^#/.test(l));
      const vtxs: Vertice[] = [];
      for (const ln of lines) {
        let p: string[];
        if (/[,;]/.test(ln)) p = ln.split(/[,;]/);
        else p = ln.split(/\s+/);
        p = p.map(x => x.trim()).filter(Boolean);
        if (p.length >= 2) {
          const nums = p.map(x => parseFloat(x.replace(",", "."))).filter(n => !isNaN(n));
          if (nums.length >= 2) {
            const hasLabel = isNaN(parseFloat(p[0].replace(",", ".")));
            vtxs.push({ label: hasLabel ? p[0] : `V${vtxs.length + 1}`, e: nums[0], n: nums[1], alt: nums[2] || 0, tipo: "M", cf: "" });
          }
        }
      }
      if (vtxs.length) setVertices(vtxs);
    };
    reader.readAsText(file, "UTF-8");
  };

  const drawPlanta = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d")!;
    const v = vertices;
    ctx.fillStyle = "#0d1117"; ctx.fillRect(0, 0, cv.width, cv.height);
    if (v.length < 2) { ctx.fillStyle = "#64748b"; ctx.font = "14px DM Sans"; ctx.textAlign = "center"; ctx.fillText("Adicione vértices para ver a planta", cv.width / 2, cv.height / 2); return; }
    const es = v.map(x => x.e), ns = v.map(x => x.n);
    const minE = Math.min(...es), maxE = Math.max(...es), minN = Math.min(...ns), maxN = Math.max(...ns);
    const pad = 60, w = cv.width - pad * 2, h = cv.height - pad * 2;
    const sx = w / (maxE - minE || 1), sy = h / (maxN - minN || 1), sc = Math.min(sx, sy) * 0.85;
    const ox = pad + (w - sc * (maxE - minE)) / 2, oy = pad + (h - sc * (maxN - minN)) / 2;
    const tx = (e: number) => ox + sc * (e - minE), ty = (n: number) => cv.height - oy - sc * (n - minN);
    // grid
    ctx.strokeStyle = "#1e2d42"; ctx.lineWidth = 0.5;
    for (let i = 0; i <= 10; i++) { const x = pad + i * (cv.width - pad * 2) / 10; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, cv.height); ctx.stroke(); }
    for (let i = 0; i <= 8; i++) { const y = pad + i * (cv.height - pad * 2) / 8; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(cv.width, y); ctx.stroke(); }
    // polygon
    ctx.beginPath(); ctx.moveTo(tx(v[0].e), ty(v[0].n));
    v.forEach(pt => ctx.lineTo(tx(pt.e), ty(pt.n)));
    ctx.closePath(); ctx.fillStyle = "rgba(0,212,170,0.06)"; ctx.fill();
    ctx.strokeStyle = "#00d4aa"; ctx.lineWidth = 2; ctx.stroke();
    // vertices
    v.forEach(pt => {
      const x = tx(pt.e), y = ty(pt.n);
      ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fillStyle = "#00d4aa"; ctx.fill();
      ctx.fillStyle = "#e2e8f0"; ctx.font = "bold 11px Space Mono"; ctx.textAlign = "left"; ctx.fillText(pt.label, x + 8, y - 4);
    });
    // Info
    const ha = (calcArea(v) / 10000).toFixed(4);
    ctx.fillStyle = "#64748b"; ctx.font = "10px Space Mono"; ctx.textAlign = "left"; ctx.fillText(`Área: ${ha} ha | Vértices: ${v.length}`, 12, cv.height - 10);
  }, [vertices]);

  useEffect(() => { if (activeTab === "planta") drawPlanta(); }, [activeTab, drawPlanta]);

  const exportCSV = () => {
    if (!vertices.length) return;
    const csv = "Label,E(m),N(m),Altitude(m),Tipo\n" + vertices.map(p => `${p.label},${p.e},${p.n},${p.alt},${p.tipo}`).join("\n");
    downloadFile(csv, `vertices_${formData.denom || "projeto"}.csv`, "text/csv");
  };

  const exportDXF = () => {
    if (!vertices.length) return;
    let dxf = "0\nSECTION\n2\nENTITIES\n";
    dxf += "0\nLWPOLYLINE\n8\nPERIMETRO\n90\n" + vertices.length + "\n70\n1\n";
    vertices.forEach(p => { dxf += `10\n${p.e}\n20\n${p.n}\n30\n${p.alt}\n`; });
    dxf += "0\nENDSEC\n0\nEOF\n";
    downloadFile(dxf, `${formData.denom || "projeto"}.dxf`, "application/octet-stream");
  };

  const downloadFile = (content: string, name: string, mime: string) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([content], { type: mime }));
    a.download = name; a.click();
  };

  const generateMemorial = async () => {
    if (!session) {
      toast({ title: "Faça login para gerar o memorial", variant: "destructive" });
      return;
    }
    if (vertices.length < 3) {
      toast({ title: "Adicione pelo menos 3 vértices", variant: "destructive" });
      return;
    }
    setLoading(true);
    setMemorialContent("");
    setActiveTab("memorial");

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-memorial`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ vertices, formData, tipoServico }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Erro desconhecido" }));
        throw new Error(err.error || `Erro ${resp.status}`);
      }

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let content = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              content += delta;
              setMemorialContent(content);
            }
          } catch { /* partial JSON, skip */ }
        }
      }

      if (!content) {
        toast({ title: "Nenhum conteúdo gerado", variant: "destructive" });
      }
    } catch (e: any) {
      console.error("Memorial generation error:", e);
      toast({ title: e.message || "Erro ao gerar memorial", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const tabs = ["memorial", "planta", "volumes", "exportar", "modelos"];

  return (
    <div className="grid grid-cols-[420px_1fr] gap-5 h-[calc(100vh-116px)] overflow-hidden">
      {/* LEFT PANEL */}
      <div className="overflow-y-auto pr-1 space-y-3">
        {/* Tipo de Serviço */}
        <div className="bg-card border border-border rounded-xl p-5">
          <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">🏷️ Tipo de Serviço</label>
          <select value={tipoServico} onChange={e => setTipoServico(e.target.value)} className="w-full mt-1.5 bg-secondary border border-border text-foreground px-3 py-2 rounded-md text-[13px] focus:outline-none focus:border-primary">
            <option value="georref_rural">Georreferenciamento Rural (INCRA/SIGEF)</option>
            <option value="levant_urbano">Levantamento Topográfico Urbano</option>
            <option value="usucapiao">Usucapião</option>
            <option value="desmembramento">Desmembramento de Imóvel</option>
            <option value="demarcacao">Demarcação de Lotes</option>
            <option value="loteamento">Loteamento Urbano</option>
          </select>
        </div>

        {/* Import */}
        <div className="bg-card border border-border rounded-xl p-5">
          <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">📂 Importar Caderneta de Campo</label>
          <label className="mt-2 block border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer transition-all hover:border-primary hover:text-primary text-muted-foreground text-[13px]">
            <div className="text-2xl mb-1.5">📁</div>
            <strong>Arraste CSV/TXT</strong> ou clique para selecionar<br />
            <span className="text-[11px]">Detecta separadores automaticamente</span>
            <input type="file" accept=".csv,.txt" className="hidden" onChange={handleFileImport} />
          </label>
        </div>

        {/* Dados do Projeto */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-2.5">
          <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">📋 Dados do Projeto</label>
          <div className="grid grid-cols-2 gap-2.5">
            <InputField label="Proprietário" value={formData.prop} onChange={v => updateForm("prop", v)} placeholder="Nome completo" />
            <InputField label="Denominação do Imóvel" value={formData.denom} onChange={v => updateForm("denom", v)} placeholder="Ex: Fazenda Boa Vista" />
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            <InputField label="Município" value={formData.mun} onChange={v => updateForm("mun", v)} placeholder="Cidade" />
            <InputField label="Estado" value={formData.uf} onChange={v => updateForm("uf", v)} placeholder="UF" />
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">Fuso UTM</label>
              <select value={formData.fuso} onChange={e => updateForm("fuso", e.target.value)} className="bg-secondary border border-border text-foreground px-3 py-2 rounded-md text-[13px] focus:outline-none focus:border-primary">
                {["18S","19S","20S","21S","22S","23S","24S","25S"].map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <InputField label="Matrícula" value={formData.mat} onChange={v => updateForm("mat", v)} placeholder="Nº da matrícula" />
            <InputField label="Cartório / CRI" value={formData.cart} onChange={v => updateForm("cart", v)} placeholder="Nome do cartório" />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <InputField label="Responsável Técnico" value={formData.rt} onChange={v => updateForm("rt", v)} placeholder="Nome do engenheiro" />
            <InputField label="CREA / CONFEA" value={formData.crea} onChange={v => updateForm("crea", v)} placeholder="Nº registro" />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <InputField label="ART Nº" value={formData.art} onChange={v => updateForm("art", v)} placeholder="Número da ART" />
            <InputField label="Data do Levantamento" value={formData.data} onChange={v => updateForm("data", v)} type="date" />
          </div>
        </div>

        {/* Vértices */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">📍 Vértices ({vertices.length})</label>
            <div className="flex gap-1.5">
              <button onClick={addVertex} className="px-2.5 py-1 rounded-md text-xs font-semibold bg-secondary text-foreground border border-border hover:border-primary hover:text-primary transition-all">+ Vértice</button>
              <button onClick={() => setVertices([])} className="px-2.5 py-1 rounded-md text-xs font-semibold bg-secondary text-foreground border border-border hover:border-primary hover:text-primary transition-all">Limpar</button>
            </div>
          </div>
          {vertices.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-secondary">
                    {["Label","E (m)","N (m)","Alt.(m)","Tipo","Confrontante",""].map((h,i) => (
                      <th key={i} className="px-2.5 py-2 text-left text-[10px] text-muted-foreground uppercase tracking-wide border-b border-border">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {vertices.map((v, i) => (
                    <tr key={i} className="hover:bg-secondary/50">
                      <td className="px-1 py-1"><input className="bg-transparent border-none text-foreground font-mono text-[11px] w-16 p-0.5 focus:outline-primary focus:outline-1 rounded" value={v.label} onChange={e => updateVertex(i, "label", e.target.value)} /></td>
                      <td className="px-1 py-1"><input className="bg-transparent border-none text-foreground font-mono text-[11px] w-20 p-0.5 focus:outline-primary focus:outline-1 rounded" value={v.e.toFixed(3)} onChange={e => updateVertex(i, "e", parseFloat(e.target.value) || 0)} /></td>
                      <td className="px-1 py-1"><input className="bg-transparent border-none text-foreground font-mono text-[11px] w-20 p-0.5 focus:outline-primary focus:outline-1 rounded" value={v.n.toFixed(3)} onChange={e => updateVertex(i, "n", parseFloat(e.target.value) || 0)} /></td>
                      <td className="px-1 py-1"><input className="bg-transparent border-none text-foreground font-mono text-[11px] w-16 p-0.5 focus:outline-primary focus:outline-1 rounded" value={v.alt.toFixed(2)} onChange={e => updateVertex(i, "alt", parseFloat(e.target.value) || 0)} /></td>
                      <td className="px-1 py-1">
                        <select className="bg-transparent border-none text-foreground font-mono text-[11px] w-12" value={v.tipo} onChange={e => updateVertex(i, "tipo", e.target.value)}>
                          <option>M</option><option>P</option><option>V</option>
                        </select>
                      </td>
                      <td className="px-1 py-1"><input className="bg-transparent border-none text-foreground font-mono text-[11px] w-32 p-0.5 focus:outline-primary focus:outline-1 rounded" placeholder="quem faz divisa" value={v.cf} onChange={e => updateVertex(i, "cf", e.target.value)} /></td>
                      <td className="px-1 py-1"><button onClick={() => delVertex(i)} className="text-warning text-sm">✕</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {/* Stats bar */}
          <div className="flex gap-4 mt-3 p-3 bg-secondary rounded-lg border border-border">
            <div className="text-center flex-1"><div className="font-mono text-sm font-bold text-primary">{vertices.length}</div><div className="text-[10px] text-muted-foreground">Vértices</div></div>
            <div className="text-center flex-1"><div className="font-mono text-sm font-bold text-primary">{(area / 10000).toFixed(4)}</div><div className="text-[10px] text-muted-foreground">Área (ha)</div></div>
            <div className="text-center flex-1"><div className="font-mono text-sm font-bold text-primary">{perim.toFixed(3)}</div><div className="text-[10px] text-muted-foreground">Perímetro (m)</div></div>
          </div>
        </div>

        {/* Actions */}
        <button onClick={generateMemorial} disabled={loading} className="w-full bg-gradient-to-r from-primary to-accent text-background font-mono text-xs px-6 py-3 rounded-lg font-bold tracking-wide hover:opacity-90 hover:-translate-y-px transition-all disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? "⏳ GERANDO MEMORIAL..." : "✦ GERAR MEMORIAL COM IA"}
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-secondary text-foreground border border-border hover:border-primary hover:text-primary transition-all">📊 Calcular Volumes</button>
          <button className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-secondary text-foreground border border-border hover:border-primary hover:text-primary transition-all">📊 Exportar ODS SIGEF</button>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="overflow-y-auto pr-1">
        <div className="flex border-b border-border mb-5">
          {tabs.map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-2.5 text-[13px] font-medium border-b-2 transition-all ${activeTab === t ? "text-primary border-primary font-bold" : "text-muted-foreground border-transparent hover:text-foreground"}`}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === "memorial" && (
          memorialContent ? (
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-foreground">Memorial Descritivo</h3>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(memorialContent);
                    toast({ title: "Memorial copiado!" });
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-secondary text-foreground border border-border hover:border-primary hover:text-primary transition-all"
                >
                  📋 Copiar
                </button>
              </div>
              <div className="prose prose-sm max-w-none text-foreground font-mono text-[12px] leading-relaxed whitespace-pre-wrap">
                {memorialContent}
              </div>
              {loading && <div className="mt-3 text-xs text-primary animate-pulse">Gerando...</div>}
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <div className="text-[40px] mb-3">📄</div>
              <p>Preencha os dados e clique em<br /><strong className="text-primary">✦ Gerar Memorial com IA</strong></p>
            </div>
          )
        )}

        {activeTab === "planta" && (
          <div className="text-center p-5">
            <canvas ref={canvasRef} width={680} height={600} className="bg-[#0d1117] rounded-lg border border-border max-w-full" />
            <div className="mt-2.5">
              <button onClick={drawPlanta} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-secondary text-foreground border border-border hover:border-primary hover:text-primary transition-all">🔄 Redesenhar</button>
            </div>
          </div>
        )}

        {activeTab === "exportar" && (
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: "🗂️", name: "DXF — AutoCAD", desc: "3 layers: PERIMETRO, VERTICES, TEXTOS", onClick: exportDXF },
              { icon: "📊", name: "CSV — Coordenadas", desc: "Planilha com todos os vértices UTM", onClick: exportCSV },
              { icon: "🌍", name: "KML — Google Earth", desc: "Polígono + pontos no Google Earth" },
              { icon: "📝", name: "DOC — Memorial Word", desc: "Memorial formatado para Word" },
              { icon: "🖼️", name: "SVG — Planta", desc: "Planta vetorial escalada" },
              { icon: "📋", name: "ODS — SIGEF/INCRA", desc: "Planilha padrão SIGEF", highlight: true },
            ].map((exp, i) => (
              <div key={i} onClick={exp.onClick} className={`bg-card border rounded-xl p-5 cursor-pointer transition-all hover:border-primary ${exp.highlight ? "border-primary/30 bg-primary/5" : "border-border"}`}>
                <div className="text-2xl mb-2">{exp.icon}</div>
                <div className={`font-bold ${exp.highlight ? "text-primary" : ""}`}>{exp.name}</div>
                <div className="text-xs text-muted-foreground mt-1">{exp.desc}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "volumes" && (
          <div className="text-center py-16 text-muted-foreground text-[13px]">
            Configure os parâmetros e clique em Calcular.
          </div>
        )}

        {activeTab === "modelos" && (
          <ModelosView />
        )}
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="bg-secondary border border-border text-foreground px-3 py-2 rounded-md text-[13px] focus:outline-none focus:border-primary w-full" />
    </div>
  );
}
