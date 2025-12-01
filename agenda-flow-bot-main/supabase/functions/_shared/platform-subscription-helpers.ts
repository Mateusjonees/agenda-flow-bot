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
 * Processa pagamento de assinatura de plataforma
 * Consolida lógica duplicada de PIX e Cartão
 */
export async function processPlatformSubscriptionPayment(
  supabaseClient: any,
  data: PlatformSubscriptionData
): Promise<{ success: boolean; subscriptionId?: string; error?: string }> {
  
  try {
    // Calcular next_billing_date (months + 7 dias de trial)
    const nextBillingDate = new Date(data.startDate);
    nextBillingDate.setMonth(nextBillingDate.getMonth() + data.months);
    nextBillingDate.setDate(nextBillingDate.getDate() + 7); // Trial

    console.log(`📅 Processando pagamento para ${data.userId}: ${data.months} meses + 7 dias trial`);

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
 * Cria transação financeira (com verificação de duplicação)
 */
export async function createFinancialTransaction(
  supabaseClient: any,
  userId: string,
  amount: number,
  description: string,
  paymentMethod: string
): Promise<{ success: boolean; error?: string }> {
  
  try {
    // Verificar se transação já existe
    const { data: existing } = await supabaseClient
      .from("financial_transactions")
      .select("id")
      .eq("user_id", userId)
      .eq("amount", amount)
      .eq("description", description)
      .eq("payment_method", paymentMethod)
      .eq("status", "completed")
      .maybeSingle();

    if (existing) {
      console.log("ℹ️ Transação já existe, pulando criação");
      return { success: true };
    }

    // Criar nova transação
    const { error } = await supabaseClient
      .from("financial_transactions")
      .insert({
        user_id: userId,
        type: "income",
        amount: amount,
        description: description,
        payment_method: paymentMethod,
        status: "completed",
        transaction_date: new Date().toISOString()
      });

    if (error) throw error;
    
    console.log("✅ Transação financeira criada");
    return { success: true };
    
  } catch (error: any) {
    console.error("❌ Erro ao criar transação:", error);
    return { success: false, error: error.message };
  }
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

    // Criar transação de renovação
    await createFinancialTransaction(
      supabaseClient,
      userId,
      amount,
      description,
      "mercadopago_subscription"
    );

    console.log("✅ Renovação processada com sucesso");
    return { success: true };
    
  } catch (error: any) {
    console.error("❌ Erro ao processar renovação:", error);
    return { success: false, error: error.message };
  }
}
