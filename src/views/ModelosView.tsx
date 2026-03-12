import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Upload, Trash2, FileText, File, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface Template {
  id: string;
  name: string;
  category: string;
  sub_type: string | null;
  description: string | null;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
}

const SUB_TYPES_MEMORIAL = [
  "Desmembramento",
  "Retificação",
  "Georreferenciamento",
  "Usucapião",
  "Outro",
];

const SUB_TYPES_ORCAMENTO = [
  "Georreferenciamento Rural",
  "Levantamento Topográfico",
  "Desmembramento",
  "Usucapião",
  "Outro",
];

export default function ModelosView({ categoryFilter }: { categoryFilter?: string }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState<string>(categoryFilter || "all");

  // Form state
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>(categoryFilter || "memorial");
  const [subType, setSubType] = useState<string>("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const fetchTemplates = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("templates")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Erro ao carregar modelos", description: error.message, variant: "destructive" });
    } else {
      setTemplates(data || []);
    }
    setLoading(false);
  }, [user, toast]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !name.trim() || !user) {
      toast({ title: "Preencha o nome e selecione um arquivo", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}_${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("templates")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from("templates").insert({
        user_id: user.id,
        name: name.trim(),
        category,
        sub_type: subType || null,
        description: description.trim() || null,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
      });

      if (insertError) throw insertError;

      toast({ title: "Modelo salvo com sucesso! ✅" });
      setName("");
      setSubType("");
      setDescription("");
      setFile(null);
      // Reset file input
      const input = document.getElementById("template-file-input") as HTMLInputElement;
      if (input) input.value = "";
      fetchTemplates();
    } catch (err: any) {
      toast({ title: "Erro ao enviar", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (template: Template) => {
    if (!confirm(`Excluir modelo "${template.name}"?`)) return;
    const { error: storageErr } = await supabase.storage.from("templates").remove([template.file_path]);
    if (storageErr) console.warn("Storage delete error:", storageErr);
    const { error } = await supabase.from("templates").delete().eq("id", template.id);
    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Modelo excluído" });
      fetchTemplates();
    }
  };

  const handleDownload = async (template: Template) => {
    const { data, error } = await supabase.storage.from("templates").download(template.file_path);
    if (error || !data) {
      toast({ title: "Erro ao baixar arquivo", variant: "destructive" });
      return;
    }
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = template.file_name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = filter === "all" ? templates : templates.filter((t) => t.category === filter);
  const subOptions = category === "memorial" ? SUB_TYPES_MEMORIAL : SUB_TYPES_ORCAMENTO;

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5">
      {/* Upload form */}
      <div className="overflow-y-auto pr-1">
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="mb-4 text-[15px] font-bold flex items-center gap-2">
            <Upload className="w-4 h-4 text-primary" />
            Enviar Novo Modelo
          </h3>
          <form onSubmit={handleUpload} className="space-y-3.5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">Nome do Modelo</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Memorial Descritivo - Desmembramento"
                className="bg-secondary/50 border-border/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">Categoria</label>
                <Select value={category} onValueChange={(v) => { setCategory(v); setSubType(""); }}>
                  <SelectTrigger className="bg-secondary/50 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="memorial">📐 Memorial Descritivo</SelectItem>
                    <SelectItem value="orcamento">📋 Orçamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">Subtipo</label>
                <Select value={subType} onValueChange={setSubType}>
                  <SelectTrigger className="bg-secondary/50 border-border/50">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {subOptions.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">Descrição (opcional)</label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Breve descrição do modelo..."
                className="bg-secondary/50 border-border/50"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">Arquivo (Word ou PDF)</label>
              <input
                id="template-file-input"
                type="file"
                accept=".pdf,.doc,.docx,.odt"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="text-sm text-muted-foreground file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary file:font-semibold file:text-xs hover:file:bg-primary/20 file:cursor-pointer"
              />
            </div>

            <Button type="submit" disabled={uploading} className="w-full font-semibold">
              {uploading ? "Enviando..." : "📤 Salvar Modelo"}
            </Button>
          </form>
        </div>
      </div>

      {/* Templates list */}
      <div className="overflow-y-auto pr-1">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[15px] font-bold">Modelos Salvos</h3>
          <div className="flex gap-2">
            {[
              { value: "all", label: "Todos" },
              { value: "memorial", label: "📐 Memoriais" },
              { value: "orcamento", label: "📋 Orçamentos" },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                  filter === f.value
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:bg-secondary border border-transparent"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-muted-foreground animate-pulse">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Nenhum modelo encontrado</p>
            <p className="text-xs mt-1">Envie arquivos Word ou PDF para padronizar seus documentos</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((t) => (
              <div
                key={t.id}
                className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover:border-primary/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {t.mime_type?.includes("pdf") ? (
                    <File className="w-5 h-5 text-primary" />
                  ) : (
                    <FileText className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground truncate">{t.name}</span>
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      {t.category === "memorial" ? "📐 Memorial" : "📋 Orçamento"}
                    </Badge>
                    {t.sub_type && (
                      <Badge variant="outline" className="text-[10px] shrink-0">{t.sub_type}</Badge>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-3">
                    <span>{t.file_name}</span>
                    <span>{formatSize(t.file_size)}</span>
                    <span>{new Date(t.created_at).toLocaleDateString("pt-BR")}</span>
                  </div>
                  {t.description && (
                    <p className="text-[11px] text-muted-foreground/70 mt-1 truncate">{t.description}</p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => handleDownload(t)}
                    className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                    title="Baixar"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(t)}
                    className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
