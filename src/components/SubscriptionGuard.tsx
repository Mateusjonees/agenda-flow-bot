import { createContext, useContext, ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

// SVGs inline para evitar lucide-react no bundle inicial
const LockIcon = ({ className }: { className?: string }) => (
  <svg className={className || "h-5 w-5"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const AlertCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className || "h-5 w-5"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const LoaderIcon = ({ className }: { className?: string }) => (
  <svg className={className || "w-8 h-8 animate-spin"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

const UsersIcon = ({ className }: { className?: string }) => (
  <svg className={className || "h-5 w-5"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

// Context para propagar estado read-only
const ReadOnlyContext = createContext<{ isReadOnly: boolean }>({ 
  isReadOnly: false 
});

// Hook para acessar em qualquer componente
export const useReadOnly = () => useContext(ReadOnlyContext);

// Guard principal
export function SubscriptionGuard({ children }: { children: ReactNode }) {
  const { 
    isLoading, 
    isExpired, 
    isTrial, 
    daysRemaining, 
    hasNoSubscriptionConfirmed,
    isTeamMember,
    isTeamMemberLicensePaid,
    isActive
  } = useSubscriptionStatus();
  const navigate = useNavigate();

  // Loading state - só mostra loading se não temos cache
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoaderIcon className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Modo read-only: 
  // 1. Subscription do dono expirada
  // 2. Colaborador com licença não paga
  // 3. Sem subscription confirmado
  const isReadOnly = isExpired || hasNoSubscriptionConfirmed;

  // Mensagem específica para colaborador
  const isCollaboratorUnpaid = isTeamMember && !isTeamMemberLicensePaid && isActive;

  return (
    <ReadOnlyContext.Provider value={{ isReadOnly }}>
      <div className="space-y-4">
        {/* ALERTA: Colaborador com licença não paga */}
        {isCollaboratorUnpaid && (
          <Alert variant="destructive" className="border-2">
            <UsersIcon className="h-5 w-5" />
            <AlertDescription className="flex items-center justify-between gap-4">
              <div>
                <strong className="font-semibold">
                  Licença de Colaborador Pendente - Modo Somente Leitura
                </strong>
                <p className="text-sm mt-1">
                  Sua licença de colaborador precisa ser renovada pelo administrador da conta.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* ALERTA: Assinatura Expirada (dono ou geral) */}
        {isReadOnly && !isCollaboratorUnpaid && (
          <Alert variant="destructive" className="border-2">
            <LockIcon className="h-5 w-5" />
            <AlertDescription className="flex items-center justify-between gap-4">
              <div>
                <strong className="font-semibold">
                  {isTeamMember 
                    ? "Assinatura do Administrador Expirada - Modo Somente Leitura"
                    : "Assinatura Expirada - Modo Somente Leitura"
                  }
                </strong>
                <p className="text-sm mt-1">
                  {isTeamMember 
                    ? "A assinatura principal da conta precisa ser renovada pelo administrador."
                    : "Você pode visualizar seus dados, mas não pode criar, editar ou excluir registros."
                  }
                </p>
              </div>
              {!isTeamMember && (
                <Button 
                  onClick={() => navigate("/planos")}
                  variant="secondary"
                  className="flex-shrink-0"
                >
                  Renovar Assinatura
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* ALERTA: Trial Acabando (últimos 3 dias) - só para dono */}
        {!isTeamMember && isTrial && daysRemaining <= 3 && daysRemaining > 0 && !isReadOnly && (
          <Alert className="border-2 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
            <AlertCircleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
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

        {/* Info para colaborador sobre dias restantes */}
        {isTeamMember && daysRemaining <= 5 && daysRemaining > 0 && !isReadOnly && (
          <Alert className="border-2 border-blue-500 bg-blue-50 dark:bg-blue-950">
            <UsersIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <AlertDescription>
              <strong className="font-semibold text-blue-800 dark:text-blue-200">
                Aviso de Renovação
              </strong>
              <p className="text-sm mt-1 text-blue-700 dark:text-blue-300">
                A assinatura da conta principal expira em {daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'}. 
                Seu acesso depende da renovação pelo administrador.
              </p>
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
