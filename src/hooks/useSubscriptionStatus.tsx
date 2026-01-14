import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

interface SubscriptionData {
  id: string;
  status: string;
  next_billing_date: string | null;
  [key: string]: unknown;
}

interface UserRoleData {
  created_by: string | null;
  is_paid: boolean | null;
  next_payment_due: string | null;
}

export function useSubscriptionStatus() {
  const [user, setUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const queryClient = useQueryClient();
  
  // Cache para manter o último estado válido durante recarregamentos
  const cachedSubscriptionRef = useRef<SubscriptionData | null>(null);

  // Escutar mudanças de autenticação
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setUserLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setUserLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Buscar role do usuário (para saber se é colaborador)
  const { data: userRole } = useQuery({
    queryKey: ["user-role-for-subscription", user?.id],
    queryFn: async (): Promise<UserRoleData | null> => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("user_roles")
        .select("created_by, is_paid, next_payment_due")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching user role:", error);
        return null;
      }

      return data;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  // Determinar se é um colaborador e quem é o dono
  const isTeamMember = !!userRole?.created_by;
  const ownerId = userRole?.created_by || user?.id;

  // Buscar subscription do DONO (ou própria se for dono)
  const { data: subscription, isLoading, refetch } = useQuery({
    queryKey: ["user-subscription", ownerId],
    queryFn: async () => {
      if (!ownerId) return null;
      
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", ownerId)
        .is("customer_id", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error fetching subscription:", error);
        // Retornar cache se houver erro
        return cachedSubscriptionRef.current;
      }

      // Atualizar cache com dados válidos
      if (data) {
        cachedSubscriptionRef.current = data as SubscriptionData;
      }

      return data;
    },
    enabled: !!ownerId,
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
    // Manter dados anteriores durante recarregamento
    placeholderData: (previousData) => previousData,
  });

  // Escutar mudanças em tempo real na assinatura do DONO
  useEffect(() => {
    if (!ownerId) return;

    let debounceTimeout: NodeJS.Timeout;

    const channel = supabase
      .channel('user-subscription-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${ownerId}`
        },
        (payload) => {
          const newRecord = payload.new as Record<string, unknown>;
          
          // Só invalidar se for subscription de PLATAFORMA (customer_id = null)
          if (newRecord && newRecord.customer_id === null) {
            console.log('Platform subscription updated in real-time:', payload);
            
            // Debounce para evitar múltiplas invalidações seguidas
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(() => {
              queryClient.invalidateQueries({ queryKey: ["user-subscription", ownerId] });
            }, 500);
          }
        }
      )
      .subscribe();

    return () => {
      clearTimeout(debounceTimeout);
      supabase.removeChannel(channel);
    };
  }, [ownerId, queryClient]);

  // Usar subscription atual ou cache durante transições
  const effectiveSubscription = subscription ?? cachedSubscriptionRef.current;
  
  // Estados derivados - usando effectiveSubscription para evitar flickering
  const hasSubscription = !!effectiveSubscription;
  const isActive = effectiveSubscription?.status === "active" || effectiveSubscription?.status === "trial";
  const isTrial = effectiveSubscription?.status === "trial";
  
  // Assinatura cancelada ainda tem acesso até next_billing_date
  const isCancelled = effectiveSubscription?.status === "cancelled";
  const hasAccessUntil = effectiveSubscription?.next_billing_date 
    ? new Date(effectiveSubscription.next_billing_date).getTime() > new Date().getTime()
    : false;
  
  // Loading combinado: considera user loading E query loading
  const isFullyLoading = userLoading || (!!user?.id && isLoading && !cachedSubscriptionRef.current);
  
  // Para colaboradores: verificar também se a licença do colaborador está paga
  // Se o dono tem subscription ativa MAS o colaborador não pagou a licença, entra em modo leitura
  const isTeamMemberLicensePaid = isTeamMember 
    ? (userRole?.is_paid === true && userRole?.next_payment_due 
        ? new Date(userRole.next_payment_due).getTime() > new Date().getTime()
        : userRole?.is_paid === true)
    : true; // Se não é colaborador, sempre "pago"

  // Expirado SOMENTE quando:
  // 1. Subscription do dono expirou OU
  // 2. É colaborador e não pagou a licença
  const isExpired = !userLoading && (
    effectiveSubscription?.status === "expired" || 
    (isCancelled && !hasAccessUntil) ||
    (isTeamMember && !isTeamMemberLicensePaid && isActive) // Dono ativo mas colaborador não pagou
  );
  
  // Flag separada para "realmente sem subscription" - só true quando temos certeza
  const hasNoSubscriptionConfirmed = !userLoading && !isLoading && !effectiveSubscription;
  
  // Cálculo unificado de dias restantes usando sempre next_billing_date do DONO
  const daysRemaining = effectiveSubscription?.next_billing_date
    ? Math.max(0, Math.ceil((new Date(effectiveSubscription.next_billing_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  return {
    subscription: effectiveSubscription,
    isLoading: isFullyLoading,
    refetch,
    isActive,
    isTrial,
    isCancelled,
    isExpired,
    hasSubscription,
    hasNoSubscriptionConfirmed,
    daysRemaining,
    user,
    // Novos campos para colaboradores
    isTeamMember,
    isTeamMemberLicensePaid,
    ownerId,
  };
}
