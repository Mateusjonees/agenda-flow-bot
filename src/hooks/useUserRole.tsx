import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserRole, hasRoutePermission, isReadOnly, getAllowedRoutes } from "@/config/permissions";

/**
 * Hook para gerenciar a role do usuário logado
 * Busca a role do banco de dados via Supabase
 */
export function useUserRole() {
  const { data: roleData, isLoading, error, refetch } = useQuery({
    queryKey: ['user-role'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Buscar role do usuário na tabela user_roles
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Erro ao buscar role do usuário:', error);
        return null;
      }

      // Se não tem role atribuída, considera como admin (dono da conta)
      // Isso é para compatibilidade com usuários existentes
      return (data?.role as UserRole) || 'admin';
    },
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
    retry: 1,
  });

  const role = roleData || null;

  return {
    // Role atual do usuário
    role,
    isLoading,
    error,
    refetch,
    
    // Helpers de verificação
    isAdmin: role === 'admin' || role === 'owner',
    isSeller: role === 'seller',
    isFinancial: role === 'financial',
    
    // Verificação de permissão para uma rota
    hasPermission: (route: string) => hasRoutePermission(role, route),
    
    // Verifica se é somente leitura para uma rota
    isReadOnly: (route: string) => isReadOnly(role, route),
    
    // Lista de rotas permitidas (para filtrar menu)
    allowedRoutes: getAllowedRoutes(role),
  };
}

export type UseUserRoleReturn = ReturnType<typeof useUserRole>;
