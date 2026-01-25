import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Tool definitions for the AI agent
const tools = [
  {
    type: "function",
    function: {
      name: "criar_agendamento",
      description: "Criar novo agendamento/compromisso para um cliente",
      parameters: {
        type: "object",
        properties: {
          cliente_nome: { type: "string", description: "Nome do cliente" },
          cliente_telefone: { type: "string", description: "Telefone do cliente (opcional)" },
          data: { type: "string", description: "Data no formato YYYY-MM-DD" },
          horario_inicio: { type: "string", description: "Horário de início no formato HH:MM" },
          horario_fim: { type: "string", description: "Horário de fim no formato HH:MM (opcional)" },
          servico_nome: { type: "string", description: "Nome do serviço (opcional)" },
          titulo: { type: "string", description: "Título do agendamento" },
          observacoes: { type: "string", description: "Notas adicionais (opcional)" }
        },
        required: ["cliente_nome", "data", "horario_inicio", "titulo"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "listar_agendamentos",
      description: "Listar agendamentos de um período específico",
      parameters: {
        type: "object",
        properties: {
          data_inicio: { type: "string", description: "Data inicial no formato YYYY-MM-DD" },
          data_fim: { type: "string", description: "Data final no formato YYYY-MM-DD (opcional, padrão é a mesma data_inicio)" }
        },
        required: ["data_inicio"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "cadastrar_cliente",
      description: "Cadastrar um novo cliente no sistema",
      parameters: {
        type: "object",
        properties: {
          nome: { type: "string", description: "Nome completo do cliente" },
          telefone: { type: "string", description: "Telefone do cliente (opcional)" },
          email: { type: "string", description: "Email do cliente (opcional)" },
          endereco: { type: "string", description: "Endereço do cliente (opcional)" },
          observacoes: { type: "string", description: "Notas sobre o cliente (opcional)" }
        },
        required: ["nome"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "buscar_cliente",
      description: "Buscar cliente por nome ou telefone",
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
      name: "registrar_transacao",
      description: "Registrar uma transação financeira (receita ou despesa)",
      parameters: {
        type: "object",
        properties: {
          tipo: { type: "string", enum: ["receita", "despesa"], description: "Tipo da transação" },
          valor: { type: "number", description: "Valor da transação" },
          descricao: { type: "string", description: "Descrição da transação" },
          metodo_pagamento: { type: "string", description: "Método de pagamento (dinheiro, pix, cartao_credito, cartao_debito)" },
          data: { type: "string", description: "Data da transação no formato YYYY-MM-DD (opcional, padrão é hoje)" }
        },
        required: ["tipo", "valor", "descricao"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "ver_saldo",
      description: "Consultar saldo financeiro de um período",
      parameters: {
        type: "object",
        properties: {
          data_inicio: { type: "string", description: "Data inicial no formato YYYY-MM-DD" },
          data_fim: { type: "string", description: "Data final no formato YYYY-MM-DD" }
        },
        required: ["data_inicio", "data_fim"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "adicionar_estoque",
      description: "Adicionar novo item ao estoque ou aumentar quantidade de item existente",
      parameters: {
        type: "object",
        properties: {
          nome: { type: "string", description: "Nome do item" },
          quantidade: { type: "number", description: "Quantidade a adicionar" },
          preco_custo: { type: "number", description: "Preço de custo unitário (opcional)" },
          preco_venda: { type: "number", description: "Preço de venda unitário (opcional)" },
          quantidade_minima: { type: "number", description: "Quantidade mínima para alerta (opcional)" }
        },
        required: ["nome", "quantidade"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "ajustar_estoque",
      description: "Ajustar quantidade de um item no estoque",
      parameters: {
        type: "object",
        properties: {
          nome_item: { type: "string", description: "Nome do item no estoque" },
          nova_quantidade: { type: "number", description: "Nova quantidade do item" },
          motivo: { type: "string", description: "Motivo do ajuste (opcional)" }
        },
        required: ["nome_item", "nova_quantidade"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "criar_tarefa",
      description: "Criar uma nova tarefa/lembrete",
      parameters: {
        type: "object",
        properties: {
          titulo: { type: "string", description: "Título da tarefa" },
          descricao: { type: "string", description: "Descrição detalhada (opcional)" },
          data_limite: { type: "string", description: "Data limite no formato YYYY-MM-DD (opcional)" },
          prioridade: { type: "string", enum: ["baixa", "media", "alta"], description: "Prioridade da tarefa" }
        },
        required: ["titulo"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "resumo_dia",
      description: "Obter resumo do dia com agendamentos e financeiro",
      parameters: {
        type: "object",
        properties: {
          data: { type: "string", description: "Data no formato YYYY-MM-DD (opcional, padrão é hoje)" }
        },
        required: []
      }
    }
  }
];

// Tool executors
async function executeCreateAppointment(supabase: any, userId: string, params: any) {
  // Find or create customer
  let customerId = null;
  
  const { data: existingCustomer } = await supabase
    .from("customers")
    .select("id, name")
    .eq("user_id", userId)
    .ilike("name", `%${params.cliente_nome}%`)
    .limit(1)
    .single();
  
  if (existingCustomer) {
    customerId = existingCustomer.id;
  } else {
    const { data: newCustomer, error: customerError } = await supabase
      .from("customers")
      .insert({
        user_id: userId,
        name: params.cliente_nome,
        phone: params.cliente_telefone || null
      })
      .select()
      .single();
    
    if (customerError) throw new Error(`Erro ao criar cliente: ${customerError.message}`);
    customerId = newCustomer.id;
  }
  
  // Find service if specified
  let serviceId = null;
  let serviceDuration = 60;
  
  if (params.servico_nome) {
    const { data: service } = await supabase
      .from("services")
      .select("id, duration")
      .eq("user_id", userId)
      .ilike("name", `%${params.servico_nome}%`)
      .limit(1)
      .single();
    
    if (service) {
      serviceId = service.id;
      serviceDuration = service.duration || 60;
    }
  }
  
  // Calculate end time
  const startTime = new Date(`${params.data}T${params.horario_inicio}:00`);
  let endTime: Date;
  
  if (params.horario_fim) {
    endTime = new Date(`${params.data}T${params.horario_fim}:00`);
  } else {
    endTime = new Date(startTime.getTime() + serviceDuration * 60000);
  }
  
  const { data: appointment, error } = await supabase
    .from("appointments")
    .insert({
      user_id: userId,
      customer_id: customerId,
      service_id: serviceId,
      title: params.titulo,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      notes: params.observacoes || null,
      status: "scheduled"
    })
    .select(`
      *,
      customers(name),
      services(name)
    `)
    .single();
  
  if (error) throw new Error(`Erro ao criar agendamento: ${error.message}`);
  
  return {
    success: true,
    message: `✅ Agendamento criado com sucesso!`,
    details: {
      cliente: appointment.customers?.name,
      servico: appointment.services?.name || params.titulo,
      data: params.data,
      horario: `${params.horario_inicio} - ${endTime.toTimeString().slice(0, 5)}`
    }
  };
}

async function executeListAppointments(supabase: any, userId: string, params: any) {
  const dataFim = params.data_fim || params.data_inicio;
  
  const { data: appointments, error } = await supabase
    .from("appointments")
    .select(`
      *,
      customers(name, phone),
      services(name)
    `)
    .eq("user_id", userId)
    .gte("start_time", `${params.data_inicio}T00:00:00`)
    .lte("start_time", `${dataFim}T23:59:59`)
    .order("start_time");
  
  if (error) throw new Error(`Erro ao buscar agendamentos: ${error.message}`);
  
  if (!appointments || appointments.length === 0) {
    return { success: true, message: "📅 Nenhum agendamento encontrado para este período.", appointments: [] };
  }
  
  const formatted = appointments.map((apt: any) => ({
    horario: new Date(apt.start_time).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    cliente: apt.customers?.name || "Sem cliente",
    servico: apt.services?.name || apt.title,
    status: apt.status
  }));
  
  return {
    success: true,
    message: `📅 ${appointments.length} agendamento(s) encontrado(s):`,
    appointments: formatted
  };
}

async function executeCreateCustomer(supabase: any, userId: string, params: any) {
  const { data: existing } = await supabase
    .from("customers")
    .select("id, name")
    .eq("user_id", userId)
    .ilike("name", params.nome)
    .limit(1)
    .single();
  
  if (existing) {
    return { success: false, message: `⚠️ Já existe um cliente com nome similar: ${existing.name}` };
  }
  
  const { data: customer, error } = await supabase
    .from("customers")
    .insert({
      user_id: userId,
      name: params.nome,
      phone: params.telefone || null,
      email: params.email || null,
      address: params.endereco || null,
      notes: params.observacoes || null
    })
    .select()
    .single();
  
  if (error) throw new Error(`Erro ao cadastrar cliente: ${error.message}`);
  
  return {
    success: true,
    message: `✅ Cliente cadastrado com sucesso!`,
    details: {
      nome: customer.name,
      telefone: customer.phone || "Não informado",
      email: customer.email || "Não informado"
    }
  };
}

async function executeSearchCustomer(supabase: any, userId: string, params: any) {
  const { data: customers, error } = await supabase
    .from("customers")
    .select("id, name, phone, email")
    .eq("user_id", userId)
    .or(`name.ilike.%${params.termo}%,phone.ilike.%${params.termo}%`)
    .limit(10);
  
  if (error) throw new Error(`Erro ao buscar clientes: ${error.message}`);
  
  if (!customers || customers.length === 0) {
    return { success: true, message: "🔍 Nenhum cliente encontrado.", customers: [] };
  }
  
  return {
    success: true,
    message: `🔍 ${customers.length} cliente(s) encontrado(s):`,
    customers: customers.map((c: any) => ({
      nome: c.name,
      telefone: c.phone || "Não informado",
      email: c.email || "Não informado"
    }))
  };
}

async function executeCreateTransaction(supabase: any, userId: string, params: any) {
  const transactionDate = params.data || new Date().toISOString().split("T")[0];
  
  const { data: transaction, error } = await supabase
    .from("financial_transactions")
    .insert({
      user_id: userId,
      type: params.tipo === "receita" ? "income" : "expense",
      amount: params.valor,
      description: params.descricao,
      payment_method: params.metodo_pagamento || null,
      transaction_date: transactionDate,
      status: "confirmed"
    })
    .select()
    .single();
  
  if (error) throw new Error(`Erro ao registrar transação: ${error.message}`);
  
  const emoji = params.tipo === "receita" ? "💰" : "💸";
  return {
    success: true,
    message: `${emoji} ${params.tipo === "receita" ? "Receita" : "Despesa"} registrada com sucesso!`,
    details: {
      valor: `R$ ${params.valor.toFixed(2)}`,
      descricao: params.descricao,
      data: transactionDate
    }
  };
}

async function executeGetBalance(supabase: any, userId: string, params: any) {
  const { data: transactions, error } = await supabase
    .from("financial_transactions")
    .select("type, amount")
    .eq("user_id", userId)
    .gte("transaction_date", params.data_inicio)
    .lte("transaction_date", params.data_fim);
  
  if (error) throw new Error(`Erro ao buscar saldo: ${error.message}`);
  
  let receitas = 0;
  let despesas = 0;
  
  transactions?.forEach((t: any) => {
    if (t.type === "income") receitas += t.amount;
    else despesas += t.amount;
  });
  
  const saldo = receitas - despesas;
  
  return {
    success: true,
    message: `📊 Resumo financeiro (${params.data_inicio} a ${params.data_fim}):`,
    details: {
      receitas: `R$ ${receitas.toFixed(2)}`,
      despesas: `R$ ${despesas.toFixed(2)}`,
      saldo: `R$ ${saldo.toFixed(2)}`,
      status: saldo >= 0 ? "✅ Positivo" : "🔴 Negativo"
    }
  };
}

async function executeAddStock(supabase: any, userId: string, params: any) {
  // Check if item exists
  const { data: existing } = await supabase
    .from("inventory_items")
    .select("id, name, current_stock")
    .eq("user_id", userId)
    .ilike("name", `%${params.nome}%`)
    .limit(1)
    .single();
  
  if (existing) {
    // Update existing item
    const newQuantity = (existing.current_stock || 0) + params.quantidade;
    const { error } = await supabase
      .from("inventory_items")
      .update({ current_stock: newQuantity, quantity: newQuantity })
      .eq("id", existing.id);
    
    if (error) throw new Error(`Erro ao atualizar estoque: ${error.message}`);
    
    return {
      success: true,
      message: `📦 Estoque atualizado!`,
      details: {
        item: existing.name,
        quantidade_anterior: existing.current_stock || 0,
        quantidade_adicionada: params.quantidade,
        quantidade_atual: newQuantity
      }
    };
  }
  
  // Create new item
  const { data: newItem, error } = await supabase
    .from("inventory_items")
    .insert({
      user_id: userId,
      name: params.nome,
      current_stock: params.quantidade,
      quantity: params.quantidade,
      cost_price: params.preco_custo || null,
      unit_price: params.preco_venda || null,
      min_quantity: params.quantidade_minima || 5
    })
    .select()
    .single();
  
  if (error) throw new Error(`Erro ao adicionar item: ${error.message}`);
  
  return {
    success: true,
    message: `📦 Novo item adicionado ao estoque!`,
    details: {
      item: newItem.name,
      quantidade: params.quantidade
    }
  };
}

async function executeAdjustStock(supabase: any, userId: string, params: any) {
  const { data: item } = await supabase
    .from("inventory_items")
    .select("id, name, current_stock")
    .eq("user_id", userId)
    .ilike("name", `%${params.nome_item}%`)
    .limit(1)
    .single();
  
  if (!item) {
    return { success: false, message: `❌ Item "${params.nome_item}" não encontrado no estoque.` };
  }
  
  const { error } = await supabase
    .from("inventory_items")
    .update({ 
      current_stock: params.nova_quantidade,
      quantity: params.nova_quantidade
    })
    .eq("id", item.id);
  
  if (error) throw new Error(`Erro ao ajustar estoque: ${error.message}`);
  
  // Register stock movement
  await supabase.from("stock_movements").insert({
    user_id: userId,
    item_id: item.id,
    type: params.nova_quantidade > item.current_stock ? "entrada" : "saida",
    quantity: Math.abs(params.nova_quantidade - item.current_stock),
    previous_stock: item.current_stock,
    new_stock: params.nova_quantidade,
    reason: params.motivo || "Ajuste manual via IA"
  });
  
  return {
    success: true,
    message: `📦 Estoque ajustado!`,
    details: {
      item: item.name,
      quantidade_anterior: item.current_stock,
      quantidade_atual: params.nova_quantidade,
      motivo: params.motivo || "Ajuste manual"
    }
  };
}

async function executeCreateTask(supabase: any, userId: string, params: any) {
  const priorityMap: Record<string, string> = {
    baixa: "low",
    media: "medium",
    alta: "high"
  };
  
  const { data: task, error } = await supabase
    .from("tasks")
    .insert({
      user_id: userId,
      title: params.titulo,
      description: params.descricao || null,
      due_date: params.data_limite || null,
      priority: priorityMap[params.prioridade] || "medium",
      status: "todo"
    })
    .select()
    .single();
  
  if (error) throw new Error(`Erro ao criar tarefa: ${error.message}`);
  
  return {
    success: true,
    message: `✅ Tarefa criada com sucesso!`,
    details: {
      titulo: task.title,
      prioridade: params.prioridade || "média",
      data_limite: params.data_limite || "Sem prazo"
    }
  };
}

async function executeGetDaySummary(supabase: any, userId: string, params: any) {
  const data = params.data || new Date().toISOString().split("T")[0];
  
  // Get appointments
  const { data: appointments } = await supabase
    .from("appointments")
    .select("*, customers(name), services(name)")
    .eq("user_id", userId)
    .gte("start_time", `${data}T00:00:00`)
    .lte("start_time", `${data}T23:59:59`)
    .order("start_time");
  
  // Get transactions
  const { data: transactions } = await supabase
    .from("financial_transactions")
    .select("type, amount")
    .eq("user_id", userId)
    .eq("transaction_date", data);
  
  let receitas = 0;
  let despesas = 0;
  transactions?.forEach((t: any) => {
    if (t.type === "income") receitas += t.amount;
    else despesas += t.amount;
  });
  
  const agendamentosFormatados = appointments?.map((apt: any) => ({
    horario: new Date(apt.start_time).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    cliente: apt.customers?.name || "Sem cliente",
    servico: apt.services?.name || apt.title,
    status: apt.status
  })) || [];
  
  return {
    success: true,
    message: `📊 Resumo do dia ${data}:`,
    details: {
      total_agendamentos: appointments?.length || 0,
      agendamentos: agendamentosFormatados,
      financeiro: {
        receitas: `R$ ${receitas.toFixed(2)}`,
        despesas: `R$ ${despesas.toFixed(2)}`,
        saldo: `R$ ${(receitas - despesas).toFixed(2)}`
      }
    }
  };
}

// Main tool executor
async function executeTool(supabase: any, userId: string, toolName: string, args: any) {
  switch (toolName) {
    case "criar_agendamento":
      return await executeCreateAppointment(supabase, userId, args);
    case "listar_agendamentos":
      return await executeListAppointments(supabase, userId, args);
    case "cadastrar_cliente":
      return await executeCreateCustomer(supabase, userId, args);
    case "buscar_cliente":
      return await executeSearchCustomer(supabase, userId, args);
    case "registrar_transacao":
      return await executeCreateTransaction(supabase, userId, args);
    case "ver_saldo":
      return await executeGetBalance(supabase, userId, args);
    case "adicionar_estoque":
      return await executeAddStock(supabase, userId, args);
    case "ajustar_estoque":
      return await executeAdjustStock(supabase, userId, args);
    case "criar_tarefa":
      return await executeCreateTask(supabase, userId, args);
    case "resumo_dia":
      return await executeGetDaySummary(supabase, userId, args);
    default:
      return { success: false, message: `Ferramenta "${toolName}" não reconhecida.` };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { messages, stream = false } = await req.json();
    
    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Messages array required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Get business settings for context
    const { data: businessSettings } = await supabase
      .from("business_settings")
      .select("business_name, business_type")
      .eq("user_id", user.id)
      .single();

    const today = new Date().toISOString().split("T")[0];
    const businessName = businessSettings?.business_name || "seu negócio";
    
    const systemPrompt = `Você é um assistente IA do sistema de gestão "${businessName}". Você pode executar ações reais no sistema.

Data de hoje: ${today}

Suas capacidades:
- Criar e listar agendamentos
- Cadastrar e buscar clientes
- Registrar transações financeiras (receitas/despesas)
- Consultar saldo financeiro
- Gerenciar estoque (adicionar/ajustar itens)
- Criar tarefas/lembretes
- Gerar resumos do dia

Diretrizes:
- Seja conciso e amigável
- Sempre confirme as ações realizadas
- Se faltar informação, pergunte ao usuário
- Use emojis para tornar as respostas mais visuais
- Formate valores monetários em Reais (R$)
- Datas devem estar no formato brasileiro (DD/MM/AAAA)
- Quando não souber algo, admita e sugira alternativas

Exemplos de comandos que você entende:
- "Agende Maria para amanhã às 15h para corte de cabelo"
- "Quanto eu faturei essa semana?"
- "Cadastra o cliente João, telefone 11999998888"
- "Adiciona 50 unidades de shampoo no estoque"
- "Quem são meus próximos clientes hoje?"`;

    // First call to AI with tools
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages
        ],
        tools,
        tool_choice: "auto"
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos na sua conta Lovable." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const assistantMessage = aiResponse.choices[0].message;

    // Check if AI wants to use tools
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      const toolResults = [];
      
      for (const toolCall of assistantMessage.tool_calls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);
        
        console.log(`Executing tool: ${functionName}`, functionArgs);
        
        try {
          const result = await executeTool(supabase, user.id, functionName, functionArgs);
          toolResults.push({
            tool_call_id: toolCall.id,
            role: "tool",
            content: JSON.stringify(result)
          });
        } catch (toolError: any) {
          toolResults.push({
            tool_call_id: toolCall.id,
            role: "tool",
            content: JSON.stringify({ success: false, message: `Erro: ${toolError.message}` })
          });
        }
      }

      // Second call with tool results
      const followUpResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
            assistantMessage,
            ...toolResults
          ]
        }),
      });

      if (!followUpResponse.ok) {
        throw new Error(`Follow-up AI call failed: ${followUpResponse.status}`);
      }

      const followUpData = await followUpResponse.json();
      const finalMessage = followUpData.choices[0].message.content;

      return new Response(
        JSON.stringify({ 
          message: finalMessage,
          toolsUsed: assistantMessage.tool_calls.map((tc: any) => tc.function.name)
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // No tools called, return direct response
    return new Response(
      JSON.stringify({ message: assistantMessage.content }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("AI Assistant error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno do assistente" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
