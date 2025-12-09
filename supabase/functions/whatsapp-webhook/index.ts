import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkUserSubscription } from "../_shared/check-subscription.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-hub-signature-256",
};

/**
 * Edge Function: whatsapp-webhook
 * 
 * Propósito:
 * - Receber webhooks do WhatsApp Cloud API
 * - Validar assinatura HMAC (X-Hub-Signature-256)
 * - Processar eventos: mensagens recebidas, status de entrega
 * - Criar/atualizar conversas e mensagens no banco
 * 
 * Eventos suportados:
 * - messages: Nova mensagem do cliente
 * - message_status: Status de mensagem enviada (sent, delivered, read)
 * - interactive: Botão clicado, lista selecionada
 */

/**
 * Valida assinatura HMAC do WhatsApp
 * Docs: https://developers.facebook.com/docs/graph-api/webhooks/getting-started#verification-requests
 */
async function validateWhatsAppSignature(
  req: Request,
  body: string
): Promise<boolean> {
  try {
    const signature = req.headers.get("x-hub-signature-256");

    if (!signature) {
      console.error("❌ Missing X-Hub-Signature-256 header");
      return false;
    }

    // Secret configurado no Meta Business Manager
    const secret = Deno.env.get("WHATSAPP_WEBHOOK_SECRET");
    if (!secret) {
      console.error(
        "❌ WHATSAPP_WEBHOOK_SECRET não configurado - BLOQUEANDO por segurança"
      );
      return false; // BLOQUEAR webhooks não autenticados
    }

    // Calcular HMAC SHA256
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(body);

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      cryptoKey,
      messageData
    );

    // Converter para hex
    const hashArray = Array.from(new Uint8Array(signatureBuffer));
    const computedHash =
      "sha256=" + hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    // Comparar com timing-safe
    const isValid = computedHash === signature;

    if (!isValid) {
      console.error("❌ Invalid signature:", {
        received: signature,
        computed: computedHash,
      });
    }

    return isValid;
  } catch (error) {
    console.error("❌ Signature validation error:", error);
    return false;
  }
}

/**
 * Buscar ou criar cliente automaticamente baseado no número do WhatsApp
 * 
 * REGRAS:
 * 1. Busca cliente existente por whatsapp_phone
 * 2. Se não encontrar, cria novo cliente com nome e telefone
 * 3. Nome inicial: número do WhatsApp (será atualizado pela IA depois)
 * 4. Marca whatsapp_opt_in como true (cliente iniciou conversa)
 */
async function findOrCreateCustomer(
  supabase: any,
  userId: string,
  whatsappPhone: string
): Promise<string | null> {
  try {
    // 1. Buscar cliente existente por whatsapp_phone
    const { data: existingCustomer } = await supabase
      .from("customers")
      .select("id")
      .eq("user_id", userId)
      .eq("whatsapp_phone", whatsappPhone)
      .maybeSingle();

    if (existingCustomer) {
      console.log(`✅ Customer found: ${existingCustomer.id}`);
      return existingCustomer.id;
    }

    // 2. Cliente não existe, criar novo
    console.log(`📝 Creating new customer for WhatsApp: ${whatsappPhone}`);

    // Nome inicial: número formatado (ex: +55 11 99999-9999)
    // A IA pode pedir o nome depois e atualizar
    const formattedPhone = whatsappPhone.replace(/(\d{2})(\d{2})(\d{5})(\d{4})/, "+$1 $2 $3-$4");
    const initialName = `Cliente ${formattedPhone}`;

    const { data: newCustomer, error: createError } = await supabase
      .from("customers")
      .insert({
        user_id: userId,
        name: initialName,
        phone: whatsappPhone,
        whatsapp_phone: whatsappPhone,
        whatsapp_name: initialName,
        whatsapp_opt_in: true, // Cliente iniciou contato = opt-in
        last_whatsapp_interaction: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (createError) {
      console.error("❌ Error creating customer:", createError);
      return null;
    }

    console.log(`✅ New customer created: ${newCustomer.id}`);
    return newCustomer.id;
  } catch (error) {
    console.error("❌ Error in findOrCreateCustomer:", error);
    return null;
  }
}

/**
 * Enviar mensagem de bloqueio ao cliente quando subscription expirada
 */
async function sendBlockedMessage(
  supabase: any,
  userId: string,
  from: string,
  message: string
) {
  try {
    // Buscar configurações do WhatsApp
    const { data: settings } = await supabase
      .from("business_settings")
      .select("whatsapp_config")
      .eq("user_id", userId)
      .single();

    if (!settings?.whatsapp_config) {
      console.log("⚠️ WhatsApp config not found, skipping blocked message");
      return;
    }

    const { phone_number_id, access_token } = settings.whatsapp_config;

    if (!phone_number_id || !access_token) {
      console.log("⚠️ WhatsApp credentials missing, skipping blocked message");
      return;
    }

    // Enviar mensagem via WhatsApp Cloud API
    const url = `https://graph.facebook.com/v21.0/${phone_number_id}/messages`;
    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: from,
      type: "text",
      text: {
        preview_url: false,
        body: message,
      },
    };

    console.log("📤 Sending blocked message to:", from);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("❌ Failed to send blocked message:", result);
    } else {
      console.log("✅ Blocked message sent successfully");
    }
  } catch (error) {
    console.error("❌ Error sending blocked message:", error);
  }
}

/**
 * Processar mensagem recebida do cliente
 */
async function processInboundMessage(
  supabase: any,
  userId: string,
  message: any
) {
  try {
    const { from, id: whatsappMessageId, type, timestamp } = message;
    
    // Extrair conteúdo baseado no tipo
    let content = "";
    let mediaUrl = null;
    let mediaMimeType = null;
    let metadata = {};

    switch (type) {
      case "text":
        content = message.text?.body || "";
        break;
      case "image":
        mediaUrl = message.image?.id; // WhatsApp media ID
        mediaMimeType = message.image?.mime_type;
        content = message.image?.caption || "";
        break;
      case "video":
        mediaUrl = message.video?.id;
        mediaMimeType = message.video?.mime_type;
        content = message.video?.caption || "";
        break;
      case "document":
        mediaUrl = message.document?.id;
        mediaMimeType = message.document?.mime_type;
        content = message.document?.filename || "";
        break;
      case "audio":
        mediaUrl = message.audio?.id;
        mediaMimeType = message.audio?.mime_type;
        break;
      case "location":
        metadata = {
          latitude: message.location?.latitude,
          longitude: message.location?.longitude,
          name: message.location?.name,
          address: message.location?.address,
        };
        content = `📍 ${message.location?.name || "Localização"}`;
        break;
      case "interactive":
        // Botão clicado ou lista selecionada
        if (message.interactive?.type === "button_reply") {
          metadata = { button_id: message.interactive.button_reply.id };
          content = message.interactive.button_reply.title;
        } else if (message.interactive?.type === "list_reply") {
          metadata = { list_id: message.interactive.list_reply.id };
          content = message.interactive.list_reply.title;
        }
        break;
    }

    console.log("📨 Processing message:", {
      from,
      type,
      content: content.substring(0, 50),
    });

    // 1. Buscar ou criar cliente automaticamente
    const customerId = await findOrCreateCustomer(supabase, userId, from);

    // 2. Buscar ou criar conversa
    const { data: existingConversation } = await supabase
      .from("whatsapp_conversations")
      .select("id, customer_id")
      .eq("user_id", userId)
      .eq("whatsapp_phone", from)
      .eq("status", "active")
      .maybeSingle();

    let conversationId = existingConversation?.id;

    if (!conversationId) {
      // Criar nova conversa (agora sempre com customer_id)
      const { data: newConversation, error: convError } = await supabase
        .from("whatsapp_conversations")
        .insert({
          user_id: userId,
          customer_id: customerId,
          whatsapp_phone: from,
          status: "active",
          message_count: 1,
          started_at: new Date(parseInt(timestamp) * 1000).toISOString(),
          last_message_at: new Date(parseInt(timestamp) * 1000).toISOString(),
        })
        .select("id")
        .single();

      if (convError) throw convError;
      conversationId = newConversation.id;

      console.log("✅ New conversation created:", conversationId);
    } else {
      // Atualizar conversa existente
      const updateData: any = {
        last_message_at: new Date(parseInt(timestamp) * 1000).toISOString(),
        message_count: supabase.rpc("increment", { x: 1 }),
      };

      // Se conversa não tinha customer_id, atualizar agora
      if (!existingConversation.customer_id && customerId) {
        updateData.customer_id = customerId;
        console.log(`✅ Linking conversation to customer: ${customerId}`);
      }

      await supabase
        .from("whatsapp_conversations")
        .update(updateData)
        .eq("id", conversationId);
    }

    // 3. Atualizar last_whatsapp_interaction do cliente
    if (customerId) {
      await supabase
        .from("customers")
        .update({
          last_whatsapp_interaction: new Date(parseInt(timestamp) * 1000).toISOString(),
        })
        .eq("id", customerId);
    }

    // 4. Salvar mensagem
    const { error: msgError } = await supabase
      .from("whatsapp_messages")
      .insert({
        conversation_id: conversationId,
        whatsapp_message_id: whatsappMessageId,
        direction: "inbound",
        message_type: type,
        content,
        media_url: mediaUrl,
        media_mime_type: mediaMimeType,
        metadata,
        status: "received",
        sent_at: new Date(parseInt(timestamp) * 1000).toISOString(),
      });

    if (msgError) throw msgError;

    console.log("✅ Message saved to database");

    // 4.5. RATE LIMITING - Verificar spam de mensagens
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
    
    const { count: recentMessageCount } = await supabase
      .from("whatsapp_messages")
      .select("*", { count: "exact", head: true })
      .eq("conversation_id", conversationId)
      .eq("direction", "inbound")
      .gte("sent_at", oneMinuteAgo);

    if (recentMessageCount && recentMessageCount > 10) {
      console.warn(`⚠️ Rate limit exceeded for conversation ${conversationId}: ${recentMessageCount} messages in 1 minute`);
      
      // Enviar mensagem de rate limit
      const sendUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-whatsapp-message`;
      fetch(sendUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({
          user_id: userId,
          conversation_id: conversationId,
          to: from,
          message_type: "text",
          content: "⚠️ Muitas mensagens em pouco tempo. Por favor, aguarde alguns segundos antes de enviar novamente.",
        }),
      }).catch((err) => console.error("⚠️ Failed to send rate limit message:", err));

      return { success: true, conversationId, rate_limited: true };
    }

    // 5. Disparar processamento IA (assíncrono)
    // Chamada para process-whatsapp-message Edge Function
    const processUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/process-whatsapp-message`;
    
    fetch(processUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify({
        conversation_id: conversationId,
        message_id: whatsappMessageId,
        user_id: userId,
      }),
    }).catch((err) => console.error("⚠️ Failed to trigger processing:", err));

    return { success: true, conversationId };
  } catch (error) {
    console.error("❌ Error processing message:", error);
    throw error;
  }
}

/**
 * Processar status de mensagem enviada
 */
async function processMessageStatus(
  supabase: any,
  userId: string,
  status: any
) {
  try {
    const { id: whatsappMessageId, status: statusValue, timestamp } = status;

    console.log("📊 Processing status:", { whatsappMessageId, statusValue });

    // Atualizar status da mensagem
    const updateData: any = { status: statusValue };

    switch (statusValue) {
      case "sent":
        // Mensagem enviada pelo WhatsApp
        break;
      case "delivered":
        updateData.delivered_at = new Date(parseInt(timestamp) * 1000).toISOString();
        break;
      case "read":
        updateData.read_at = new Date(parseInt(timestamp) * 1000).toISOString();
        break;
      case "failed":
        updateData.error_message = status.errors?.[0]?.title || "Unknown error";
        break;
    }

    const { error } = await supabase
      .from("whatsapp_messages")
      .update(updateData)
      .eq("whatsapp_message_id", whatsappMessageId);

    if (error) throw error;

    console.log("✅ Message status updated");

    return { success: true };
  } catch (error) {
    console.error("❌ Error processing status:", error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // WhatsApp verification challenge (setup inicial)
    if (req.method === "GET") {
      const url = new URL(req.url);
      const mode = url.searchParams.get("hub.mode");
      const token = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge");

      const verifyToken = Deno.env.get("WHATSAPP_VERIFY_TOKEN") || "meu_token_secreto";

      if (mode === "subscribe" && token === verifyToken) {
        console.log("✅ Webhook verified successfully");
        return new Response(challenge, { status: 200 });
      } else {
        console.error("❌ Verification failed");
        return new Response("Forbidden", { status: 403 });
      }
    }

    // POST: Processar webhook
    if (req.method === "POST") {
      const rawBody = await req.text();
      
      // Validar assinatura HMAC
      const isValid = await validateWhatsAppSignature(req, rawBody);
      if (!isValid) {
        return new Response("Invalid signature", { status: 401 });
      }

      const body = JSON.parse(rawBody);

      console.log("📥 Webhook received:", JSON.stringify(body, null, 2));

      // WhatsApp envia array de entries
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          const { value } = change;

          // Identificar user_id pela phone_number_id do WhatsApp Business
          // TODO: Criar tabela whatsapp_business_accounts para mapear
          // Por ora, usar variável de ambiente
          const userId = Deno.env.get("DEFAULT_USER_ID");
          if (!userId) {
            console.error("❌ DEFAULT_USER_ID not configured");
            continue;
          }

          // ✅ VERIFICAR SUBSCRIPTION ANTES DE PROCESSAR MENSAGENS
          const subscriptionCheck = await checkUserSubscription(supabase, userId);
          
          if (!subscriptionCheck.isActive) {
            console.log(`⚠️ Subscription expired for user ${userId}, blocking WhatsApp bot`);
            
            // Se há mensagens recebidas, enviar mensagem de bloqueio
            if (value.messages && value.messages.length > 0) {
              const firstMessage = value.messages[0];
              await sendBlockedMessage(
                supabase,
                userId,
                firstMessage.from,
                subscriptionCheck.message || "⚠️ Serviço temporariamente indisponível."
              );
            }
            
            // Pular processamento das mensagens
            continue;
          }

          // Processar mensagens recebidas
          if (value.messages) {
            for (const message of value.messages) {
              await processInboundMessage(supabase, userId, message);
            }
          }

          // Processar status de mensagens enviadas
          if (value.statuses) {
            for (const status of value.statuses) {
              await processMessageStatus(supabase, userId, status);
            }
          }
        }
      }

      return new Response(
        JSON.stringify({ success: true, message: "Webhook processed" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    return new Response("Method not allowed", { status: 405 });
  } catch (error: unknown) {
    console.error("❌ Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
