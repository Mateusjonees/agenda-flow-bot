import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Edge Function: send-whatsapp-message
 * 
 * Propósito:
 * - Enviar mensagens via WhatsApp Cloud API
 * - Suportar múltiplos tipos: texto, imagem, botões, listas
 * - Rastrear status de entrega
 * - Salvar mensagem no banco de dados
 * 
 * Tipos suportados:
 * - text: Mensagem de texto simples
 * - image: Imagem com caption opcional
 * - interactive (button): Até 3 botões
 * - interactive (list): Até 10 opções
 * - template: Template aprovado pela Meta
 */

interface SendMessageRequest {
  user_id: string;
  conversation_id: string;
  to: string; // Telefone do destinatário (formato: 5511999999999)
  message_type: "text" | "image" | "interactive_button" | "interactive_list" | "template";
  content: string;
  media_url?: string; // URL da imagem (se message_type = image)
  buttons?: Array<{ id: string; title: string }>; // Máximo 3 botões
  list?: {
    button_text: string; // Texto do botão da lista
    sections: Array<{
      title: string;
      rows: Array<{ id: string; title: string; description?: string }>;
    }>;
  };
  template_name?: string; // Nome do template (se message_type = template)
  template_variables?: string[]; // Variáveis do template
}

/**
 * Enviar mensagem via WhatsApp Cloud API
 */
async function sendToWhatsApp(
  phoneNumberId: string,
  accessToken: string,
  payload: any
): Promise<{ success: boolean; message_id?: string; error?: string }> {
  try {
    const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;

    console.log("📤 Sending to WhatsApp:", JSON.stringify(payload, null, 2));

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("❌ WhatsApp API error:", result);
      return {
        success: false,
        error: result.error?.message || "Unknown error",
      };
    }

    console.log("✅ Message sent:", result);

    return {
      success: true,
      message_id: result.messages?.[0]?.id,
    };
  } catch (error) {
    console.error("❌ Send error:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Construir payload do WhatsApp baseado no tipo de mensagem
 */
function buildWhatsAppPayload(
  to: string,
  messageType: string,
  request: SendMessageRequest
): any {
  const basePayload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
  };

  switch (messageType) {
    case "text":
      return {
        ...basePayload,
        type: "text",
        text: {
          preview_url: true, // Habilitar preview de links
          body: request.content,
        },
      };

    case "image":
      return {
        ...basePayload,
        type: "image",
        image: {
          link: request.media_url, // URL pública da imagem
          caption: request.content || undefined,
        },
      };

    case "interactive_button":
      // Máximo 3 botões
      const buttons = (request.buttons || []).slice(0, 3).map((btn, idx) => ({
        type: "reply",
        reply: {
          id: btn.id || `btn_${idx}`,
          title: btn.title.substring(0, 20), // Máximo 20 caracteres
        },
      }));

      return {
        ...basePayload,
        type: "interactive",
        interactive: {
          type: "button",
          body: {
            text: request.content.substring(0, 1024), // Máximo 1024 caracteres
          },
          action: {
            buttons,
          },
        },
      };

    case "interactive_list":
      // Máximo 10 opções por seção
      const sections = (request.list?.sections || []).map((section) => ({
        title: section.title.substring(0, 24), // Máximo 24 caracteres
        rows: section.rows.slice(0, 10).map((row) => ({
          id: row.id,
          title: row.title.substring(0, 24),
          description: row.description?.substring(0, 72), // Máximo 72 caracteres
        })),
      }));

      return {
        ...basePayload,
        type: "interactive",
        interactive: {
          type: "list",
          body: {
            text: request.content.substring(0, 1024),
          },
          action: {
            button: request.list?.button_text || "Ver opções",
            sections,
          },
        },
      };

    case "template":
      // Template aprovado pela Meta
      return {
        ...basePayload,
        type: "template",
        template: {
          name: request.template_name,
          language: {
            code: "pt_BR",
          },
          components: request.template_variables
            ? [
                {
                  type: "body",
                  parameters: request.template_variables.map((v) => ({
                    type: "text",
                    text: v,
                  })),
                },
              ]
            : undefined,
        },
      };

    default:
      throw new Error(`Unsupported message type: ${messageType}`);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const request: SendMessageRequest = await req.json();

    console.log("📨 Send message request:", {
      to: request.to,
      type: request.message_type,
    });

    // Credenciais WhatsApp Cloud API
    const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
    const accessToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN");

    if (!phoneNumberId || !accessToken) {
      throw new Error(
        "WhatsApp credentials not configured (WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN)"
      );
    }

    // Construir payload
    const payload = buildWhatsAppPayload(
      request.to,
      request.message_type,
      request
    );

    // Enviar via WhatsApp Cloud API
    const sendResult = await sendToWhatsApp(phoneNumberId, accessToken, payload);

    if (!sendResult.success) {
      throw new Error(`Failed to send message: ${sendResult.error}`);
    }

    // Salvar mensagem no banco
    const { error: dbError } = await supabase
      .from("whatsapp_messages")
      .insert({
        conversation_id: request.conversation_id,
        whatsapp_message_id: sendResult.message_id,
        direction: "outbound",
        message_type: request.message_type,
        content: request.content,
        media_url: request.media_url,
        metadata: {
          buttons: request.buttons,
          list: request.list,
          template_name: request.template_name,
        },
        status: "sent",
        sent_at: new Date().toISOString(),
      });

    if (dbError) {
      console.error("⚠️ Failed to save message to DB:", dbError);
    }

    // Atualizar última mensagem da conversa
    await supabase
      .from("whatsapp_conversations")
      .update({
        last_message_at: new Date().toISOString(),
      })
      .eq("id", request.conversation_id);

    return new Response(
      JSON.stringify({
        success: true,
        message_id: sendResult.message_id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("❌ Send error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
