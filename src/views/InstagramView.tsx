export default function InstagramView() {
  return (
    <div className="grid grid-cols-[420px_1fr] gap-5 h-[calc(100vh-116px)] overflow-hidden">
      <div className="overflow-y-auto pr-1 space-y-3">
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="mb-3.5 text-[15px] font-bold">📸 Gerador de Conteúdo</h3>
          <div className="space-y-3">
            <SF label="Tipo de Post" options={[
              {v:"projeto_concluido",l:"✅ Projeto Concluído"},{v:"equipe_campo",l:"🔭 Equipe em Campo"},
              {v:"dica_tecnica",l:"💡 Dica Técnica"},{v:"servico_destaque",l:"⭐ Serviço em Destaque"},
              {v:"curiosidade",l:"🤔 Curiosidade Topográfica"},{v:"antes_depois",l:"📐 Antes e Depois"},
              {v:"institucional",l:"🏢 Post Institucional"},{v:"data_comemorativa",l:"🗓️ Data Comemorativa"},
            ]} />
            <SF label="Serviço Realizado" options={["Georreferenciamento Rural","Levantamento Topográfico","Usucapião","Desmembramento","Demarcação de Lotes","CAR / CCIR","Laudo Técnico","Inventário Florestal"].map(s => ({v:s,l:s}))} />
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">Detalhes / Contexto</label>
              <textarea placeholder="Ex: Georreferenciamos uma propriedade de 45 ha em Goiás..." rows={4} className="bg-secondary border border-border text-foreground px-3 py-2.5 rounded-md text-xs font-mono resize-y min-h-[90px] w-full focus:outline-none focus:border-primary" />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <SF label="Tom" options={[{v:"profissional",l:"Profissional"},{v:"descontraido",l:"Descontraído"},{v:"tecnico",l:"Técnico"},{v:"motivacional",l:"Motivacional"}]} />
              <SF label="Qtd. de Hashtags" options={[{v:"15",l:"15 hashtags"},{v:"20",l:"20 hashtags"},{v:"30",l:"30 hashtags"}]} />
            </div>
            <button className="w-full bg-gradient-to-r from-primary to-accent text-background font-mono text-xs px-6 py-3 rounded-lg font-bold tracking-wide hover:opacity-90 hover:-translate-y-px transition-all">
              📸 GERAR CONTEÚDO PARA INSTAGRAM
            </button>
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-[13px] mb-2.5 font-bold">💡 Ideias de Pautas</h3>
          <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
            <span>📌 "O que é georreferenciamento e por que você precisa?"</span>
            <span>📌 "5 motivos para regularizar seu imóvel rural"</span>
            <span>📌 "Diferença entre usucapião ordinária e extraordinária"</span>
            <span>📌 "Como funciona o SIGEF/INCRA na prática"</span>
            <span>📌 "Antes e depois: regularização de imóvel rural"</span>
          </div>
        </div>
      </div>
      <div className="overflow-y-auto pr-1">
        <div className="text-center py-16 text-muted-foreground">
          <div className="text-[40px] mb-3">📱</div>
          <p>Selecione o tipo de post e<br />clique em <strong className="text-primary">Gerar Conteúdo</strong></p>
        </div>
      </div>
    </div>
  );
}

function SF({ label, options }: { label: string; options: { v: string; l: string }[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">{label}</label>
      <select className="bg-secondary border border-border text-foreground px-3 py-2 rounded-md text-[13px] focus:outline-none focus:border-primary w-full">
        {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  );
}
