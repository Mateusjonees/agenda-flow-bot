import { ReactNode } from "react";
import { useLocation, Navigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { ShieldAlert, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

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
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
          <ShieldAlert className="h-12 w-12 text-destructive" />
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
