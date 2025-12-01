import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkUserSubscription } from "../_shared/check-subscription.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Edge Function: process-whatsapp-message
 * 
 * Propósito:
 * - Processar mensagens recebidas de clientes (chamada assíncrona)
 * - Chamar IA para detectar intent e gerar resposta
 * - Executar ações baseadas no intent (buscar produtos, adicionar ao carrinho)
 * - Enviar resposta ao cliente via WhatsApp
 * 
 * Intents suportados:
 * - greeting: Saudação inicial
 * - browse_products: Cliente quer ver produtos
 * - product_inquiry: Pergunta sobre produto específico
 * - add_to_cart: Adicionar produto ao carrinho
 * - view_cart: Ver carrinho atual
 * - checkout: Finalizar pedido
 * - customer_support: Transferir para atendente humano
 */

interface ProcessMessageRequest {
  conversation_id: string;
  message_id: string;
  user_id: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { conversation_id, message_id, user_id }: ProcessMessageRequest =
      await req.json();

    console.log("🤖 Processing message:", {
      conversation_id,
      message_id,
      user_id,
    });

    // ✅ VERIFICAR SUBSCRIPTION (segurança extra)
    const subscriptionCheck = await checkUserSubscription(supabase, user_id);
    
    if (!subscriptionCheck.isActive) {
      console.log(`⚠️ Subscription expired for user ${user_id}, skipping AI processing`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          reason: "subscription_expired",
          message: "Subscription expired, bot is blocked"
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403
        }
      );
    }

    // 1. Buscar mensagem e contexto da conversa
    const { data: message, error: msgError } = await supabase
      .from("whatsapp_messages")
      .select("*, conversation:whatsapp_conversations(*)")
      .eq("whatsapp_message_id", message_id)
      .single();

    if (msgError || !message) {
      throw new Error(`Message not found: ${message_id}`);
    }

    const { data: conversation } = await supabase
      .from("whatsapp_conversations")
      .select("*, customer:customers(*)")
      .eq("id", conversation_id)
      .single();

    if (!conversation) {
      throw new Error(`Conversation not found: ${conversation_id}`);
    }

    // 2. Verificar se deve transferir para humano
    if (conversation.assigned_to_human) {
      console.log("👤 Conversation assigned to human, skipping AI");
      return new Response(
        JSON.stringify({ success: true, reason: "assigned_to_human" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Chamar IA para processar mensagem
    const aiUrl = `${supabaseUrl}/functions/v1/whatsapp-ai-assistant`;
    const aiResponse = await fetch(aiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        message: message.content,
        message_type: message.message_type,
        conversation_id,
        user_id,
        customer_id: conversation.customer_id,
        context: conversation.context || {},
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI processing failed: ${aiResponse.statusText}`);
    }

    const aiResult = await aiResponse.json();
    console.log("🧠 AI Response:", aiResult);

    // 4. Atualizar mensagem com resultado da IA
    await supabase
      .from("whatsapp_messages")
      .update({
        ai_processed: true,
        ai_response: aiResult,
      })
      .eq("id", message.id);

    // 5. Atualizar contexto da conversa
    await supabase
      .from("whatsapp_conversations")
      .update({
        context: aiResult.updated_context,
        last_intent: aiResult.intent,
      })
      .eq("id", conversation_id);

    // 6. Executar ações baseadas no intent
    let actionResult = null;

    switch (aiResult.intent) {
      case "add_to_cart":
        // Chamar manage-shopping-cart
        if (aiResult.entities?.product_id && aiResult.entities?.quantity) {
          const cartUrl = `${supabaseUrl}/functions/v1/manage-shopping-cart`;
          const cartResponse = await fetch(cartUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({
              action: "add_item",
              user_id,
              customer_id: conversation.customer_id,
              conversation_id,
              product_id: aiResult.entities.product_id,
              variant_id: aiResult.entities.variant_id,
              quantity: aiResult.entities.quantity,
            }),
          });

          actionResult = await cartResponse.json();
          console.log("🛒 Cart updated:", actionResult);
        }
        break;

      case "checkout":
        // Chamar create-order-from-cart
        const orderUrl = `${supabaseUrl}/functions/v1/create-order-from-cart`;
        const orderResponse = await fetch(orderUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            user_id,
            customer_id: conversation.customer_id,
            conversation_id,
            shipping_address: aiResult.entities?.shipping_address,
          }),
        });

        actionResult = await orderResponse.json();
        console.log("📦 Order created:", actionResult);
        break;

      case "customer_support":
        // Transferir para atendimento humano
        await supabase
          .from("whatsapp_conversations")
          .update({
            assigned_to_human: true,
            status: "waiting_human",
          })
          .eq("id", conversation_id);

        console.log("👤 Transferred to human support");
        break;
    }

    // 7. Enviar resposta ao cliente
    if (aiResult.response_message) {
      const sendUrl = `${supabaseUrl}/functions/v1/send-whatsapp-message`;
      await fetch(sendUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          user_id,
          conversation_id,
          to: conversation.whatsapp_phone,
          message_type: aiResult.response_type || "text",
          content: aiResult.response_message,
          buttons: aiResult.buttons,
          list: aiResult.list,
        }),
      });

      console.log("✅ Response sent to customer");
    }

    return new Response(
      JSON.stringify({
        success: true,
        intent: aiResult.intent,
        action_result: actionResult,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("❌ Processing error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
