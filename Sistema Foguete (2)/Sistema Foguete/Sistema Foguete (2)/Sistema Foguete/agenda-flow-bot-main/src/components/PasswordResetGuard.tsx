import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Lock } from "lucide-react";
import logo from "@/assets/logo.png";

interface PasswordResetGuardProps {
  children: React.ReactNode;
}

export const PasswordResetGuard = ({ children }: PasswordResetGuardProps) => {
  const [loading, setLoading] = useState(false);
  const [needsPasswordReset, setNeedsPasswordReset] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const checkRecoverySession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Check if this is a recovery session
      if (session?.user?.recovery_sent_at) {
        setNeedsPasswordReset(true);
      }
    };

    checkRecoverySession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setNeedsPasswordReset(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

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

    const { error } = await supabase.auth.updateUser({
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

  if (!needsPasswordReset) {
    return <>{children}</>;
  }

  return (
    <>
      <Dialog open={needsPasswordReset} onOpenChange={() => {}}>
        <DialogContent 
          className="sm:max-w-md"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
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
                <Label htmlFor="new-password" className="text-foreground font-medium flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Nova Senha
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Digite sua nova senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-background/50 border-primary/20 focus:border-primary transition-colors"
                  disabled={loading}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-new-password" className="text-foreground font-medium flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Confirmar Senha
                </Label>
                <Input
                  id="confirm-new-password"
                  type="password"
                  placeholder="Digite a senha novamente"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-background/50 border-primary/20 focus:border-primary transition-colors"
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-semibold py-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Atualizando...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-5 w-5" />
                    Confirmar Nova Senha
                  </>
                )}
              </Button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
      {children}
    </>
  );
};
