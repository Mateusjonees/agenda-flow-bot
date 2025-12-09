import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Edge Function: whatsapp-ai-assistant
 * 
 * Propósito:
 * - Processar mensagens usando OpenAI GPT-4o-mini
 * - Detectar intenções (intent) do cliente
 * - Extrair entidades (produtos, quantidades, endereço)
 * - Gerar respostas naturais e contextuais
 * - Chamar functions quando necessário (buscar_produtos, adicionar_carrinho)
 * 
 * Function Calling:
 * - buscar_produtos: Buscar produtos por nome/categoria
 * - adicionar_ao_carrinho: Adicionar produto ao carrinho
 * - ver_carrinho: Mostrar itens do carrinho
 * - finalizar_pedido: Criar pedido e gerar pagamento
 * - transferir_atendente: Transferir para humano
 */

interface AIRequest {
  message: string;
  message_type: string;
  conversation_id: string;
  user_id: string;
  customer_id?: string;
  context: any;
}

/**
 * Tools disponíveis para o GPT (Function Calling)
 */
const TOOLS = [
  {
    type: "function",
    function: {
      name: "buscar_produtos",
      description:
        "Buscar produtos no catálogo por nome, categoria ou descrição",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "Texto de busca (nome do produto, categoria, palavras-chave)",
          },
          limit: {
            type: "number",
            description: "Número máximo de resultados (padrão: 5)",
            default: 5,
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "adicionar_ao_carrinho",
      description: "Adicionar produto ao carrinho do cliente",
      parameters: {
        type: "object",
        properties: {
          product_id: {
            type: "string",
            description: "ID do produto (UUID)",
          },
          variant_id: {
            type: "string",
            description:
              "ID da variante (UUID) - opcional, se produto tiver variantes",
          },
          quantity: {
            type: "number",
            description: "Quantidade desejada",
            minimum: 1,
          },
        },
        required: ["product_id", "quantity"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "ver_carrinho",
      description: "Visualizar itens atuais do carrinho do cliente",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "finalizar_pedido",
      description:
        "Finalizar compra e criar pedido com pagamento PIX",
      parameters: {
        type: "object",
        properties: {
          shipping_address: {
            type: "object",
            description: "Endereço de entrega",
            properties: {
              street: { type: "string" },
              number: { type: "string" },
              neighborhood: { type: "string" },
              city: { type: "string" },
              state: { type: "string" },
              postal_code: { type: "string" },
            },
            required: ["street", "number", "neighborhood", "city", "state"],
          },
        },
        required: ["shipping_address"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "transferir_atendente",
      description:
        "Transferir conversa para atendimento humano quando cliente solicitar ou IA não conseguir resolver",
      parameters: {
        type: "object",
        properties: {
          motivo: {
            type: "string",
            description: "Motivo da transferência",
          },
        },
        required: ["motivo"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "agendar_visita",
      description:
        "Agendar visita/atendimento/serviço para o cliente em data e horário específicos",
      parameters: {
        type: "object",
        properties: {
          service_name: {
            type: "string",
            description: "Nome do serviço solicitado (ex: 'corte de cabelo', 'consulta', 'manutenção')",
          },
          date: {
            type: "string",
            description: "Data desejada no formato YYYY-MM-DD (ex: '2025-11-30')",
          },
          time: {
            type: "string",
            description: "Horário desejado no formato HH:MM (ex: '14:00', '09:30')",
          },
          customer_notes: {
            type: "string",
            description: "Observações ou preferências do cliente (opcional)",
          },
        },
        required: ["service_name", "date", "time"],
      },
    },
  },
];

/**
 * Executar function chamada pelo GPT
 */
async function executeFunction(
  supabase: any,
  userId: string,
  customerId: string | undefined,
  conversationId: string,
  functionName: string,
  functionArgs: any
): Promise<any> {
  console.log(`🔧 Executing function: ${functionName}`, functionArgs);

  switch (functionName) {
    case "buscar_produtos": {
      const { query, limit = 5 } = functionArgs;

      // Buscar produtos usando full-text search em tags ou nome
      const { data: products } = await supabase
        .from("products")
        .select("id, name, description, short_description, price, stock_quantity, is_active")
        .eq("user_id", userId)
        .eq("is_active", true)
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(limit);

      return {
        products: products || [],
        count: products?.length || 0,
      };
    }

    case "adicionar_ao_carrinho": {
      const { product_id, variant_id, quantity } = functionArgs;

      // Buscar produto para pegar preço atual
      const { data: product } = await supabase
        .from("products")
        .select("price, name")
        .eq("id", product_id)
        .single();

      if (!product) {
        return { success: false, error: "Produto não encontrado" };
      }

      // Buscar ou criar carrinho ativo
      let { data: cart } = await supabase
        .from("shopping_carts")
        .select("id")
        .eq("user_id", userId)
        .eq("customer_id", customerId)
        .eq("status", "active")
        .maybeSingle();

      if (!cart) {
        const { data: newCart } = await supabase
          .from("shopping_carts")
          .insert({
            user_id: userId,
            customer_id: customerId,
            conversation_id: conversationId,
            status: "active",
          })
          .select("id")
          .single();

        cart = newCart;
      }

      // Verificar se produto já está no carrinho
      const { data: existing } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("cart_id", cart.id)
        .eq("product_id", product_id)
        .eq("variant_id", variant_id || null)
        .maybeSingle();

      if (existing) {
        // Atualizar quantidade
        const newQty = existing.quantity + quantity;
        await supabase
          .from("cart_items")
          .update({
            quantity: newQty,
            subtotal: newQty * product.price,
          })
          .eq("id", existing.id);
      } else {
        // Adicionar novo item
        await supabase.from("cart_items").insert({
          cart_id: cart.id,
          product_id,
          variant_id,
          quantity,
          unit_price: product.price,
          subtotal: quantity * product.price,
          product_snapshot: { name: product.name },
        });
      }

      // Recalcular total do carrinho
      const { data: items } = await supabase
        .from("cart_items")
        .select("subtotal")
        .eq("cart_id", cart.id);

      const subtotal = items?.reduce((sum: number, item: { subtotal: string | number }) => sum + parseFloat(String(item.subtotal)), 0) || 0;

      await supabase
        .from("shopping_carts")
        .update({ subtotal, total: subtotal })
        .eq("id", cart.id);

      return {
        success: true,
        cart_id: cart.id,
        product_name: product.name,
        quantity,
      };
    }

    case "ver_carrinho": {
      const { data: cart } = await supabase
        .from("shopping_carts")
        .select(
          `
          id,
          subtotal,
          discount,
          shipping_cost,
          total,
          cart_items (
            quantity,
            unit_price,
            subtotal,
            product:products (name, short_description),
            variant:product_variants (name)
          )
        `
        )
        .eq("user_id", userId)
        .eq("customer_id", customerId)
        .eq("status", "active")
        .maybeSingle();

      if (!cart) {
        return { empty: true, items: [] };
      }

      return {
        empty: false,
        items: cart.cart_items || [],
        subtotal: cart.subtotal,
        total: cart.total,
      };
    }

    case "finalizar_pedido": {
      // Esta função retorna intent, a criação real do pedido é feita por create-order-from-cart
      
      // 🎯 Gerar resumo IA após venda concluída
      try {
        const summaryUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/generate-conversation-summary`;
        fetch(summaryUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({
            conversation_id: conversationId,
            trigger_event: "sale",
          }),
        }).catch((err) => console.error("⚠️ Failed to generate summary:", err));
      } catch (err) {
        console.error("⚠️ Summary generation error:", err);
      }
      
      return {
        success: true,
        shipping_address: functionArgs.shipping_address,
      };
    }

    case "agendar_visita": {
      const { service_name, date, time, customer_notes } = functionArgs;

      try {
        // 1. Buscar configurações de agendamento do usuário
        const { data: settings } = await supabase
          .from("business_settings")
          .select("ai_training")
          .eq("user_id", userId)
          .single();

        const aiTraining = settings?.ai_training || {};
        const allowOverlap = aiTraining.allow_appointment_overlap || false;
        const defaultDuration = aiTraining.default_appointment_duration || 60;

        // 2. Validar formato de data e hora
        const appointmentDate = new Date(`${date}T${time}:00`);
        if (isNaN(appointmentDate.getTime())) {
          return {
            success: false,
            error: "Data ou horário inválido. Use formato YYYY-MM-DD e HH:MM",
          };
        }

        // 3. Verificar se a data não é passada
        const now = new Date();
        if (appointmentDate < now) {
          return {
            success: false,
            error: "Não é possível agendar para data/horário passado",
          };
        }

        // 4. Validar horário de funcionamento
        const dayOfWeek = appointmentDate.getDay(); // 0=domingo, 6=sábado
        const requestedTime = time; // formato HH:MM

        const { data: businessHours } = await supabase
          .from("business_hours")
          .select("*")
          .eq("user_id", userId)
          .eq("day_of_week", dayOfWeek)
          .eq("is_active", true)
          .single();

        if (!businessHours) {
          return {
            success: false,
            error: `Não atendemos neste dia da semana. Por favor, escolha outro dia.`,
          };
        }

        // Comparar horários (formato TIME do PostgreSQL: HH:MM:SS)
        const businessStartTime = businessHours.start_time.substring(0, 5); // "09:00:00" -> "09:00"
        const businessEndTime = businessHours.end_time.substring(0, 5);

        if (requestedTime < businessStartTime || requestedTime >= businessEndTime) {
          return {
            success: false,
            error: `Nosso horário de funcionamento é ${businessStartTime} às ${businessEndTime}. Por favor, escolha um horário dentro deste intervalo.`,
          };
        }

        // 5. Buscar ou criar serviço genérico
        let serviceId = null;
        const { data: existingService } = await supabase
          .from("services")
          .select("id, duration")
          .eq("user_id", userId)
          .ilike("name", `%${service_name}%`)
          .eq("is_active", true)
          .maybeSingle();

        if (existingService) {
          serviceId = existingService.id;
        } else {
          // Criar serviço genérico se não existir
          const { data: newService } = await supabase
            .from("services")
            .insert({
              user_id: userId,
              name: service_name,
              description: `Serviço criado automaticamente via WhatsApp`,
              duration: defaultDuration,
              is_active: true,
            })
            .select("id")
            .single();

          serviceId = newService?.id;
        }

        // 6. Verificar conflitos de agendamento (se overlap não permitido)
        if (!allowOverlap) {
          const appointmentStartTime = appointmentDate.toISOString();
          const appointmentEndTime = new Date(
            appointmentDate.getTime() + defaultDuration * 60000
          ).toISOString();

          const { data: conflicts } = await supabase
            .from("appointments")
            .select("id, title, start_time, end_time")
            .eq("user_id", userId)
            .neq("status", "cancelled")
            .or(
              `and(start_time.lte.${appointmentEndTime},end_time.gt.${appointmentStartTime})`
            );

          if (conflicts && conflicts.length > 0) {
            return {
              success: false,
              error: `Este horário já está ocupado. Por favor, escolha outro horário ou entre em contato para mais opções.`,
            };
          }
        }

        // 7. Criar o agendamento
        const appointmentStartTime = appointmentDate.toISOString();
        const appointmentEndTime = new Date(
          appointmentDate.getTime() + defaultDuration * 60000
        ).toISOString();

        const { data: appointment, error: appointmentError } = await supabase
          .from("appointments")
          .insert({
            user_id: userId,
            customer_id: customerId,
            service_id: serviceId,
            title: service_name,
            description: customer_notes || `Agendamento via WhatsApp`,
            start_time: appointmentStartTime,
            end_time: appointmentEndTime,
            status: "scheduled",
            notes: customer_notes,
          })
          .select()
          .single();

        if (appointmentError) {
          console.error("Error creating appointment:", appointmentError);
          return {
            success: false,
            error: "Erro ao criar agendamento. Tente novamente.",
          };
        }

        // 8. Gerar resumo IA após agendamento
        try {
          const summaryUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/generate-conversation-summary`;
          fetch(summaryUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify({
              conversation_id: conversationId,
              trigger_event: "appointment",
            }),
          }).catch((err) => console.error("⚠️ Failed to generate summary:", err));
        } catch (err) {
          console.error("⚠️ Summary generation error:", err);
        }

        return {
          success: true,
          appointment_id: appointment.id,
          date: date,
          time: time,
          service: service_name,
          duration: defaultDuration,
        };
      } catch (error: any) {
        console.error("Error in agendar_visita:", error);
        return {
          success: false,
          error: error.message || "Erro ao processar agendamento",
        };
      }
    }

    case "transferir_atendente": {
      await supabase
        .from("whatsapp_conversations")
        .update({
          assigned_to_human: true,
          status: "waiting_human",
        })
        .eq("id", conversationId);

      // 🎯 Gerar resumo IA para transferência humano
      try {
        const summaryUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/generate-conversation-summary`;
        fetch(summaryUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({
            conversation_id: conversationId,
            trigger_event: "transfer",
          }),
        }).catch((err) => console.error("⚠️ Failed to generate summary:", err));
      } catch (err) {
        console.error("⚠️ Summary generation error:", err);
      }

      return {
        success: true,
        motivo: functionArgs.motivo,
      };
    }

    default:
      return { error: `Unknown function: ${functionName}` };
  }
}

/**
 * Construir prompt do sistema dinamicamente baseado em ai_training
 */
function buildSystemPrompt(aiTraining: any): string {
  const assistantName = aiTraining?.assistant_name || "Assistente Virtual";
  const personality = aiTraining?.personality || "cordial, eficiente e prestativo";
  const tone = aiTraining?.tone || "profissional";
  const greeting = aiTraining?.greeting || "Olá! Como posso ajudar?";
  const farewell = aiTraining?.farewell || "Obrigado pelo contato!";
  const guidelines = aiTraining?.guidelines || "- Seja breve e objetivo\n- Use emojis com moderação\n- Confirme ações importantes";

  return `Você é ${assistantName}, um assistente virtual de vendas via WhatsApp.

PERSONALIDADE: ${personality}
TOM DE VOZ: ${tone}

SEU PAPEL:
- Ajudar clientes a encontrar produtos
- Adicionar produtos ao carrinho
- Finalizar pedidos com pagamento PIX
- Agendar visitas, atendimentos e serviços
- Ser ${personality}

SAUDAÇÃO PADRÃO:
"${greeting}"

DESPEDIDA PADRÃO:
"${farewell}"

DIRETRIZES ESPECÍFICAS:
${guidelines}

DIRETRIZES GERAIS:
- Seja breve e objetivo (WhatsApp é mobile)
- Use emojis com moderação
- Pergunte APENAS informações essenciais
- Confirme ações importantes (adicionar ao carrinho, finalizar pedido, agendar visita)
- Para agendamentos, sempre pergunte: serviço, data e horário desejado
- Se não souber algo, ofereça transferir para atendente humano

FORMATO DE RESPOSTA:
- Mensagens curtas (máximo 2-3 linhas)
- Use quebras de linha para clareza
- Liste produtos de forma organizada
- Para agendamentos, confirme data e horário claramente`;
}

/**
 * Construir mensagens do histórico da conversa
 */
async function buildConversationHistory(
  supabase: any, 
  userId: string, 
  context: any
): Promise<Array<any>> {
  const history = context.recent_messages || [];
  
  // Buscar configurações de treinamento da IA
  const { data: settings } = await supabase
    .from("business_settings")
    .select("ai_training")
    .eq("user_id", userId)
    .single();

  const systemPrompt = buildSystemPrompt(settings?.ai_training);
  
  const messages = [
    {
      role: "system",
      content: systemPrompt,
    },
  ];

  // Adicionar histórico recente (últimas 5 mensagens)
  for (const msg of history.slice(-5)) {
    messages.push({
      role: msg.direction === "inbound" ? "user" : "assistant",
      content: msg.content,
    });
  }

  return messages;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const request: AIRequest = await req.json();

    console.log("🧠 AI processing:", {
      message: request.message.substring(0, 50),
      conversation_id: request.conversation_id,
    });

    // Construir histórico com prompt dinâmico
    const messages = await buildConversationHistory(supabase, request.user_id, request.context);
    messages.push({
      role: "user",
      content: request.message,
    });

    // Chamar OpenAI GPT-4o-mini
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    let response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        tools: TOOLS,
        tool_choice: "auto",
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    let result = await response.json();
    console.log("🤖 OpenAI response:", JSON.stringify(result, null, 2));

    let assistantMessage = result.choices?.[0]?.message;
    let functionResults: any[] = [];

    // Executar functions se chamadas
    while (assistantMessage?.tool_calls) {
      for (const toolCall of assistantMessage.tool_calls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);

        const functionResult = await executeFunction(
          supabase,
          request.user_id,
          request.customer_id,
          request.conversation_id,
          functionName,
          functionArgs
        );

        functionResults.push({
          name: functionName,
          result: functionResult,
        });

        messages.push(assistantMessage);
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(functionResult),
        });
      }

      // Chamar novamente para obter resposta final
      response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages,
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      result = await response.json();
      assistantMessage = result.choices?.[0]?.message;
    }

    // Detectar intent principal
    let intent = "general";
    if (functionResults.length > 0) {
      intent = functionResults[0].name.replace("_", "_");
    }

    // Atualizar contexto
    const updatedContext = {
      ...request.context,
      recent_messages: [
        ...(request.context.recent_messages || []).slice(-4),
        { direction: "inbound", content: request.message },
        { direction: "outbound", content: assistantMessage?.content },
      ],
      last_function_calls: functionResults,
    };

    return new Response(
      JSON.stringify({
        intent,
        response_message: assistantMessage?.content || "Desculpe, não entendi.",
        response_type: "text",
        entities: functionResults.length > 0 ? functionResults[0].result : null,
        updated_context: updatedContext,
        function_results: functionResults,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    console.error("❌ AI error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
