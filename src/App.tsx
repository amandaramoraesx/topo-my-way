import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { AppProvider } from "@/context/AppContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import AppLayout from "@/components/AppLayout";
import AuthPage from "@/pages/AuthPage";

const queryClient = new QueryClient();

function AppGate() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="font-mono-display text-[10px] text-primary tracking-widest uppercase mb-2">
            ▲ Rodrigues Topografia
          </div>
          <div className="text-muted-foreground text-sm animate-pulse">Carregando...</div>
        </div>
      </div>
    );
  }

  if (!session) return <AuthPage />;

  return (
    <AppProvider>
      <AppLayout />
    </AppProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <AppGate />
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
