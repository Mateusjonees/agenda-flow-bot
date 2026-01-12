import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface PlatformSubscriptionData {
  userId: string;
  months: number;
  amount: number;
  planName: string;
  billingFrequency: string;
  startDate: Date;
}

/**
 * ✅ FUNÇÃO HELPER: Calcula next_billing_date ACUMULANDO dias restantes
 * 
 * Regra:
 * - Se existe assinatura com next_billing_date no futuro → baseDate = next_billing_date (acumula)
 * - Senão → baseDate = paidAt (sem dias extras)
 * - newNextBillingDate = baseDate + months
 */
export function calculateAccumulatedNextBillingDate(
  paidAt: Date,
  months: number,
  existingNextBillingDate?: string | null
): { baseDate: Date; nextBillingDate: Date; accumulatedDays: number } {
  let baseDate = new Date(paidAt);
  let accumulatedDays = 0;

  // Se existe assinatura com dias restantes, acumular
  if (existingNextBillingDate) {
    const existingDate = new Date(existingNextBillingDate);
    const now = new Date();
    
    // Se next_billing_date ainda está no futuro, acumular
    if (existingDate > now) {
      accumulatedDays = Math.ceil((existingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      baseDate = existingDate;
      console.log(`📅 Acumulando ${accumulatedDays} dias restantes. Base: ${baseDate.toISOString()}`);
    }
  }

  // Calcular próximo billing a partir da base (acumulada ou atual)
  const nextBillingDate = new Date(baseDate);
  nextBillingDate.setMonth(nextBillingDate.getMonth() + months);

  console.log(`📆 Período calculado: base=${baseDate.toISOString()}, next=${nextBillingDate.toISOString()}, months=${months}, acumulados=${accumulatedDays} dias`);

  return { baseDate, nextBillingDate, accumulatedDays };
}

/**
 * Processa pagamento de assinatura de plataforma
 * Consolida lógica duplicada de PIX e Cartão
 * 
 * ✅ CORREÇÃO: Removido trial de 7 dias - pagamento = ciclo começa agora
 */
export async function processPlatformSubscriptionPayment(
  supabaseClient: any,
  data: PlatformSubscriptionData
): Promise<{ success: boolean; subscriptionId?: string; error?: string }> {
  
  try {
    // ✅ CORREÇÃO: Calcular next_billing_date SEM adicionar dias de trial
    // Quando o usuário PAGA, o ciclo começa AGORA
    const nextBillingDate = new Date(data.startDate);
    nextBillingDate.setMonth(nextBillingDate.getMonth() + data.months);
    // ❌ REMOVIDO: nextBillingDate.setDate(nextBillingDate.getDate() + 7); // Trial

    console.log(`📅 Processando pagamento para ${data.userId}: ${data.months} meses (sem trial - pagamento confirmado)`);

    // Buscar subscription existente de PLATAFORMA
    const { data: existingSub, error: findError } = await supabaseClient
      .from("subscriptions")
      .select("*")
      .eq("user_id", data.userId)
      .is("customer_id", null)
      .is("plan_id", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (findError) {
      console.error("❌ Erro ao buscar subscription:", findError);
      throw findError;
    }

    if (existingSub) {
      // ✅ Atualizar subscription existente (trial -> active)
      console.log(`✅ Atualizando subscription existente: ${existingSub.id}`);
      
      const { error: updateError } = await supabaseClient
        .from("subscriptions")
        .update({
          status: "active",
          start_date: data.startDate.toISOString(),
          next_billing_date: nextBillingDate.toISOString(),
          last_billing_date: data.startDate.toISOString(),
          failed_payments_count: 0,
          updated_at: new Date().toISOString()
        })
        .eq("id", existingSub.id);

      if (updateError) throw updateError;
      
      return { success: true, subscriptionId: existingSub.id };
      
    } else {
      // ✅ Criar nova subscription de plataforma
      console.log(`✅ Criando nova subscription de plataforma`);
      
      const { data: newSub, error: insertError } = await supabaseClient
        .from("subscriptions")
        .insert({
          user_id: data.userId,
          customer_id: null,  // ✅ EXPLÍCITO: Assinatura de plataforma
          plan_id: null,      // ✅ EXPLÍCITO: Assinatura de plataforma
          status: "active",
          start_date: data.startDate.toISOString(),
          next_billing_date: nextBillingDate.toISOString(),
          last_billing_date: data.startDate.toISOString(),
          failed_payments_count: 0
        })
        .select()
        .single();

      if (insertError) throw insertError;
      
      return { success: true, subscriptionId: newSub.id };
    }
    
  } catch (error: any) {
    console.error("❌ Erro ao processar pagamento:", error);
    return { success: false, error: error.message };
  }
}

/**
 * ⚠️ DEPRECATED: NÃO criar transações financeiras para assinaturas de PLATAFORMA
 * Essas transações apareciam incorretamente nos relatórios dos usuários como "receita"
 * Agora apenas logamos que o pagamento foi processado sem criar registro financeiro
 */
export async function createFinancialTransaction(
  supabaseClient: any,
  userId: string,
  amount: number,
  description: string,
  paymentMethod: string
): Promise<{ success: boolean; error?: string }> {
  
  // ✅ NÃO criar transações para pagamentos de assinatura da plataforma
  // Isso evita que apareçam nos relatórios financeiros dos usuários
  console.log(`ℹ️ Pagamento de plataforma registrado (sem criar transação financeira): ${description} - R$${amount}`);
  return { success: true };
}

/**
 * Atualiza PIX charge para status "paid"
 */
export async function updatePixCharge(
  supabaseClient: any,
  userId: string,
  txid: string
): Promise<{ success: boolean; error?: string }> {
  
  try {
    const { error } = await supabaseClient
      .from("pix_charges")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("txid", txid)
      .eq("user_id", userId);

    if (error) throw error;
    
    console.log("✅ PIX charge atualizado para 'paid'");
    return { success: true };
    
  } catch (error: any) {
    console.error("❌ Erro ao atualizar PIX:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Processa renovação de assinatura recorrente
 */
export async function processSubscriptionRenewal(
  supabaseClient: any,
  userId: string,
  months: number,
  amount: number,
  description: string
): Promise<{ success: boolean; error?: string }> {
  
  try {
    // Buscar subscription de plataforma
    const { data: subscription, error: findError } = await supabaseClient
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .is("customer_id", null)
      .is("plan_id", null)
      .single();

    if (findError || !subscription) {
      throw new Error("Subscription de plataforma não encontrada");
    }

    console.log(`🔄 Processando renovação para subscription ${subscription.id}`);

    // Calcular nova data de cobrança
    const currentBillingDate = new Date(subscription.next_billing_date);
    const newBillingDate = new Date(currentBillingDate);
    newBillingDate.setMonth(newBillingDate.getMonth() + months);

    // Atualizar subscription
    const { error: updateError } = await supabaseClient
      .from("subscriptions")
      .update({
        next_billing_date: newBillingDate.toISOString(),
        last_billing_date: new Date().toISOString(),
        failed_payments_count: 0,
        status: "active",
        updated_at: new Date().toISOString()
      })
      .eq("id", subscription.id);

    if (updateError) throw updateError;

    // ✅ NÃO criar transação financeira para renovações de plataforma
    console.log(`ℹ️ Renovação processada (sem criar transação financeira): ${description} - R$${amount}`);

    console.log("✅ Renovação processada com sucesso");
    return { success: true };
    
  } catch (error: any) {
    console.error("❌ Erro ao processar renovação:", error);
    return { success: false, error: error.message };
  }
}
