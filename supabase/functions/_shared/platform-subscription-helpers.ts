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
 * Regra CORRIGIDA:
 * - Se existe assinatura com next_billing_date no futuro → acumula a partir de next_billing_date
 * - Se existe assinatura com next_billing_date no passado → usa paidAt como base
 * - newNextBillingDate = baseDate + months
 * 
 * ⚠️ GUARD-RAIL: Limita acúmulo máximo a 400 dias no futuro para evitar bugs
 */
export function calculateAccumulatedNextBillingDate(
  paidAt: Date,
  months: number,
  existingNextBillingDate?: string | null
): { baseDate: Date; nextBillingDate: Date; accumulatedDays: number } {
  const now = new Date();
  let baseDate = new Date(paidAt);
  let accumulatedDays = 0;

  // Normalizar months para valores válidos (1, 6, 12)
  const normalizedMonths = [1, 6, 12].includes(months) ? months : 
    (months <= 3 ? 1 : months <= 9 ? 6 : 12);

  if (normalizedMonths !== months) {
    console.warn(`⚠️ Meses normalizados de ${months} para ${normalizedMonths}`);
  }

  // Se existe assinatura com dias restantes, acumular
  if (existingNextBillingDate) {
    const existingDate = new Date(existingNextBillingDate);
    
    // Se next_billing_date ainda está no futuro, acumular
    if (existingDate > now) {
      accumulatedDays = Math.ceil((existingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      // ✅ GUARD-RAIL: Limitar acúmulo máximo para evitar datas absurdas
      const maxAccumulatedDays = 400; // ~13 meses máximo acumulado
      if (accumulatedDays > maxAccumulatedDays) {
        console.warn(`⚠️ Acúmulo limitado de ${accumulatedDays} para ${maxAccumulatedDays} dias`);
        accumulatedDays = maxAccumulatedDays;
        // Recalcular existingDate baseado no limite
        baseDate = new Date(now);
        baseDate.setDate(baseDate.getDate() + maxAccumulatedDays);
      } else {
        baseDate = existingDate;
      }
      console.log(`📅 Acumulando ${accumulatedDays} dias restantes. Base: ${baseDate.toISOString()}`);
    } else {
      // Assinatura vencida - começar do pagamento
      console.log(`📅 Assinatura vencida em ${existingDate.toISOString()}, usando data do pagamento: ${paidAt.toISOString()}`);
    }
  }

  // Calcular próximo billing a partir da base (acumulada ou atual)
  const nextBillingDate = new Date(baseDate);
  nextBillingDate.setMonth(nextBillingDate.getMonth() + normalizedMonths);

  // ✅ GUARD-RAIL FINAL: Garantir que next_billing_date não ultrapasse limite razoável
  const maxFutureDays = 400;
  const daysFromNow = Math.ceil((nextBillingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysFromNow > maxFutureDays) {
    console.warn(`⚠️ Next billing date limitado de ${daysFromNow} para ${maxFutureDays} dias no futuro`);
    const limitedDate = new Date(now);
    limitedDate.setDate(limitedDate.getDate() + maxFutureDays);
    return { baseDate, nextBillingDate: limitedDate, accumulatedDays: Math.min(accumulatedDays, maxFutureDays - (normalizedMonths * 30)) };
  }

  console.log(`📆 Período calculado: base=${baseDate.toISOString()}, next=${nextBillingDate.toISOString()}, months=${normalizedMonths}, acumulados=${accumulatedDays} dias`);

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
    // Normalizar months
    const normalizedMonths = [1, 6, 12].includes(data.months) ? data.months : 
      (data.months <= 3 ? 1 : data.months <= 9 ? 6 : 12);

    // ✅ CORREÇÃO: Calcular next_billing_date SEM adicionar dias de trial
    const nextBillingDate = new Date(data.startDate);
    nextBillingDate.setMonth(nextBillingDate.getMonth() + normalizedMonths);

    console.log(`📅 Processando pagamento para ${data.userId}: ${normalizedMonths} meses (sem trial - pagamento confirmado)`);

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
      // ✅ Usar acumulação correta
      const { nextBillingDate: accumulatedNextBilling, accumulatedDays } = calculateAccumulatedNextBillingDate(
        data.startDate,
        normalizedMonths,
        existingSub.next_billing_date
      );

      console.log(`✅ Atualizando subscription existente: ${existingSub.id} (+${accumulatedDays} dias acumulados)`);
      
      const { error: updateError } = await supabaseClient
        .from("subscriptions")
        .update({
          status: "active",
          type: "platform",
          start_date: data.startDate.toISOString(),
          next_billing_date: accumulatedNextBilling.toISOString(),
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
          customer_id: null,
          plan_id: null,
          type: "platform",
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
  console.log(`ℹ️ Pagamento de plataforma registrado (sem criar transação financeira): ${description} - R$${amount}`);
  return { success: true };
}

/**
 * Atualiza PIX charge para status "paid" e marca como processado
 */
export async function updatePixCharge(
  supabaseClient: any,
  userId: string,
  txid: string,
  processedFor?: string
): Promise<{ success: boolean; error?: string }> {
  
  try {
    const updateData: any = {
      status: "paid",
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Se processedFor informado, marcar como processado
    if (processedFor) {
      updateData.processed_at = new Date().toISOString();
      updateData.processed_for = processedFor;
    }

    const { error } = await supabaseClient
      .from("pix_charges")
      .update(updateData)
      .eq("txid", txid)
      .eq("user_id", userId);

    if (error) throw error;
    
    console.log("✅ PIX charge atualizado para 'paid'" + (processedFor ? ` (processado para: ${processedFor})` : ''));
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
    // Normalizar months
    const normalizedMonths = [1, 6, 12].includes(months) ? months : 
      (months <= 3 ? 1 : months <= 9 ? 6 : 12);

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

    // Usar função de acumulação
    const { nextBillingDate, accumulatedDays } = calculateAccumulatedNextBillingDate(
      new Date(),
      normalizedMonths,
      subscription.next_billing_date
    );

    console.log(`📅 Nova data de billing: ${nextBillingDate.toISOString()} (+${accumulatedDays} dias acumulados)`);

    // Atualizar subscription
    const { error: updateError } = await supabaseClient
      .from("subscriptions")
      .update({
        next_billing_date: nextBillingDate.toISOString(),
        last_billing_date: new Date().toISOString(),
        failed_payments_count: 0,
        status: "active",
        type: "platform",
        updated_at: new Date().toISOString()
      })
      .eq("id", subscription.id);

    if (updateError) throw updateError;

    console.log(`ℹ️ Renovação processada (sem criar transação financeira): ${description} - R$${amount}`);
    console.log("✅ Renovação processada com sucesso");
    return { success: true };
    
  } catch (error: any) {
    console.error("❌ Erro ao processar renovação:", error);
    return { success: false, error: error.message };
  }
}

/**
 * ✅ NOVA FUNÇÃO: Marca PIX charge como processado atomicamente
 * Retorna true se conseguiu o lock (pode processar), false se já foi processado
 */
export async function tryLockPixCharge(
  supabaseClient: any,
  chargeId: string,
  processedFor: string
): Promise<{ locked: boolean; charge?: any }> {
  
  const { data: lockedCharge, error } = await supabaseClient
    .from("pix_charges")
    .update({ 
      processed_at: new Date().toISOString(),
      processed_for: processedFor,
      updated_at: new Date().toISOString()
    })
    .eq("id", chargeId)
    .is("processed_at", null)
    .select()
    .maybeSingle();

  if (error || !lockedCharge) {
    console.log(`⏭️ Charge ${chargeId} já foi processado, pulando...`);
    return { locked: false };
  }

  console.log(`🔒 Lock adquirido para charge ${chargeId} (${processedFor})`);
  return { locked: true, charge: lockedCharge };
}
