import { createContext, useContext, useState, ReactNode } from "react";

type ViewId = 
  | "home" | "topogeo" | "exigencia" | "orcamento" | "laudos" 
  | "financeiro" | "projetos" | "instagram" | "config" 
  | "agente-sigef" | "agente-cart" | "licenc" | "modelos" | "funcionarios" | "clientes";

interface AppContextType {
  currentView: ViewId;
  setCurrentView: (view: ViewId) => void;
}

export interface EmpresaData {
  nome: string;
  rt: string;
  crea: string;
  tel: string;
  email: string;
  cidade: string;
}

export interface Projeto {
  id: number;
  nome: string;
  tipo: string;
  cliente: string;
  status: string;
  prazo: string;
  valor: string;
  obs: string;
}

export interface Financa {
  id: number;
  tipo: string;
  data: string;
  desc: string;
  valor: number;
  cat: string;
}

export interface Vertice {
  label: string;
  e: number;
  n: number;
  alt: number;
  tipo: string;
  cf: string;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentView, setCurrentView] = useState<ViewId>("home");

  return (
    <AppContext.Provider value={{ currentView, setCurrentView }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

export const viewMeta: Record<ViewId, { title: string; sub: string }> = {
  home: { title: "Dashboard", sub: "Rodrigues Topografia — Visão geral" },
  topogeo: { title: "TopoGEO v2", sub: "Memorial descritivo, planta, volumes e exportações" },
  exigencia: { title: "Exigência Zero", sub: "Resolva exigências de cartório com IA" },
  orcamento: { title: "Orçamento IA", sub: "Gere propostas comerciais profissionais" },
  laudos: { title: "Laudos & Perícias", sub: "Laudos técnicos padrão ABNT com IA" },
  financeiro: { title: "Financeiro", sub: "Controle de receitas e despesas" },
  projetos: { title: "Projetos", sub: "Acompanhe todos os projetos" },
  instagram: { title: "Instagram IA", sub: "Conteúdo para redes sociais da Rodrigues Topografia" },
  config: { title: "Configurações", sub: "API, empresa e sistema" },
  "agente-sigef": { title: "Agente SIGEF", sub: "Gestão de processos INCRA/SIGEF" },
  "agente-cart": { title: "Agente Cartório", sub: "Fase 2 — Em construção" },
  licenc: { title: "Licenciamento Ambiental", sub: "Fase 3 — Em breve" },
  modelos: { title: "Modelos & Templates", sub: "Memoriais descritivos e orçamentos padronizados" },
  funcionarios: { title: "Funcionários", sub: "Cadastro, ponto e pagamentos" },
  clientes: { title: "Clientes", sub: "Cadastro de clientes e arquivos" },
};
