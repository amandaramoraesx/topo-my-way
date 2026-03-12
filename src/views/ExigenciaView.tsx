import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Upload, X, FileText } from "lucide-react";
import { toast } from "sonner";

export default function ExigenciaView() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({ prof: "Rodrigues Topografia", cart: "", tipo: "Erro no Memorial Descritivo" });
  const [exigenciaFile, setExigenciaFile] = useState<File | null>(null);
  const [memorialFile, setMemorialFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const exigenciaRef = useRef<HTMLInputElement>(null);
  const memorialRef = useRef<HTMLInputElement>(null);

  const update = (k: string, v: string) => setFormData(p => ({ ...p, [k]: v }));

  const handleFileSelect = (file: File | null, setter: (f: File | null) => void) => {
    if (!file) return;
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error("Arquivo muito grande. Máximo 10MB.");
      return;
    }
    setter(file);
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error("Você precisa estar logado.");
      return;
    }
    if (!exigenciaFile) {
      toast.error("Anexe o arquivo da Exigência CRI.");
      return;
    }

    setUploading(true);
    try {
      const timestamp = Date.now();
      const basePath = `${user.id}/${timestamp}`;

      // Upload exigencia file
      const { error: exErr } = await supabase.storage
        .from("exigencias")
        .upload(`${basePath}/exigencia_${exigenciaFile.name}`, exigenciaFile);
      if (exErr) throw exErr;

      // Upload memorial file if provided
      if (memorialFile) {
        const { error: memErr } = await supabase.storage
          .from("exigencias")
          .upload(`${basePath}/memorial_${memorialFile.name}`, memorialFile);
        if (memErr) throw memErr;
      }

      toast.success("Arquivos enviados! Processando com IA...");
      // TODO: Integrar com IA para resolver exigência
    } catch (err: any) {
      toast.error("Erro ao enviar arquivo: " + (err.message || "Tente novamente"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[420px_1fr] gap-5 h-[calc(100vh-116px)] overflow-hidden">
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

          {/* Exigência CRI - File Upload */}
          <FileUploadField
            label="Exigência CRI"
            description="Anexe o documento da exigência do cartório"
            file={exigenciaFile}
            onClear={() => setExigenciaFile(null)}
            inputRef={exigenciaRef}
            onFileSelect={(f) => handleFileSelect(f, setExigenciaFile)}
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
          />

          {/* Memorial a corrigir - File Upload */}
          <FileUploadField
            label="Memorial a Corrigir (opcional)"
            description="Anexe o memorial que foi rejeitado"
            file={memorialFile}
            onClear={() => setMemorialFile(null)}
            inputRef={memorialRef}
            onFileSelect={(f) => handleFileSelect(f, setMemorialFile)}
            accept=".pdf,.doc,.docx,.txt"
          />

          <button
            onClick={handleSubmit}
            disabled={uploading || !exigenciaFile}
            className="w-full bg-gradient-to-r from-primary to-accent text-background font-mono text-xs px-6 py-3 rounded-lg font-bold tracking-wide hover:opacity-90 hover:-translate-y-px transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? "Enviando..." : "⚖️ RESOLVER EXIGÊNCIA COM IA"}
          </button>
        </div>
      </div>
      <div className="overflow-y-auto pr-1">
        <div className="text-center py-16 text-muted-foreground">
          <div className="text-[40px] mb-3">⚖️</div>
          <p>Anexe os documentos da exigência<br />e clique em <strong className="text-primary">Resolver com IA</strong></p>
        </div>
      </div>
    </div>
  );
}

function FileUploadField({ label, description, file, onClear, inputRef, onFileSelect, accept }: {
  label: string;
  description: string;
  file: File | null;
  onClear: () => void;
  inputRef: React.RefObject<HTMLInputElement>;
  onFileSelect: (f: File | null) => void;
  accept: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">{label}</label>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={e => onFileSelect(e.target.files?.[0] || null)}
      />
      {file ? (
        <div className="flex items-center gap-2 bg-secondary border border-border rounded-md px-3 py-2.5">
          <FileText className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="text-[12px] text-foreground truncate flex-1">{file.name}</span>
          <span className="text-[10px] text-muted-foreground flex-shrink-0">{(file.size / 1024).toFixed(0)}KB</span>
          <button onClick={onClear} className="p-0.5 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center gap-1.5 bg-secondary/50 border border-dashed border-border rounded-md px-3 py-4 hover:border-primary hover:bg-secondary transition-colors cursor-pointer"
        >
          <Upload className="w-5 h-5 text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground">{description}</span>
          <span className="text-[9px] text-muted-foreground/60">PDF, DOC, DOCX, JPG, PNG</span>
        </button>
      )}
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
