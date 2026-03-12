import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, ArrowLeft, Trash2, Upload, FileText, Download, X, Search, Users, MapPin, Briefcase } from "lucide-react";

interface Client {
  id: string;
  name: string;
  address: string | null;
  neighborhood: string | null;
  property_name: string | null;
  service_type: string | null;
  referral_source: string | null;
  notes: string | null;
  created_at: string;
}

const referralOptions = ["Indicação", "Rádio", "Instagram", "Google", "Outro"];

interface ClientFile {
  name: string;
  id: string;
  created_at: string;
  metadata: { size?: number; mimetype?: string };
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ClientesView() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [search, setSearch] = useState("");

  // Form state
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [propertyName, setPropertyName] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [referralSource, setReferralSource] = useState("");
  const [notes, setNotes] = useState("");

  // Files state
  const [files, setFiles] = useState<ClientFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchClients = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("user_id", user.id)
      .order("name");
    if (error) {
      toast.error("Erro ao carregar clientes");
    } else {
      setClients(data || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const resetForm = () => {
    setName("");
    setAddress("");
    setNeighborhood("");
    setPropertyName("");
    setServiceType("");
    setReferralSource("");
    setNotes("");
    setEditingClient(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!user || !name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    const payload = {
      user_id: user.id,
      name: name.trim(),
      address: address.trim() || null,
      neighborhood: neighborhood.trim() || null,
      property_name: propertyName.trim() || null,
      service_type: serviceType.trim() || null,
      referral_source: referralSource || null,
      notes: notes.trim() || null,
    };

    if (editingClient) {
      const { error } = await supabase
        .from("clients")
        .update(payload)
        .eq("id", editingClient.id);
      if (error) {
        toast.error("Erro ao atualizar cliente");
        return;
      }
      toast.success("Cliente atualizado!");
    } else {
      const { error } = await supabase.from("clients").insert(payload);
      if (error) {
        toast.error("Erro ao cadastrar cliente");
        return;
      }
      toast.success("Cliente cadastrado!");
    }

    resetForm();
    fetchClients();
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setName(client.name);
    setAddress(client.address || "");
    setPropertyName(client.property_name || "");
    setServiceType(client.service_type || "");
    setNotes(client.notes || "");
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja excluir este cliente?")) return;
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir");
      return;
    }
    toast.success("Cliente excluído");
    fetchClients();
    if (selectedClient?.id === id) setSelectedClient(null);
  };

  // === File management ===
  const fetchFiles = useCallback(async (clientId: string) => {
    if (!user) return;
    setFilesLoading(true);
    const { data, error } = await supabase.storage
      .from("client-files")
      .list(`${user.id}/${clientId}`, { sortBy: { column: "created_at", order: "desc" } });
    if (error) {
      toast.error("Erro ao carregar arquivos");
      setFiles([]);
    } else {
      setFiles((data || []).filter((f) => f.name !== ".emptyFolderPlaceholder") as ClientFile[]);
    }
    setFilesLoading(false);
  }, [user]);

  useEffect(() => {
    if (selectedClient) fetchFiles(selectedClient.id);
  }, [selectedClient, fetchFiles]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !selectedClient || !e.target.files?.length) return;
    setUploading(true);
    const file = e.target.files[0];
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Arquivo muito grande (máx. 20MB)");
      setUploading(false);
      return;
    }
    const safeName = file.name
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = `${user.id}/${selectedClient.id}/${Date.now()}_${safeName}`;
    const { error } = await supabase.storage.from("client-files").upload(filePath, file);
    if (error) {
      toast.error("Erro ao enviar arquivo");
    } else {
      toast.success("Arquivo enviado!");
      fetchFiles(selectedClient.id);
    }
    setUploading(false);
    e.target.value = "";
  };

  const handleDownload = async (fileName: string) => {
    if (!user || !selectedClient) return;
    const path = `${user.id}/${selectedClient.id}/${fileName}`;
    const { data, error } = await supabase.storage.from("client-files").download(path);
    if (error || !data) {
      toast.error("Erro ao baixar arquivo");
      return;
    }
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName.replace(/^\d+_/, "");
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteFile = async (fileName: string) => {
    if (!user || !selectedClient) return;
    if (!confirm("Excluir este arquivo?")) return;
    const path = `${user.id}/${selectedClient.id}/${fileName}`;
    const { error } = await supabase.storage.from("client-files").remove([path]);
    if (error) {
      toast.error("Erro ao excluir arquivo");
      return;
    }
    toast.success("Arquivo excluído");
    fetchFiles(selectedClient.id);
  };

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.property_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.service_type || "").toLowerCase().includes(search.toLowerCase())
  );

  // === Client detail / files view ===
  if (selectedClient) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedClient(null)}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
          </Button>
          <div>
            <h2 className="text-lg font-bold text-foreground">{selectedClient.name}</h2>
            <p className="text-xs text-muted-foreground">
              {[selectedClient.property_name, selectedClient.service_type].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>

        {/* Client info card */}
        <Card className="bg-card border-border/50">
          <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Endereço:</span>{" "}
              <span className="text-foreground">{selectedClient.address || "—"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Propriedade:</span>{" "}
              <span className="text-foreground">{selectedClient.property_name || "—"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Serviço:</span>{" "}
              <span className="text-foreground">{selectedClient.service_type || "—"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Obs:</span>{" "}
              <span className="text-foreground">{selectedClient.notes || "—"}</span>
            </div>
          </CardContent>
        </Card>

        {/* Files section */}
        <Card className="bg-card border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">Arquivos do Cliente</CardTitle>
              <label className="cursor-pointer">
                <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
                <Button size="sm" variant="outline" asChild disabled={uploading}>
                  <span>
                    <Upload className="w-3.5 h-3.5 mr-1" />
                    {uploading ? "Enviando..." : "Enviar Arquivo"}
                  </span>
                </Button>
              </label>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {filesLoading ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Carregando...</p>
            ) : files.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Nenhum arquivo ainda</p>
                <p className="text-xs">Envie documentos, plantas, fotos e mais</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {files.map((f) => (
                  <div
                    key={f.name}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg bg-secondary/50 hover:bg-secondary/80 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{f.name.replace(/^\d+_/, "")}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {f.metadata?.size ? formatFileSize(f.metadata.size) : ""}
                      </p>
                    </div>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDownload(f.name)}>
                      <Download className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteFile(f.name)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // === Main list view ===
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Clientes</h1>
          <p className="text-sm text-muted-foreground">{clients.length} cliente(s) cadastrado(s)</p>
        </div>
        <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-1" /> Novo Cliente
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, propriedade ou serviço..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Form modal */}
      {showForm && (
        <Card className="bg-card border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">{editingClient ? "Editar Cliente" : "Novo Cliente"}</CardTitle>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={resetForm}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Nome *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do cliente" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Endereço</Label>
                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Endereço completo" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Nome da Propriedade</Label>
                <Input value={propertyName} onChange={(e) => setPropertyName(e.target.value)} placeholder="Ex: Fazenda Boa Vista" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tipo de Serviço</Label>
                <Input value={serviceType} onChange={(e) => setServiceType(e.target.value)} placeholder="Ex: Georreferenciamento" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Observações</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas adicionais" rows={2} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={resetForm}>Cancelar</Button>
              <Button size="sm" onClick={handleSave}>{editingClient ? "Salvar" : "Cadastrar"}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Client list */}
      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">Nenhum cliente encontrado</p>
          <p className="text-xs">Cadastre seu primeiro cliente para começar</p>
        </div>
      ) : (
        <div className="grid gap-2">
          {filtered.map((client) => (
            <Card
              key={client.id}
              className="bg-card border-border/50 hover:border-primary/30 transition-colors cursor-pointer"
              onClick={() => setSelectedClient(client)}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                  {client.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{client.name}</p>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                    {client.property_name && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {client.property_name}
                      </span>
                    )}
                    {client.service_type && (
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-3 h-3" /> {client.service_type}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs"
                    onClick={(e) => { e.stopPropagation(); handleEdit(client); }}
                  >
                    Editar
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); handleDelete(client.id); }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
