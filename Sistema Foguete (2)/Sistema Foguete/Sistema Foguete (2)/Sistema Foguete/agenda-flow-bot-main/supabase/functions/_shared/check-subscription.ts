import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Resultado da verificação de subscription
 */
export interface SubscriptionCheckResult {
  isActive: boolean;
  isTrial: boolean;
  isExpired: boolean;
  daysRemaining: number;
  subscription: any | null;
  message?: string;
}

/**
 * Verifica status da subscription de plataforma do usuário
 * 
 * REGRAS:
 * - Trial: 7 dias a partir do start_date
 * - Active: status = 'active' E dentro do período válido
 * - Expired: status = 'expired' OU (cancelled E past next_billing_date)
 * 
 * @param supabaseClient Cliente Supabase com service_role
 * @param userId ID do usuário (auth.users.id)
 * @returns SubscriptionCheckResult com status e dados da subscription
 */
export async function checkUserSubscription(
  supabaseClient: SupabaseClient,
  userId: string
): Promise<SubscriptionCheckResult> {
  try {
    console.log(`🔍 Checking subscription for user: ${userId}`);

    // Buscar subscription de plataforma (customer_id = NULL, plan_id = NULL)
    const { data: subscription, error } = await supabaseClient
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .is("customer_id", null)
      .is("plan_id", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("❌ Error fetching subscription:", error);
      throw error;
    }

    // Se não tem subscription, considerar expirado
    if (!subscription) {
      console.log("⚠️ No subscription found for user");
      return {
        isActive: false,
        isTrial: false,
        isExpired: true,
        daysRemaining: 0,
        subscription: null,
        message: "⚠️ Assinatura Expirada - Modo Somente Leitura\n\nSeu período de testes expirou. Para continuar utilizando nossos serviços, renove sua assinatura.",
      };
    }

    const now = new Date();
    const startDate = new Date(subscription.start_date);
    const nextBillingDate = new Date(subscription.next_billing_date);

    // Calcular trial: 7 dias a partir do start_date
    const trialEndDate = new Date(startDate);
    trialEndDate.setDate(trialEndDate.getDate() + 7);
    
    const isTrial = now < trialEndDate;
    const daysRemaining = Math.ceil(
      (trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Verificar se está expirado
    const isExpired =
      subscription.status === "expired" ||
      (subscription.status === "cancelled" && now > nextBillingDate);

    // Verificar se está ativo
    const isActive =
      (subscription.status === "active" || subscription.status === "trial") &&
      !isExpired;

    console.log(`✅ Subscription check complete:`, {
      status: subscription.status,
      isActive,
      isTrial,
      isExpired,
      daysRemaining: isTrial ? daysRemaining : 0,
    });

    // Gerar mensagem apropriada
    let message: string | undefined;
    
    if (isExpired) {
      message = "⚠️ Assinatura Expirada - Modo Somente Leitura\n\nSeu período de testes expirou. Para continuar utilizando nossos serviços, renove sua assinatura.";
    } else if (isTrial && daysRemaining <= 3) {
      message = `⚠️ Período de teste acabando\n\nRestam apenas ${daysRemaining} ${daysRemaining === 1 ? "dia" : "dias"} de teste. Assine agora para continuar usando todos os recursos.`;
    }

    return {
      isActive,
      isTrial,
      isExpired,
      daysRemaining: isTrial ? Math.max(0, daysRemaining) : 0,
      subscription,
      message,
    };
  } catch (error) {
    console.error("❌ Error in checkUserSubscription:", error);
    // Em caso de erro, bloquear acesso por segurança
    return {
      isActive: false,
      isTrial: false,
      isExpired: true,
      daysRemaining: 0,
      subscription: null,
      message: "⚠️ Erro ao verificar assinatura. Tente novamente mais tarde.",
    };
  }
}
