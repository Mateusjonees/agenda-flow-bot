import { useState, useEffect, ReactNode } from "react";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

interface PasswordResetGuardProps {
  children: ReactNode;
}

// SVG icons inline para evitar importar lucide-react
const LoaderIcon = () => (
  <svg className="mr-2 h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

const LockIcon = ({ className }: { className?: string }) => (
  <svg className={className || "h-4 w-4"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

export const PasswordResetGuard = ({ children }: PasswordResetGuardProps) => {
  const [loading, setLoading] = useState(false);
  const [needsPasswordReset, setNeedsPasswordReset] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [supabaseClient, setSupabaseClient] = useState<any>(null);
  const [UIComponents, setUIComponents] = useState<{
    Dialog: any;
    DialogContent: any;
    Button: any;
    Input: any;
    Label: any;
  } | null>(null);

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;
    
    const timer = setTimeout(async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      setSupabaseClient(supabase);

      const checkRecoverySession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user?.recovery_sent_at) {
          // Carregar componentes UI apenas quando necessário
          const [dialogModule, buttonModule, inputModule, labelModule] = await Promise.all([
            import("@/components/ui/dialog"),
            import("@/components/ui/button"),
            import("@/components/ui/input"),
            import("@/components/ui/label")
          ]);
          
          setUIComponents({
            Dialog: dialogModule.Dialog,
            DialogContent: dialogModule.DialogContent,
            Button: buttonModule.Button,
            Input: inputModule.Input,
            Label: labelModule.Label
          });
          setNeedsPasswordReset(true);
        }
      };

      await checkRecoverySession();

      const { data } = supabase.auth.onAuthStateChange(async (event) => {
        if (event === 'PASSWORD_RECOVERY') {
          // Carregar componentes UI apenas quando necessário
          const [dialogModule, buttonModule, inputModule, labelModule] = await Promise.all([
            import("@/components/ui/dialog"),
            import("@/components/ui/button"),
            import("@/components/ui/input"),
            import("@/components/ui/label")
          ]);
          
          setUIComponents({
            Dialog: dialogModule.Dialog,
            DialogContent: dialogModule.DialogContent,
            Button: buttonModule.Button,
            Input: inputModule.Input,
            Label: labelModule.Label
          });
          setNeedsPasswordReset(true);
        }
      });
      
      subscription = data.subscription;
    }, 500);

    return () => {
      clearTimeout(timer);
      subscription?.unsubscribe();
    };
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseClient) return;

    if (!password || !confirmPassword) {
      toast.error("Preencha todos os campos");
      return;
    }

    if (password.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    setLoading(true);

    const { error } = await supabaseClient.auth.updateUser({
      password: password,
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Senha atualizada com sucesso!");
      setNeedsPasswordReset(false);
      setPassword("");
      setConfirmPassword("");
    }
  };

  // Renderiza children IMEDIATAMENTE
  // Modal só aparece quando necessário E componentes carregados
  return (
    <>
      {needsPasswordReset && UIComponents && (
        <UIComponents.Dialog open={needsPasswordReset} onOpenChange={() => {}}>
          <UIComponents.DialogContent 
            className="sm:max-w-md"
            onInteractOutside={(e: Event) => e.preventDefault()}
            onEscapeKeyDown={(e: Event) => e.preventDefault()}
          >
            <div className="flex flex-col items-center space-y-6 py-4">
              {/* Logo */}
              <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-4 rounded-2xl shadow-lg border border-primary/20">
                <img src={logo} alt="Logo" className="h-16 w-auto" />
              </div>

              {/* Title */}
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Defina sua Nova Senha
                </h2>
                <p className="text-sm text-muted-foreground">
                  Por segurança, você precisa definir uma nova senha antes de continuar
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleResetPassword} className="w-full space-y-4">
                <div className="space-y-2">
                  <UIComponents.Label htmlFor="new-password" className="text-foreground font-medium flex items-center gap-2">
                    <LockIcon className="h-4 w-4" />
                    Nova Senha
                  </UIComponents.Label>
                  <UIComponents.Input
                    id="new-password"
                    type="password"
                    placeholder="Digite sua nova senha"
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                    className="bg-background/50 border-primary/20 focus:border-primary transition-colors"
                    disabled={loading}
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <UIComponents.Label htmlFor="confirm-new-password" className="text-foreground font-medium flex items-center gap-2">
                    <LockIcon className="h-4 w-4" />
                    Confirmar Senha
                  </UIComponents.Label>
                  <UIComponents.Input
                    id="confirm-new-password"
                    type="password"
                    placeholder="Digite a senha novamente"
                    value={confirmPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                    className="bg-background/50 border-primary/20 focus:border-primary transition-colors"
                    disabled={loading}
                  />
                </div>

                <UIComponents.Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-semibold py-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <LoaderIcon />
                      Atualizando...
                    </>
                  ) : (
                    <>
                      <LockIcon className="mr-2 h-5 w-5" />
                      Confirmar Nova Senha
                    </>
                  )}
                </UIComponents.Button>
              </form>
            </div>
          </UIComponents.DialogContent>
        </UIComponents.Dialog>
      )}
      {children}
    </>
  );
};

export default PasswordResetGuard;
