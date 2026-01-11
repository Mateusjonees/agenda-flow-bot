import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PreferenceRequest {
  plan_id?: string;
  plan_name?: string;
  price?: number;
  billing_frequency?: string;
  months?: number;
  user_id?: string;
  planType?: "monthly" | "semestral" | "annual";
  // Checkout transparente
  card_token_id?: string;
  payer_email?: string;
  payer_identification?: {
    type: string;
    number: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const requestData: PreferenceRequest = await req.json();
    
    // Mapear billing_frequency do frontend para planType interno
    const billingToTypeMap: Record<string, string> = {
      "monthly": "monthly",
      "semiannual": "semestral",
      "annual": "annual"
    };
    
    // Suporta tanto o formato antigo (planType) quanto o novo (billing_frequency)
    const planType = requestData.planType || billingToTypeMap[requestData.billing_frequency || ""] || "monthly";

    console.log(`Creating subscription preference for user ${user.id} with plan ${planType}`, requestData);

  // Definir preços e descrições baseado no plano
    const planDetails: Record<string, { price: number; title: string; description: string; frequency: number; frequency_type: string }> = {
      monthly: { 
        price: 49.00, 
        title: "Plano Mensal", 
        description: "Assinatura mensal da plataforma - Ideal para começar",
        frequency: 1,
        frequency_type: "months"
      },
      semestral: { 
        price: 259.00, 
        title: "Plano Semestral", 
        description: "Assinatura semestral da plataforma - Economia de 12%",
        frequency: 6,
        frequency_type: "months"
      },
      annual: { 
        price: 475.00, 
        title: "Plano Anual", 
        description: "Assinatura anual da plataforma - Economia de 19%",
        frequency: 12,
        frequency_type: "months"
      }
    };

    const selectedPlan = planDetails[planType] || planDetails.monthly;

    // Buscar dados do perfil do usuário
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("full_name, phone, cpf")
      .eq("id", user.id)
      .single();

    const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    
    if (!accessToken) {
      throw new Error("Mercado Pago access token not configured");
    }

    // ============================================================
    // FLUXO DE CARTÃO: Pagamento único imediato + assinatura recorrente
    // ============================================================
    if (requestData.card_token_id) {
      console.log("💳 Processing card payment: immediate charge + recurring subscription");
      
      // PASSO 1: Cobrar o valor integral AGORA via API de pagamentos
      console.log(`💰 STEP 1: Creating immediate payment of R$${selectedPlan.price}`);
      
      const paymentData = {
        transaction_amount: selectedPlan.price,
        token: requestData.card_token_id,
        description: selectedPlan.title,
        installments: 1,
        payment_method_id: "master", // Será detectado automaticamente pelo token
        payer: {
          email: requestData.payer_email || user.email,
          identification: requestData.payer_identification || {
            type: "CPF",
            number: profile?.cpf?.replace(/\D/g, '') || ""
          }
        },
        external_reference: user.id,
        metadata: {
          userId: user.id,
          planId: planType,
          billingFrequency: planType,
          planName: selectedPlan.title,
          months: selectedPlan.frequency,
          type: "platform_subscription",
          payment_type: "first_payment" // Identifica como primeiro pagamento
        }
      };

      console.log("📤 Sending payment request to Mercado Pago:", { 
        ...paymentData, 
        token: "[REDACTED]" 
      });

      const paymentResponse = await fetch("https://api.mercadopago.com/v1/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
          "X-Idempotency-Key": `${user.id}-${Date.now()}` // Evita cobranças duplicadas
        },
        body: JSON.stringify(paymentData),
      });

      const paymentResponseText = await paymentResponse.text();
      let paymentResult;
      
      try {
        paymentResult = JSON.parse(paymentResponseText);
      } catch {
        console.error("Failed to parse payment response:", paymentResponseText);
        throw new Error("Resposta inválida do Mercado Pago");
      }

      console.log("📥 Payment response:", {
        id: paymentResult.id,
        status: paymentResult.status,
        status_detail: paymentResult.status_detail
      });

      // Se o pagamento NÃO foi aprovado, retornar erro
      if (paymentResult.status !== "approved") {
        console.error("❌ Payment not approved:", paymentResult);
        
        // Mapeamento de códigos de erro do MP para mensagens amigáveis
        const errorMessages: Record<string, string> = {
          "cc_rejected_high_risk": "Pagamento recusado pelo sistema de segurança do Mercado Pago. Isso pode acontecer com primeira compra, CPF diferente do titular, ou limite de segurança do cartão. Tente outro cartão ou use PIX.",
          "cc_rejected_insufficient_amount": "Saldo insuficiente no cartão.",
          "cc_rejected_bad_filled_card_number": "Número do cartão incorreto.",
          "cc_rejected_bad_filled_date": "Data de validade incorreta.",
          "cc_rejected_bad_filled_security_code": "Código de segurança (CVV) incorreto.",
          "cc_rejected_bad_filled_other": "Dados do cartão incorretos. Verifique e tente novamente.",
          "cc_rejected_blacklist": "Cartão não permitido. Use outro cartão.",
          "cc_rejected_call_for_authorize": "Você precisa autorizar o pagamento com seu banco antes de continuar.",
          "cc_rejected_card_disabled": "Cartão desabilitado. Entre em contato com seu banco.",
          "cc_rejected_duplicated_payment": "Pagamento duplicado. Já existe uma transação recente com este cartão.",
          "cc_rejected_max_attempts": "Limite de tentativas atingido. Aguarde alguns minutos e tente novamente.",
          "cc_rejected_card_error": "Erro no cartão. Tente outro cartão.",
          "cc_rejected_other_reason": "Pagamento recusado. Tente outro cartão ou método de pagamento.",
          "pending_contingency": "O pagamento está sendo processado. Aguarde a confirmação.",
          "pending_review_manual": "O pagamento está em análise. Aguarde até 2 dias úteis.",
        };

        const errorCode = paymentResult.status_detail || paymentResult.error || "";
        let userFriendlyMessage = errorMessages[errorCode] || 
          "Não foi possível processar o pagamento. Verifique os dados do cartão ou tente outro método.";

        return new Response(
          JSON.stringify({ 
            success: false,
            error: userFriendlyMessage,
            error_code: errorCode,
            status: paymentResult.status
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      console.log("✅ STEP 1 COMPLETE: Payment approved! ID:", paymentResult.id);

      // PASSO 2: Ativar assinatura no banco de dados (pagamento confirmado)
      const startDate = new Date();
      const nextBillingDate = new Date(startDate);
      nextBillingDate.setMonth(nextBillingDate.getMonth() + selectedPlan.frequency);

      console.log(`📅 STEP 2: Activating subscription. Start: ${startDate.toISOString()}, Next: ${nextBillingDate.toISOString()}`);

      // Buscar subscription existente
      const { data: existingSub } = await supabaseClient
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .is("customer_id", null)
        .is("plan_id", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingSub) {
        // Atualizar subscription existente
        const { error: updateError } = await supabaseClient
          .from("subscriptions")
          .update({
            status: "active",
            type: "platform",
            billing_frequency: planType,
            payment_method: "credit_card",
            plan_name: selectedPlan.title,
            start_date: startDate.toISOString(),
            next_billing_date: nextBillingDate.toISOString(),
            last_billing_date: startDate.toISOString(),
            failed_payments_count: 0,
            updated_at: new Date().toISOString()
          })
          .eq("id", existingSub.id);

        if (updateError) {
          console.error("❌ Error updating subscription:", updateError);
        } else {
          console.log(`✅ Subscription ${existingSub.id} updated to ACTIVE`);
        }
      } else {
        // Criar nova subscription
        const { error: insertError } = await supabaseClient
          .from("subscriptions")
          .insert({
            user_id: user.id,
            customer_id: null,
            plan_id: null,
            type: "platform",
            status: "active",
            billing_frequency: planType,
            payment_method: "credit_card",
            plan_name: selectedPlan.title,
            start_date: startDate.toISOString(),
            next_billing_date: nextBillingDate.toISOString(),
            last_billing_date: startDate.toISOString(),
            failed_payments_count: 0
          });

        if (insertError) {
          console.error("❌ Error creating subscription:", insertError);
        } else {
          console.log("✅ New platform subscription created");
        }
      }

      // PASSO 3 (OPCIONAL): Criar assinatura recorrente para próximos meses
      // Nota: Podemos pular isso e processar renovações manualmente ou via cron
      // Por enquanto, vamos deixar só o pagamento único ativando a assinatura
      // A renovação pode ser tratada quando a next_billing_date chegar

      console.log("🎉 Card payment flow complete! Subscription activated.");

      return new Response(
        JSON.stringify({ 
          success: true,
          payment_id: paymentResult.id,
          status: "approved",
          message: "Assinatura ativada com sucesso! Pagamento de R$" + selectedPlan.price.toFixed(2) + " confirmado.",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ============================================================
    // FLUXO DE REDIRECT (PIX ou checkout externo)
    // ============================================================
    // Criar data de início com buffer de 5 minutos no futuro
    const startDate = new Date();
    startDate.setMinutes(startDate.getMinutes() + 5);

    const preferenceData = {
      reason: selectedPlan.title,
      auto_recurring: {
        frequency: selectedPlan.frequency,
        frequency_type: selectedPlan.frequency_type,
        transaction_amount: selectedPlan.price,
        currency_id: "BRL",
        start_date: startDate.toISOString(),
      },
      status: "pending",
      back_url: `${Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".lovableproject.com") || ""}/configuracoes`,
      payer_email: user.email,
      external_reference: user.id,
      metadata: {
        userId: user.id,
        planId: planType,
        billingFrequency: planType,
        planName: selectedPlan.title,
        months: selectedPlan.frequency,
        type: "platform_subscription"
      }
    };

    console.log("Creating Mercado Pago subscription preference with data:", preferenceData);

    const mpResponse = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify(preferenceData),
    });

    if (!mpResponse.ok) {
      const errorText = await mpResponse.text();
      console.error("Mercado Pago error:", errorText);
      throw new Error(`Erro ao criar preferência no Mercado Pago: ${errorText}`);
    }

    const preferenceResponse = await mpResponse.json();

    console.log(`Subscription preference created successfully: ${preferenceResponse.id}`);

    return new Response(
      JSON.stringify({ 
        success: true,
        init_point: preferenceResponse.init_point,
        preference_id: preferenceResponse.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error creating subscription preference:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Erro ao criar preferência de assinatura",
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
