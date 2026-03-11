import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function SignupPage({ onToggle }: { onToggle: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || !name.trim()) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "A senha deve ter no mínimo 6 caracteres", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { display_name: name.trim() },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      toast({ title: "Erro ao criar conta", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Conta criada!", description: "Verifique seu e-mail para confirmar o cadastro." });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="bg-card/60 backdrop-blur-xl border border-border/50 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <img src="/logo-topogeo.png" alt="TopoGEO" className="w-16 h-16 mx-auto mb-3 rounded-xl object-contain bg-white/10 p-1" />
            <h1 className="text-2xl font-bold text-foreground">Criar Conta</h1>
            <p className="text-sm text-muted-foreground mt-1">Cadastre-se para acessar o Hub</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Nome</label>
              <Input
                type="text"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-secondary/50 border-border/50"
                autoComplete="name"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">E-mail</label>
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-secondary/50 border-border/50"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Senha</label>
              <Input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-secondary/50 border-border/50"
                autoComplete="new-password"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full font-semibold">
              {loading ? "Criando conta..." : "Criar conta"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Já tem conta?{" "}
            <button onClick={onToggle} className="text-primary hover:underline font-medium">
              Entrar
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
