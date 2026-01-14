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
        // Em caso de erro, ainda considera como admin (dono)
        return 'admin' as UserRole;
      }

      // Se tem role atribuída, usa ela
      if (data?.role) {
        return data.role as UserRole;
      }

      // Se não tem role atribuída, verifica se o usuário é dono de algum negócio
      // Se sim, considera como admin/owner
      const { data: businessData } = await supabase
        .from('business_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      // Se é dono de um negócio, é admin. Senão, pode ser um novo usuário
      return businessData ? ('admin' as UserRole) : ('admin' as UserRole);
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
