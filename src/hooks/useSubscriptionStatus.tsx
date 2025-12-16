import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

export function useSubscriptionStatus() {
  const [user, setUser] = useState<User | null>(null);
  const queryClient = useQueryClient();

  // Escutar mudanças de autenticação
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
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
        return null;
      }

      return data;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
  });

  // Escutar mudanças em tempo real na assinatura
  useEffect(() => {
    if (!user?.id) return;

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
          console.log('User subscription updated in real-time:', payload);
          // Invalidar cache para recarregar dados
          queryClient.invalidateQueries({ queryKey: ["user-subscription", user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  // Estados derivados
  const isActive = subscription?.status === "active" || subscription?.status === "trial";
  const isTrial = subscription?.status === "trial";
  
  // Assinatura cancelada ainda tem acesso até next_billing_date
  const isCancelled = subscription?.status === "cancelled";
  const hasAccessUntil = subscription?.next_billing_date 
    ? new Date(subscription.next_billing_date).getTime() > new Date().getTime()
    : false;
  
  // Só está expirado se o status for "expired" OU se cancelou e já passou da data de acesso
  const isExpired = subscription?.status === "expired" || (isCancelled && !hasAccessUntil);
  
  const daysRemaining = subscription?.next_billing_date
    ? Math.ceil((new Date(subscription.next_billing_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const trialDaysRemaining = subscription?.status === "trial" && subscription?.start_date
    ? Math.ceil((new Date(subscription.start_date).getTime() + (7 * 24 * 60 * 60 * 1000) - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return {
    subscription,
    isLoading,
    refetch,
    isActive,
    isTrial,
    isCancelled,
    isExpired,
    daysRemaining: isTrial ? trialDaysRemaining : daysRemaining,
    user,
  };
}
