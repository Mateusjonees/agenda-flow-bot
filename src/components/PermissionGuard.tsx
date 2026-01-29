import { ReactNode } from "react";
import { useLocation, Navigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";

// SVGs inline para evitar lucide-react no bundle inicial
const ShieldAlertIcon = ({ className }: { className?: string }) => (
  <svg className={className || "h-12 w-12"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>
    <path d="M12 8v4"/>
    <path d="M12 16h.01"/>
  </svg>
);

const LoaderIcon = ({ className }: { className?: string }) => (
  <svg className={className || "h-8 w-8 animate-spin"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);

interface PermissionGuardProps {
  children: ReactNode;
  /** Rota a verificar (usa a rota atual se não informada) */
  requiredRoute?: string;
  /** Componente alternativo para exibir se não tiver permissão */
  fallback?: ReactNode;
}

/**
 * Componente que protege rotas baseado nas permissões do usuário
 * Se o usuário não tiver permissão, mostra mensagem de acesso negado
 */
export function PermissionGuard({ children, requiredRoute, fallback }: PermissionGuardProps) {
  const location = useLocation();
  const { hasPermission, isLoading, role } = useUserRole();
  
  const routeToCheck = requiredRoute || location.pathname;

  // Enquanto carrega, mostra loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoaderIcon className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Se não tem role (não logado ou erro), redireciona para auth
  if (!role) {
    return <Navigate to="/auth" replace />;
  }

  // Verifica permissão
  if (!hasPermission(routeToCheck)) {
    // Se tiver fallback customizado, usa ele
    if (fallback) {
      return <>{fallback}</>;
    }

    // Fallback padrão: mensagem de acesso negado
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-8">
        <div className="rounded-full bg-destructive/10 p-4">
          <ShieldAlertIcon className="h-12 w-12 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold text-center">Acesso Negado</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Você não tem permissão para acessar esta página. 
          Entre em contato com o administrador se precisar de acesso.
        </p>
        <Button 
          variant="outline" 
          onClick={() => window.history.back()}
          className="mt-4"
        >
          Voltar
        </Button>
      </div>
    );
  }

  // Tem permissão, renderiza o conteúdo
  return <>{children}</>;
}

/**
 * Hook para usar contexto de readonly em componentes
 */
export function useReadOnlyContext() {
  const location = useLocation();
  const { isReadOnly } = useUserRole();
  
  return isReadOnly(location.pathname);
}
