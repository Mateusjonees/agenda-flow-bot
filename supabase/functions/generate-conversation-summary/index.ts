import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Edge Function: generate-conversation-summary
 * 
 * Propósito:
 * - Gerar resumo estruturado de conversa WhatsApp usando GPT-4o-mini
 * - Salvar resumo em whatsapp_conversations.context->ai_summary
 * - Chamado após eventos importantes: venda, agendamento, transferência humano
 * 
 * Input:
 * - conversation_id: UUID da conversa
 * - trigger_event: "sale" | "appointment" | "transfer" | "inactive"
 * 
 * Output:
 * - Resumo estruturado salvo no campo context (JSONB)
 */

interface SummaryRequest {
  conversation_id: string;
  trigger_event: "sale" | "appointment" | "transfer" | "inactive";
}

interface Message {
  id: string;
  direction: "inbound" | "outbound";
  content: string;
  message_type: string;
  sent_at: string;
}

/**
 * Gerar resumo usando GPT-4o-mini
 */
async function generateSummaryWithAI(
  messages: Message[],
  triggerEvent: string
): Promise<any> {
  const openaiKey = Deno.env.get("OPENAI_API_KEY");
  if (!openaiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  // Formatar histórico de mensagens
  const conversationText = messages
    .map((msg) => {
      const sender = msg.direction === "inbound" ? "Cliente" : "Assistente";
      return `${sender}: ${msg.content}`;
    })
    .join("\n");

  // Prompt otimizado para gerar resumo estruturado
  const systemPrompt = `Você é um assistente que analisa conversas de vendas/atendimento via WhatsApp e gera resumos estruturados.

Analise a conversa e retorne um JSON com esta estrutura EXATA:
{
  "conversation_outcome": "venda_realizada" | "agendamento_criado" | "duvida_respondida" | "transferido_humano" | "sem_conclusao",
  "summary": "Resumo em 1-2 frases do que aconteceu na conversa",
  "key_actions": ["Ação 1", "Ação 2", ...],
  "customer_needs": ["Necessidade 1", "Necessidade 2", ...],
  "pending_actions": "O que está pendente ou aguardando",
  "next_steps": "Próxima ação recomendada"
}

REGRAS:
- summary: Máximo 200 caracteres, objetivo e claro
- key_actions: Listar apenas ações CONCRETAS (enviou catálogo, adicionou produto X, gerou PIX)
- customer_needs: Extrair necessidades/interesses mencionados
- pending_actions: Se há algo aguardando (pagamento, resposta, entrega)
- next_steps: Recomendação de follow-up

Responda APENAS com o JSON, sem texto adicional.`;

  const userPrompt = `Evento que encerrou a conversa: ${triggerEvent}

Conversa completa:
${conversationText}`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3, // Baixa temperatura para resumos consistentes
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in OpenAI response");
    }

    // Parse JSON retornado pela IA
    const summary = JSON.parse(content.trim());

    // Validar estrutura completa
    if (!summary.conversation_outcome || 
        !summary.summary || 
        !Array.isArray(summary.key_actions) || 
        !Array.isArray(summary.customer_needs) ||
        !summary.pending_actions ||
        !summary.next_steps) {
      throw new Error("Invalid summary structure from AI - missing required fields");
    }

    return summary;
  } catch (error) {
    console.error("❌ Error generating AI summary:", error);
    
    // Fallback: resumo básico
    return {
      conversation_outcome: "sem_conclusao",
      summary: "Conversa registrada no sistema. Revisar manualmente.",
      key_actions: ["Conversa arquivada"],
      customer_needs: [],
      pending_actions: "Análise manual necessária",
      next_steps: "Revisar conversa completa",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { conversation_id, trigger_event }: SummaryRequest = await req.json();

    if (!conversation_id) {
      return new Response(
        JSON.stringify({ error: "conversation_id is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`📝 Generating summary for conversation: ${conversation_id}`);
    console.log(`🔔 Trigger event: ${trigger_event}`);

    // 1. Buscar conversa
    const { data: conversation, error: convError } = await supabase
      .from("whatsapp_conversations")
      .select("id, user_id, customer_id, whatsapp_name, context")
      .eq("id", conversation_id)
      .single();

    if (convError || !conversation) {
      throw new Error(`Conversation not found: ${convError?.message}`);
    }

    // 2. Buscar mensagens da conversa (últimas 50 mensagens)
    const { data: messages, error: msgError } = await supabase
      .from("whatsapp_messages")
      .select("id, direction, content, message_type, sent_at")
      .eq("conversation_id", conversation_id)
      .order("sent_at", { ascending: true })
      .limit(50);

    if (msgError) {
      throw new Error(`Failed to fetch messages: ${msgError.message}`);
    }

    if (!messages || messages.length === 0) {
      console.log("⚠️ No messages found, skipping summary generation");
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "No messages to summarize" 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`📊 Found ${messages.length} messages to analyze`);

    // 3. Gerar resumo com IA
    const aiSummary = await generateSummaryWithAI(messages, trigger_event);

    // 4. Atualizar context da conversa com resumo
    const updatedContext = {
      ...(conversation.context || {}),
      ai_summary: {
        ...aiSummary,
        generated_at: new Date().toISOString(),
        trigger_event,
        message_count: messages.length,
      },
    };

    const { error: updateError } = await supabase
      .from("whatsapp_conversations")
      .update({
        context: updatedContext,
      })
      .eq("id", conversation_id);

    if (updateError) {
      throw new Error(`Failed to save summary: ${updateError.message}`);
    }

    console.log("✅ Summary generated and saved successfully");

    return new Response(
      JSON.stringify({
        success: true,
        conversation_id,
        summary: aiSummary,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("❌ Error in generate-conversation-summary:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
