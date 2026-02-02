import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Tools definitions for the AI agent
const tools = [
  {
    type: "function",
    function: {
      name: "listar_agendamentos",
      description: "Lista agendamentos do dia ou da semana. Use para verificar compromissos existentes.",
      parameters: {
        type: "object",
        properties: {
          periodo: {
            type: "string",
            enum: ["hoje", "amanha", "semana"],
            description: "Período dos agendamentos"
          }
        },
        required: ["periodo"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "criar_agendamento",
      description: "Cria um novo agendamento/compromisso. Requer cliente, data/hora e serviço.",
      parameters: {
        type: "object",
        properties: {
          titulo: { type: "string", description: "Título do agendamento" },
          customer_id: { type: "string", description: "ID do cliente" },
          service_id: { type: "string", description: "ID do serviço (opcional)" },
          start_time: { type: "string", description: "Data e hora de início (ISO 8601)" },
          end_time: { type: "string", description: "Data e hora de fim (ISO 8601)" },
          descricao: { type: "string", description: "Descrição adicional (opcional)" }
        },
        required: ["titulo", "start_time", "end_time"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "buscar_clientes",
      description: "Busca clientes por nome ou telefone.",
      parameters: {
        type: "object",
        properties: {
          termo: { type: "string", description: "Nome ou telefone para buscar" }
        },
        required: ["termo"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "cadastrar_cliente",
      description: "Cadastra um novo cliente no sistema.",
      parameters: {
        type: "object",
        properties: {
          nome: { type: "string", description: "Nome do cliente" },
          telefone: { type: "string", description: "Telefone do cliente" },
          email: { type: "string", description: "Email do cliente (opcional)" }
        },
        required: ["nome"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "consultar_financeiro",
      description: "Consulta o saldo financeiro e últimas transações.",
      parameters: {
        type: "object",
        properties: {
          periodo: {
            type: "string",
            enum: ["hoje", "semana", "mes"],
            description: "Período para consultar"
          }
        },
        required: ["periodo"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "registrar_transacao",
      description: "Registra uma nova transação financeira (receita ou despesa).",
      parameters: {
        type: "object",
        properties: {
          tipo: { type: "string", enum: ["income", "expense"], description: "Tipo: income (receita) ou expense (despesa)" },
          valor: { type: "number", description: "Valor da transação" },
          descricao: { type: "string", description: "Descrição da transação" }
        },
        required: ["tipo", "valor", "descricao"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "verificar_estoque",
      description: "Verifica itens do estoque/inventário.",
      parameters: {
        type: "object",
        properties: {
          termo: { type: "string", description: "Nome do item para buscar (opcional, se vazio lista todos)" }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "ajustar_estoque",
      description: "Ajusta a quantidade de um item no estoque.",
      parameters: {
        type: "object",
        properties: {
          item_id: { type: "string", description: "ID do item" },
          quantidade: { type: "number", description: "Quantidade a adicionar (positivo) ou remover (negativo)" },
          motivo: { type: "string", description: "Motivo do ajuste" }
        },
        required: ["item_id", "quantidade"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "criar_tarefa",
      description: "Cria uma nova tarefa no sistema.",
      parameters: {
        type: "object",
        properties: {
          titulo: { type: "string", description: "Título da tarefa" },
          descricao: { type: "string", description: "Descrição da tarefa (opcional)" },
          prioridade: { type: "string", enum: ["low", "medium", "high"], description: "Prioridade" },
          data_vencimento: { type: "string", description: "Data de vencimento (ISO 8601, opcional)" }
        },
        required: ["titulo"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "gerar_resumo_diario",
      description: "Gera um resumo das estatísticas do dia (agendamentos, receitas, tarefas).",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  }
];

// Get owner user ID (handles team members)
async function getOwnerUserId(supabase: any, userId: string): Promise<string> {
  const { data } = await supabase.rpc("get_owner_user_id", { _user_id: userId });
  return data || userId;
}

// Execute tool functions
async function executeTool(supabase: any, ownerId: string, toolName: string, args: any): Promise<string> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);
  
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  try {
    switch (toolName) {
      case "listar_agendamentos": {
        let startDate = today;
        let endDate = tomorrow;
        
        if (args.periodo === "amanha") {
          startDate = tomorrow;
          endDate = new Date(tomorrow);
          endDate.setDate(endDate.getDate() + 1);
        } else if (args.periodo === "semana") {
          endDate = weekEnd;
        }
        
        const { data, error } = await supabase
          .from("appointments")
          .select("*, customers(name, phone), services(name)")
          .eq("user_id", ownerId)
          .gte("start_time", startDate.toISOString())
          .lt("start_time", endDate.toISOString())
          .order("start_time");
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
          return `Nenhum agendamento encontrado para ${args.periodo}.`;
        }
        
        const lista = data.map((a: any) => {
          const hora = new Date(a.start_time).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
          const data = new Date(a.start_time).toLocaleDateString("pt-BR");
          const cliente = a.customers?.name || "Cliente não especificado";
          const servico = a.services?.name || a.title;
          return `- ${data} às ${hora}: ${servico} com ${cliente} (${a.status || "agendado"})`;
        }).join("\n");
        
        return `📅 Agendamentos para ${args.periodo}:\n${lista}`;
      }
      
      case "criar_agendamento": {
        const { data, error } = await supabase
          .from("appointments")
          .insert({
            user_id: ownerId,
            title: args.titulo,
            customer_id: args.customer_id || null,
            service_id: args.service_id || null,
            start_time: args.start_time,
            end_time: args.end_time,
            description: args.descricao || null,
            status: "scheduled"
          })
          .select()
          .single();
        
        if (error) throw error;
        
        const dataFormatada = new Date(args.start_time).toLocaleString("pt-BR");
        return `✅ Agendamento criado com sucesso!\n📌 ${args.titulo}\n📆 ${dataFormatada}`;
      }
      
      case "buscar_clientes": {
        const { data, error } = await supabase
          .from("customers")
          .select("id, name, phone, email")
          .eq("user_id", ownerId)
          .or(`name.ilike.%${args.termo}%,phone.ilike.%${args.termo}%`)
          .limit(10);
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
          return `Nenhum cliente encontrado com "${args.termo}".`;
        }
        
        const lista = data.map((c: any) => 
          `- ${c.name} | Tel: ${c.phone || "N/A"} | Email: ${c.email || "N/A"} (ID: ${c.id})`
        ).join("\n");
        
        return `👥 Clientes encontrados:\n${lista}`;
      }
      
      case "cadastrar_cliente": {
        const { data, error } = await supabase
          .from("customers")
          .insert({
            user_id: ownerId,
            name: args.nome,
            phone: args.telefone || null,
            email: args.email || null
          })
          .select()
          .single();
        
        if (error) throw error;
        
        return `✅ Cliente cadastrado com sucesso!\n👤 ${args.nome}\n📞 ${args.telefone || "Não informado"}\n📧 ${args.email || "Não informado"}\nID: ${data.id}`;
      }
      
      case "consultar_financeiro": {
        let startDate = today;
        let endDate = tomorrow;
        
        if (args.periodo === "semana") {
          startDate = new Date(today);
          startDate.setDate(startDate.getDate() - 7);
        } else if (args.periodo === "mes") {
          startDate = monthStart;
          endDate = monthEnd;
        }
        
        const { data, error } = await supabase
          .from("financial_transactions")
          .select("*")
          .eq("user_id", ownerId)
          .gte("transaction_date", startDate.toISOString().split("T")[0])
          .lte("transaction_date", endDate.toISOString().split("T")[0]);
        
        if (error) throw error;
        
        let receitas = 0;
        let despesas = 0;
        
        (data || []).forEach((t: any) => {
          if (t.type === "income") receitas += Number(t.amount);
          else despesas += Number(t.amount);
        });
        
        const saldo = receitas - despesas;
        
        return `💰 Resumo financeiro (${args.periodo}):\n\n📈 Receitas: R$ ${receitas.toFixed(2)}\n📉 Despesas: R$ ${despesas.toFixed(2)}\n💵 Saldo: R$ ${saldo.toFixed(2)}\n\nTotal de ${data?.length || 0} transações.`;
      }
      
      case "registrar_transacao": {
        const { data, error } = await supabase
          .from("financial_transactions")
          .insert({
            user_id: ownerId,
            type: args.tipo,
            amount: args.valor,
            description: args.descricao,
            transaction_date: new Date().toISOString().split("T")[0],
            status: "confirmed"
          })
          .select()
          .single();
        
        if (error) throw error;
        
        const tipoTexto = args.tipo === "income" ? "📈 Receita" : "📉 Despesa";
        return `✅ Transação registrada!\n${tipoTexto}: R$ ${args.valor.toFixed(2)}\n📝 ${args.descricao}`;
      }
      
      case "verificar_estoque": {
        let query = supabase
          .from("inventory_items")
          .select("id, name, current_stock, min_quantity, unit")
          .eq("user_id", ownerId);
        
        if (args.termo) {
          query = query.ilike("name", `%${args.termo}%`);
        }
        
        const { data, error } = await query.limit(20);
        
        if (error) throw error;
        
        if (!data || data.length === 0) {
          return args.termo 
            ? `Nenhum item encontrado com "${args.termo}".`
            : "Estoque vazio.";
        }
        
        const lista = data.map((i: any) => {
          const status = i.current_stock <= (i.min_quantity || 0) ? "⚠️" : "✅";
          return `${status} ${i.name}: ${i.current_stock || 0} ${i.unit || "un"} (ID: ${i.id})`;
        }).join("\n");
        
        return `📦 Estoque:\n${lista}`;
      }
      
      case "ajustar_estoque": {
        // Get current stock
        const { data: item, error: fetchError } = await supabase
          .from("inventory_items")
          .select("current_stock, name")
          .eq("id", args.item_id)
          .eq("user_id", ownerId)
          .single();
        
        if (fetchError || !item) {
          return "❌ Item não encontrado.";
        }
        
        const novoEstoque = (item.current_stock || 0) + args.quantidade;
        
        const { error } = await supabase
          .from("inventory_items")
          .update({ current_stock: novoEstoque, updated_at: new Date().toISOString() })
          .eq("id", args.item_id);
        
        if (error) throw error;
        
        const acao = args.quantidade > 0 ? "adicionado" : "removido";
        return `✅ Estoque atualizado!\n📦 ${item.name}: ${acao} ${Math.abs(args.quantidade)}\n📊 Novo estoque: ${novoEstoque}${args.motivo ? `\n📝 Motivo: ${args.motivo}` : ""}`;
      }
      
      case "criar_tarefa": {
        const { data, error } = await supabase
          .from("tasks")
          .insert({
            user_id: ownerId,
            title: args.titulo,
            description: args.descricao || null,
            priority: args.prioridade || "medium",
            due_date: args.data_vencimento || null,
            status: "todo"
          })
          .select()
          .single();
        
        if (error) throw error;
        
        return `✅ Tarefa criada!\n📌 ${args.titulo}\n⚡ Prioridade: ${args.prioridade || "média"}${args.data_vencimento ? `\n📆 Vencimento: ${new Date(args.data_vencimento).toLocaleDateString("pt-BR")}` : ""}`;
      }
      
      case "gerar_resumo_diario": {
        // Appointments today
        const { data: appointments } = await supabase
          .from("appointments")
          .select("id, status")
          .eq("user_id", ownerId)
          .gte("start_time", today.toISOString())
          .lt("start_time", tomorrow.toISOString());
        
        const totalAgendamentos = appointments?.length || 0;
        const concluidos = appointments?.filter((a: any) => a.status === "completed").length || 0;
        
        // Financial today
        const { data: transactions } = await supabase
          .from("financial_transactions")
          .select("type, amount")
          .eq("user_id", ownerId)
          .eq("transaction_date", today.toISOString().split("T")[0]);
        
        let receitas = 0;
        let despesas = 0;
        (transactions || []).forEach((t: any) => {
          if (t.type === "income") receitas += Number(t.amount);
          else despesas += Number(t.amount);
        });
        
        // Pending tasks
        const { data: tasks } = await supabase
          .from("tasks")
          .select("id")
          .eq("user_id", ownerId)
          .in("status", ["todo", "in_progress"]);
        
        const tarefasPendentes = tasks?.length || 0;
        
        return `📊 **Resumo do Dia**\n\n📅 **Agendamentos:**\n- Total: ${totalAgendamentos}\n- Concluídos: ${concluidos}\n- Pendentes: ${totalAgendamentos - concluidos}\n\n💰 **Financeiro:**\n- Receitas: R$ ${receitas.toFixed(2)}\n- Despesas: R$ ${despesas.toFixed(2)}\n- Saldo do dia: R$ ${(receitas - despesas).toFixed(2)}\n\n📋 **Tarefas pendentes:** ${tarefasPendentes}`;
      }
      
      default:
        return `Função "${toolName}" não reconhecida.`;
    }
  } catch (error) {
    console.error(`Error executing ${toolName}:`, error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return `Erro ao executar ${toolName}: ${errorMessage}`;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, user_id } = await req.json();
    
    if (!user_id) {
      return new Response(JSON.stringify({ error: "user_id é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get owner ID (handles team members)
    const ownerId = await getOwnerUserId(supabase, user_id);

    // Get business settings for context
    const { data: settings } = await supabase
      .from("business_settings")
      .select("business_name, business_type, ai_training")
      .eq("user_id", ownerId)
      .single();

    const businessName = settings?.business_name || "sua empresa";
    const businessType = settings?.business_type || "serviços";
    const aiTraining = settings?.ai_training || {};

    const systemPrompt = `Você é um assistente inteligente do sistema de gestão "${businessName}" (${businessType}).

Sua personalidade: ${aiTraining.personality || "profissional e prestativo"}
Tom: ${aiTraining.tone || "amigável mas profissional"}

Você pode executar as seguintes ações no sistema:
1. Listar e criar agendamentos
2. Buscar e cadastrar clientes
3. Consultar finanças e registrar transações
4. Verificar e ajustar estoque
5. Criar tarefas
6. Gerar resumos do dia

REGRAS IMPORTANTES:
- Seja conciso e direto nas respostas
- Use emojis para tornar a comunicação mais amigável
- Quando criar algo, confirme o que foi feito
- Se precisar de informações adicionais, pergunte
- Para criar agendamentos, você precisa do horário no formato correto (ISO 8601)
- Ao buscar clientes, mostre o ID para usar em agendamentos
- Fale sempre em português brasileiro

Data atual: ${new Date().toLocaleDateString("pt-BR")}
Hora atual: ${new Date().toLocaleTimeString("pt-BR")}`;

    // First API call - may return tool calls
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages
        ],
        tools,
        tool_choice: "auto"
      })
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Entre em contato com o suporte." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const assistantMessage = aiData.choices[0].message;

    // Check if the AI wants to call tools
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      const toolResults: any[] = [];
      
      for (const toolCall of assistantMessage.tool_calls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);
        
        console.log(`Executing tool: ${functionName}`, functionArgs);
        
        const result = await executeTool(supabase, ownerId, functionName, functionArgs);
        
        toolResults.push({
          tool_call_id: toolCall.id,
          role: "tool",
          content: result
        });
      }

      // Second API call with tool results
      const finalResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
            assistantMessage,
            ...toolResults
          ]
        })
      });

      if (!finalResponse.ok) {
        throw new Error(`AI gateway error on final response: ${finalResponse.status}`);
      }

      const finalData = await finalResponse.json();
      const finalContent = finalData.choices[0].message.content;

      return new Response(JSON.stringify({ content: finalContent }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // No tool calls, return direct response
    return new Response(JSON.stringify({ content: assistantMessage.content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("AI Agent error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Erro desconhecido" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
