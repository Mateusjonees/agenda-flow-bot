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

  // Buscar subscription do usuário
  const { data: subscription, isLoading, refetch } = useQuery({
    queryKey: ["user-subscription", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
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
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
    // Manter dados anteriores durante recarregamento
    placeholderData: (previousData) => previousData,
  });

  // Escutar mudanças em tempo real na assinatura (apenas platform subscriptions)
  useEffect(() => {
    if (!user?.id) return;

    let debounceTimeout: NodeJS.Timeout;

    const channel = supabase
      .channel('user-subscription-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newRecord = payload.new as Record<string, unknown>;
          
          // Só invalidar se for subscription de PLATAFORMA (customer_id = null)
          // Subscriptions de clientes têm customer_id preenchido
          if (newRecord && newRecord.customer_id === null) {
            console.log('Platform subscription updated in real-time:', payload);
            
            // Debounce para evitar múltiplas invalidações seguidas
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(() => {
              queryClient.invalidateQueries({ queryKey: ["user-subscription", user.id] });
            }, 500);
          }
        }
      )
      .subscribe();

    return () => {
      clearTimeout(debounceTimeout);
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

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
  
  // Expirado SOMENTE quando temos certeza absoluta:
  // 1. Não estamos em loading inicial (userLoading)
  // 2. Temos uma subscription carregada (ou cache) com status expired
  // 3. OU cancelou e passou da data de acesso
  // NÃO considerar "sem subscription" como expirado durante qualquer loading
  const isExpired = !userLoading && (
    effectiveSubscription?.status === "expired" || 
    (isCancelled && !hasAccessUntil)
  );
  
  // Flag separada para "realmente sem subscription" - só true quando temos certeza
  const hasNoSubscriptionConfirmed = !userLoading && !isLoading && !effectiveSubscription;
  
  // Cálculo unificado de dias restantes usando sempre next_billing_date
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
  };
}
