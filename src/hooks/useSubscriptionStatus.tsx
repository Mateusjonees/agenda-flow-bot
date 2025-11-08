import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

export function useSubscriptionStatus() {
  const [user, setUser] = useState<User | null>(null);

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
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error("Error fetching subscription:", error);
        return null;
      }

      return data;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
  });

  // Estados derivados
  const isActive = subscription?.status === "active" || subscription?.status === "trial";
  const isTrial = subscription?.status === "trial";
  const isExpired = subscription?.status === "expired" || subscription?.status === "cancelled";
  
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
    isExpired,
    daysRemaining: isTrial ? trialDaysRemaining : daysRemaining,
    user,
  };
}
