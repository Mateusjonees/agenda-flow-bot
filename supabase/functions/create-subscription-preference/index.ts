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
      .select("full_name, phone")
      .eq("id", user.id)
      .single();

    // Criar preferência de assinatura no Mercado Pago
    const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    
    if (!accessToken) {
      throw new Error("Mercado Pago access token not configured");
    }

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
        // ✅ REMOVIDO: free_trial de 7 dias
        // Agora a cobrança é feita imediatamente ao invés de após 7 dias
      },
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

    // Se vier card_token_id, fazer checkout transparente (cartão dentro do app)
    if (requestData.card_token_id) {
      console.log("Processing transparent checkout with card token");
      
      const cardPreferenceData = {
        ...preferenceData,
        card_token_id: requestData.card_token_id,
        status: "authorized", // Autorizar imediatamente
      };

      // Se tiver dados do pagador, adicionar
      if (requestData.payer_email) {
        (cardPreferenceData as any).payer_email = requestData.payer_email;
      }

      console.log("Creating Mercado Pago subscription with card token:", { 
        ...cardPreferenceData, 
        card_token_id: "[REDACTED]" 
      });

      const mpResponse = await fetch("https://api.mercadopago.com/preapproval", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
        },
        body: JSON.stringify(cardPreferenceData),
      });

      const responseText = await mpResponse.text();
      let responseData;
      
      try {
        responseData = JSON.parse(responseText);
      } catch {
        console.error("Failed to parse MP response:", responseText);
        throw new Error("Resposta inválida do Mercado Pago");
      }

      if (!mpResponse.ok) {
        console.error("Mercado Pago card payment error:", responseData);
        
        // Mapeamento de códigos de erro do MP para mensagens amigáveis em português
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
          "invalid_card_number": "Número do cartão inválido.",
          "invalid_expiry_date": "Data de validade inválida.",
          "invalid_security_code": "Código de segurança inválido.",
          "card_expired": "Cartão expirado. Use outro cartão.",
        };

        // Tentar encontrar o código de erro nos diferentes lugares da resposta
        // O código principal vem em responseData.code para erros de cartão
        const errorCode = responseData.code ||
          responseData.error || 
          responseData.cause?.[0]?.code || 
          responseData.status_detail ||
          "";
        
        console.log(`Payment error code: ${errorCode}, message: ${responseData.message}`);
        
        // Buscar mensagem amigável ou usar genérica
        let userFriendlyMessage = errorMessages[errorCode];
        
        if (!userFriendlyMessage) {
          // Tentar mensagem do MP ou mensagem genérica
          if (responseData.message && !responseData.message.includes("CC_VAL_")) {
            userFriendlyMessage = responseData.message;
          } else {
            userFriendlyMessage = "Não foi possível processar o pagamento. Verifique os dados do cartão ou tente outro método de pagamento.";
          }
        }

        return new Response(
          JSON.stringify({ 
            success: false,
            error: userFriendlyMessage,
            error_code: errorCode || "payment_error",
            error_description: userFriendlyMessage,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      console.log(`Subscription created with card successfully: ${responseData.id}, status: ${responseData.status}`);

      // Criar registro da assinatura no banco
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      // Calcular próxima data de cobrança
      const nextBillingDate = new Date();
      nextBillingDate.setMonth(nextBillingDate.getMonth() + selectedPlan.frequency);

      await supabaseClient.from("subscriptions").upsert({
        user_id: user.id,
        status: responseData.status === "authorized" ? "active" : "pending",
        plan_type: planType,
        amount: selectedPlan.price,
        payment_method: "credit_card",
        mp_subscription_id: responseData.id,
        next_billing_date: nextBillingDate.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id",
        ignoreDuplicates: false,
      });

      return new Response(
        JSON.stringify({ 
          success: true,
          preapproval_id: responseData.id,
          status: responseData.status,
          message: responseData.status === "authorized" 
            ? "Assinatura ativada com sucesso!" 
            : "Assinatura criada, aguardando confirmação",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fluxo normal (redirect para init_point) - usado como fallback
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
