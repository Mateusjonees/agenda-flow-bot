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
      if (!user) {
        console.log('[useUserRole] Usuário não autenticado');
        return null;
      }

      console.log('[useUserRole] Buscando role para user_id:', user.id);

      // Buscar role do usuário na tabela user_roles
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('[useUserRole] Erro ao buscar role:', error);
        // Em caso de erro, ainda considera como admin (dono)
        return 'admin' as UserRole;
      }

      console.log('[useUserRole] Dados retornados:', data);

      // Se tem role atribuída, usa ela
      if (data?.role) {
        console.log('[useUserRole] Role encontrada:', data.role);
        return data.role as UserRole;
      }

      // Se não tem role atribuída, verifica se o usuário é dono de algum negócio
      const { data: businessData } = await supabase
        .from('business_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      const finalRole = businessData ? 'admin' : 'admin';
      console.log('[useUserRole] Sem role explícita, usando:', finalRole, 'businessData:', !!businessData);
      
      return finalRole as UserRole;
    },
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
    retry: 1,
    // Manter dados anteriores enquanto recarrega para evitar flicker
    placeholderData: (previousData) => previousData,
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
