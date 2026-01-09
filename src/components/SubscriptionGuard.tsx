import { createContext, useContext, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Lock, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Context para propagar estado read-only
const ReadOnlyContext = createContext<{ isReadOnly: boolean }>({ 
  isReadOnly: false 
});

// Hook para acessar em qualquer componente
export const useReadOnly = () => useContext(ReadOnlyContext);

// Guard principal
export function SubscriptionGuard({ children }: { children: ReactNode }) {
  const { isLoading, isExpired, isTrial, daysRemaining, hasNoSubscriptionConfirmed } = useSubscriptionStatus();
  const navigate = useNavigate();

  // Loading state - só mostra loading se não temos cache
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Modo read-only: SOMENTE quando temos certeza que está expirado OU confirmamos que não tem subscription
  const isReadOnly = isExpired || hasNoSubscriptionConfirmed;

  return (
    <ReadOnlyContext.Provider value={{ isReadOnly }}>
      <div className="space-y-4">
        {/* ALERTA: Assinatura Expirada */}
        {isReadOnly && (
          <Alert variant="destructive" className="border-2">
            <Lock className="h-5 w-5" />
            <AlertDescription className="flex items-center justify-between gap-4">
              <div>
                <strong className="font-semibold">
                  Assinatura Expirada - Modo Somente Leitura
                </strong>
                <p className="text-sm mt-1">
                  Você pode visualizar seus dados, mas não pode criar, editar ou excluir registros.
                </p>
              </div>
              <Button 
                onClick={() => navigate("/planos")}
                variant="secondary"
                className="flex-shrink-0"
              >
                Renovar Assinatura
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* ALERTA: Trial Acabando (últimos 3 dias) */}
        {isTrial && daysRemaining <= 3 && daysRemaining > 0 && !isReadOnly && (
          <Alert className="border-2 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <AlertDescription className="flex items-center justify-between gap-4">
              <div>
                <strong className="font-semibold text-yellow-800 dark:text-yellow-200">
                  Período de teste acabando
                </strong>
                <p className="text-sm mt-1 text-yellow-700 dark:text-yellow-300">
                  Restam apenas {daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'} de teste. Assine agora para continuar usando todos os recursos.
                </p>
              </div>
              <Button 
                onClick={() => navigate("/planos")}
                className="flex-shrink-0"
              >
                Assinar Agora
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Renderizar conteúdo */}
        {children}
      </div>
    </ReadOnlyContext.Provider>
  );
}

// Wrapper para bloquear elementos individuais
export function ReadOnlyWrapper({ 
  children, 
  onReadOnlyClick 
}: { 
  children: ReactNode; 
  onReadOnlyClick?: () => void;
}) {
  const { isReadOnly } = useReadOnly();
  const { toast } = useToast();

  // Se não está em read-only, renderiza normal
  if (!isReadOnly) {
    return <>{children}</>;
  }

  // Callback padrão se não for fornecido
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onReadOnlyClick) {
      onReadOnlyClick();
    } else {
      toast({
        title: "Ação bloqueada",
        description: "Renove sua assinatura para editar registros.",
        variant: "destructive",
      });
    }
  };

  // Se está em read-only, desabilita visualmente
  return (
    <div
      className="relative"
      onClick={handleClick}
    >
      <div className="pointer-events-none opacity-50">
        {children}
      </div>
      <div className="absolute inset-0 cursor-not-allowed" />
    </div>
  );
}
