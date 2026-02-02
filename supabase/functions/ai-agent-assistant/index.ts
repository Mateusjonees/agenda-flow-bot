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
      name: "importar_clientes",
      description: "Importa múltiplos clientes de uma vez. Use quando o usuário quiser importar uma lista de clientes de outro sistema.",
      parameters: {
        type: "object",
        properties: {
          clientes: {
            type: "array",
            description: "Lista de clientes para importar",
            items: {
              type: "object",
              properties: {
                nome: { type: "string", description: "Nome do cliente" },
                telefone: { type: "string", description: "Telefone" },
                email: { type: "string", description: "Email" }
              },
              required: ["nome"]
            }
          }
        },
        required: ["clientes"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "importar_estoque",
      description: "Importa múltiplos itens de estoque de uma vez.",
      parameters: {
        type: "object",
        properties: {
          itens: {
            type: "array",
            description: "Lista de itens para importar",
            items: {
              type: "object",
              properties: {
                nome: { type: "string", description: "Nome do item" },
                quantidade: { type: "number", description: "Quantidade em estoque" },
                preco_custo: { type: "number", description: "Preço de custo" },
                preco_venda: { type: "number", description: "Preço de venda" },
                categoria: { type: "string", description: "Categoria do item" },
                unidade: { type: "string", description: "Unidade (un, kg, L, etc.)" }
              },
              required: ["nome"]
            }
          }
        },
        required: ["itens"]
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
          data_vencimento: { type: "string", description: "Data de vencimento (ISO 8601, opcional)" },
          customer_id: { type: "string", description: "ID do cliente relacionado (opcional)" }
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
  },
  {
    type: "function",
    function: {
      name: "analisar_cliente",
      description: "Analisa um cliente específico: histórico de compras, agendamentos, valor gasto, frequência de visitas e sugere ações.",
      parameters: {
        type: "object",
        properties: {
          customer_id: { type: "string", description: "ID do cliente para analisar" }
        },
        required: ["customer_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "gerar_pdf_relatorio",
      description: "Gera um relatório em PDF com os dados solicitados. Retorna o HTML formatado para PDF.",
      parameters: {
        type: "object",
        properties: {
          tipo: { 
            type: "string", 
            enum: ["resumo_diario", "clientes", "financeiro", "estoque"],
            description: "Tipo de relatório" 
          },
          periodo: { 
            type: "string", 
            enum: ["hoje", "semana", "mes"],
            description: "Período do relatório" 
          }
        },
        required: ["tipo"]
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
async function executeTool(supabase: any, ownerId: string, toolName: string, args: any, businessSettings: any): Promise<{ result: string; dataChanged?: boolean; importCount?: number; pdfHtml?: string }> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);
  
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - 7);
  
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
          return { result: `Nenhum agendamento encontrado para ${args.periodo}.` };
        }
        
        const lista = data.map((a: any) => {
          const hora = new Date(a.start_time).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
          const dataStr = new Date(a.start_time).toLocaleDateString("pt-BR");
          const cliente = a.customers?.name || "Cliente não especificado";
          const servico = a.services?.name || a.title;
          return `- ${dataStr} às ${hora}: ${servico} com ${cliente} (${a.status || "agendado"})`;
        }).join("\n");
        
        return { result: `📅 Agendamentos para ${args.periodo}:\n${lista}` };
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
        return { 
          result: `✅ Agendamento criado com sucesso!\n📌 ${args.titulo}\n📆 ${dataFormatada}`,
          dataChanged: true
        };
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
          return { result: `Nenhum cliente encontrado com "${args.termo}".` };
        }
        
        const lista = data.map((c: any) => 
          `- ${c.name} | Tel: ${c.phone || "N/A"} | Email: ${c.email || "N/A"} (ID: ${c.id})`
        ).join("\n");
        
        return { result: `👥 Clientes encontrados:\n${lista}` };
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
        
        return { 
          result: `✅ Cliente cadastrado com sucesso!\n👤 ${args.nome}\n📞 ${args.telefone || "Não informado"}\n📧 ${args.email || "Não informado"}\nID: ${data.id}`,
          dataChanged: true
        };
      }

      case "importar_clientes": {
        const clientes = args.clientes || [];
        if (clientes.length === 0) {
          return { result: "❌ Nenhum cliente fornecido para importar." };
        }

        // Processar em lotes de 500
        const BATCH_SIZE = 500;
        let importados = 0;
        let erros = 0;

        for (let i = 0; i < clientes.length; i += BATCH_SIZE) {
          const batch = clientes.slice(i, i + BATCH_SIZE).map((c: any) => ({
            user_id: ownerId,
            name: c.nome,
            phone: c.telefone || null,
            email: c.email || null
          }));

          const { error } = await supabase.from("customers").insert(batch);
          
          if (error) {
            console.error("Batch import error:", error);
            erros += batch.length;
          } else {
            importados += batch.length;
          }
        }

        return { 
          result: `✅ Importação concluída!\n\n👥 ${importados} clientes importados com sucesso${erros > 0 ? `\n⚠️ ${erros} erros` : ""}`,
          dataChanged: true,
          importCount: importados
        };
      }

      case "importar_estoque": {
        const itens = args.itens || [];
        if (itens.length === 0) {
          return { result: "❌ Nenhum item fornecido para importar." };
        }

        const BATCH_SIZE = 500;
        let importados = 0;
        let erros = 0;

        for (let i = 0; i < itens.length; i += BATCH_SIZE) {
          const batch = itens.slice(i, i + BATCH_SIZE).map((item: any) => ({
            user_id: ownerId,
            name: item.nome,
            current_stock: item.quantidade || 0,
            cost_price: item.preco_custo || null,
            unit_price: item.preco_venda || null,
            category: item.categoria || null,
            unit: item.unidade || "un"
          }));

          const { error } = await supabase.from("inventory_items").insert(batch);
          
          if (error) {
            console.error("Batch import error:", error);
            erros += batch.length;
          } else {
            importados += batch.length;
          }
        }

        return { 
          result: `✅ Importação de estoque concluída!\n\n📦 ${importados} itens importados com sucesso${erros > 0 ? `\n⚠️ ${erros} erros` : ""}`,
          dataChanged: true,
          importCount: importados
        };
      }
      
      case "consultar_financeiro": {
        let startDate = today;
        let endDate = tomorrow;
        
        if (args.periodo === "semana") {
          startDate = weekStart;
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
        
        return { result: `💰 Resumo financeiro (${args.periodo}):\n\n📈 Receitas: R$ ${receitas.toFixed(2)}\n📉 Despesas: R$ ${despesas.toFixed(2)}\n💵 Saldo: R$ ${saldo.toFixed(2)}\n\nTotal de ${data?.length || 0} transações.` };
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
        return { 
          result: `✅ Transação registrada!\n${tipoTexto}: R$ ${args.valor.toFixed(2)}\n📝 ${args.descricao}`,
          dataChanged: true
        };
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
          return { result: args.termo 
            ? `Nenhum item encontrado com "${args.termo}".`
            : "Estoque vazio." };
        }
        
        const lista = data.map((i: any) => {
          const status = i.current_stock <= (i.min_quantity || 0) ? "⚠️" : "✅";
          return `${status} ${i.name}: ${i.current_stock || 0} ${i.unit || "un"} (ID: ${i.id})`;
        }).join("\n");
        
        return { result: `📦 Estoque:\n${lista}` };
      }
      
      case "ajustar_estoque": {
        const { data: item, error: fetchError } = await supabase
          .from("inventory_items")
          .select("current_stock, name")
          .eq("id", args.item_id)
          .eq("user_id", ownerId)
          .single();
        
        if (fetchError || !item) {
          return { result: "❌ Item não encontrado." };
        }
        
        const novoEstoque = (item.current_stock || 0) + args.quantidade;
        
        const { error } = await supabase
          .from("inventory_items")
          .update({ current_stock: novoEstoque, updated_at: new Date().toISOString() })
          .eq("id", args.item_id);
        
        if (error) throw error;
        
        const acao = args.quantidade > 0 ? "adicionado" : "removido";
        return { 
          result: `✅ Estoque atualizado!\n📦 ${item.name}: ${acao} ${Math.abs(args.quantidade)}\n📊 Novo estoque: ${novoEstoque}${args.motivo ? `\n📝 Motivo: ${args.motivo}` : ""}`,
          dataChanged: true
        };
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
            customer_id: args.customer_id || null,
            status: "todo"
          })
          .select()
          .single();
        
        if (error) throw error;
        
        return { 
          result: `✅ Tarefa criada!\n📌 ${args.titulo}\n⚡ Prioridade: ${args.prioridade || "média"}${args.data_vencimento ? `\n📆 Vencimento: ${new Date(args.data_vencimento).toLocaleDateString("pt-BR")}` : ""}`,
          dataChanged: true
        };
      }
      
      case "gerar_resumo_diario": {
        const { data: appointments } = await supabase
          .from("appointments")
          .select("id, status")
          .eq("user_id", ownerId)
          .gte("start_time", today.toISOString())
          .lt("start_time", tomorrow.toISOString());
        
        const totalAgendamentos = appointments?.length || 0;
        const concluidos = appointments?.filter((a: any) => a.status === "completed").length || 0;
        
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
        
        const { data: tasks } = await supabase
          .from("tasks")
          .select("id")
          .eq("user_id", ownerId)
          .in("status", ["todo", "in_progress"]);
        
        const tarefasPendentes = tasks?.length || 0;
        
        return { result: `📊 **Resumo do Dia**\n\n📅 **Agendamentos:**\n- Total: ${totalAgendamentos}\n- Concluídos: ${concluidos}\n- Pendentes: ${totalAgendamentos - concluidos}\n\n💰 **Financeiro:**\n- Receitas: R$ ${receitas.toFixed(2)}\n- Despesas: R$ ${despesas.toFixed(2)}\n- Saldo do dia: R$ ${(receitas - despesas).toFixed(2)}\n\n📋 **Tarefas pendentes:** ${tarefasPendentes}` };
      }

      case "analisar_cliente": {
        const { data: customer, error: customerError } = await supabase
          .from("customers")
          .select("*")
          .eq("id", args.customer_id)
          .eq("user_id", ownerId)
          .single();

        if (customerError || !customer) {
          return { result: "❌ Cliente não encontrado." };
        }

        // Buscar agendamentos do cliente
        const { data: appointments } = await supabase
          .from("appointments")
          .select("*, services(name, price)")
          .eq("customer_id", args.customer_id)
          .order("start_time", { ascending: false })
          .limit(10);

        // Buscar transações relacionadas
        const { data: transactions } = await supabase
          .from("financial_transactions")
          .select("*")
          .eq("user_id", ownerId)
          .ilike("description", `%${customer.name}%`)
          .order("transaction_date", { ascending: false })
          .limit(10);

        // Calcular métricas
        const totalAgendamentos = appointments?.length || 0;
        const agendamentosConcluidos = appointments?.filter((a: any) => a.status === "completed").length || 0;
        
        let valorTotal = 0;
        (appointments || []).forEach((a: any) => {
          if (a.price) valorTotal += Number(a.price);
          else if (a.services?.price) valorTotal += Number(a.services.price);
        });

        const ultimoAgendamento = appointments?.[0];
        const diasDesdeUltimaVisita = ultimoAgendamento 
          ? Math.floor((Date.now() - new Date(ultimoAgendamento.start_time).getTime()) / (1000 * 60 * 60 * 24))
          : null;

        // Gerar sugestões
        let sugestoes = [];
        if (diasDesdeUltimaVisita && diasDesdeUltimaVisita > 30) {
          sugestoes.push("🔔 Cliente inativo há mais de 30 dias - considere enviar uma mensagem de reativação");
        }
        if (totalAgendamentos >= 5) {
          sugestoes.push("⭐ Cliente frequente - ofereça um programa de fidelidade ou desconto especial");
        }
        if (valorTotal > 500) {
          sugestoes.push("💎 Cliente de alto valor - priorize o atendimento e personalize ofertas");
        }

        const resultado = `📊 **Análise do Cliente: ${customer.name}**

📞 **Contato:**
- Telefone: ${customer.phone || "Não informado"}
- Email: ${customer.email || "Não informado"}

📅 **Histórico de Agendamentos:**
- Total: ${totalAgendamentos}
- Concluídos: ${agendamentosConcluidos}
${diasDesdeUltimaVisita !== null ? `- Última visita: há ${diasDesdeUltimaVisita} dias` : "- Sem agendamentos anteriores"}

💰 **Valor Total Estimado:** R$ ${valorTotal.toFixed(2)}

${sugestoes.length > 0 ? `\n💡 **Sugestões:**\n${sugestoes.join("\n")}` : ""}

${appointments && appointments.length > 0 ? `\n📋 **Últimos Agendamentos:**\n${appointments.slice(0, 3).map((a: any) => {
  const data = new Date(a.start_time).toLocaleDateString("pt-BR");
  return `- ${data}: ${a.services?.name || a.title} (${a.status})`;
}).join("\n")}` : ""}`;

        return { result: resultado };
      }

      case "gerar_pdf_relatorio": {
        const businessName = businessSettings?.business_name || "Meu Negócio";
        const dataAtual = new Date().toLocaleDateString("pt-BR");
        
        let conteudoRelatorio = "";
        let tituloRelatorio = "";

        if (args.tipo === "resumo_diario") {
          tituloRelatorio = "Resumo Diário";
          
          const { data: appointments } = await supabase
            .from("appointments")
            .select("*, customers(name), services(name)")
            .eq("user_id", ownerId)
            .gte("start_time", today.toISOString())
            .lt("start_time", tomorrow.toISOString())
            .order("start_time");

          const { data: transactions } = await supabase
            .from("financial_transactions")
            .select("*")
            .eq("user_id", ownerId)
            .eq("transaction_date", today.toISOString().split("T")[0]);

          let receitas = 0, despesas = 0;
          (transactions || []).forEach((t: any) => {
            if (t.type === "income") receitas += Number(t.amount);
            else despesas += Number(t.amount);
          });

          conteudoRelatorio = `
            <h2>Agendamentos do Dia</h2>
            <table>
              <tr><th>Horário</th><th>Cliente</th><th>Serviço</th><th>Status</th></tr>
              ${(appointments || []).map((a: any) => `
                <tr>
                  <td>${new Date(a.start_time).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</td>
                  <td>${a.customers?.name || "-"}</td>
                  <td>${a.services?.name || a.title}</td>
                  <td>${a.status || "Agendado"}</td>
                </tr>
              `).join("")}
            </table>
            
            <h2>Resumo Financeiro</h2>
            <p><strong>Receitas:</strong> R$ ${receitas.toFixed(2)}</p>
            <p><strong>Despesas:</strong> R$ ${despesas.toFixed(2)}</p>
            <p><strong>Saldo:</strong> R$ ${(receitas - despesas).toFixed(2)}</p>
          `;
        } else if (args.tipo === "clientes") {
          tituloRelatorio = "Lista de Clientes";
          
          const { data: customers } = await supabase
            .from("customers")
            .select("*")
            .eq("user_id", ownerId)
            .order("name")
            .limit(100);

          conteudoRelatorio = `
            <table>
              <tr><th>Nome</th><th>Telefone</th><th>Email</th></tr>
              ${(customers || []).map((c: any) => `
                <tr>
                  <td>${c.name}</td>
                  <td>${c.phone || "-"}</td>
                  <td>${c.email || "-"}</td>
                </tr>
              `).join("")}
            </table>
            <p><em>Total: ${customers?.length || 0} clientes</em></p>
          `;
        } else if (args.tipo === "financeiro") {
          tituloRelatorio = `Relatório Financeiro - ${args.periodo || "Mês"}`;
          
          let startDate = monthStart;
          if (args.periodo === "semana") startDate = weekStart;
          else if (args.periodo === "hoje") startDate = today;

          const { data: transactions } = await supabase
            .from("financial_transactions")
            .select("*")
            .eq("user_id", ownerId)
            .gte("transaction_date", startDate.toISOString().split("T")[0])
            .order("transaction_date", { ascending: false });

          let receitas = 0, despesas = 0;
          (transactions || []).forEach((t: any) => {
            if (t.type === "income") receitas += Number(t.amount);
            else despesas += Number(t.amount);
          });

          conteudoRelatorio = `
            <div class="summary">
              <div class="summary-item income"><strong>Receitas:</strong> R$ ${receitas.toFixed(2)}</div>
              <div class="summary-item expense"><strong>Despesas:</strong> R$ ${despesas.toFixed(2)}</div>
              <div class="summary-item balance"><strong>Saldo:</strong> R$ ${(receitas - despesas).toFixed(2)}</div>
            </div>
            
            <h2>Transações</h2>
            <table>
              <tr><th>Data</th><th>Tipo</th><th>Descrição</th><th>Valor</th></tr>
              ${(transactions || []).map((t: any) => `
                <tr>
                  <td>${new Date(t.transaction_date).toLocaleDateString("pt-BR")}</td>
                  <td>${t.type === "income" ? "Receita" : "Despesa"}</td>
                  <td>${t.description || "-"}</td>
                  <td class="${t.type}">R$ ${Number(t.amount).toFixed(2)}</td>
                </tr>
              `).join("")}
            </table>
          `;
        } else if (args.tipo === "estoque") {
          tituloRelatorio = "Relatório de Estoque";
          
          const { data: items } = await supabase
            .from("inventory_items")
            .select("*")
            .eq("user_id", ownerId)
            .order("name");

          conteudoRelatorio = `
            <table>
              <tr><th>Item</th><th>Quantidade</th><th>Unidade</th><th>Mín.</th><th>Status</th></tr>
              ${(items || []).map((i: any) => {
                const baixo = (i.current_stock || 0) <= (i.min_quantity || 0);
                return `
                  <tr class="${baixo ? 'low-stock' : ''}">
                    <td>${i.name}</td>
                    <td>${i.current_stock || 0}</td>
                    <td>${i.unit || "un"}</td>
                    <td>${i.min_quantity || "-"}</td>
                    <td>${baixo ? "⚠️ Baixo" : "✅ OK"}</td>
                  </tr>
                `;
              }).join("")}
            </table>
          `;
        }

        const pdfHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
              h1 { color: #7c3aed; border-bottom: 2px solid #7c3aed; padding-bottom: 10px; }
              h2 { color: #4f46e5; margin-top: 30px; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
              th { background: #7c3aed; color: white; }
              tr:nth-child(even) { background: #f9f9f9; }
              .summary { display: flex; gap: 20px; margin: 20px 0; }
              .summary-item { padding: 15px; border-radius: 8px; flex: 1; }
              .income { background: #d1fae5; color: #065f46; }
              .expense { background: #fee2e2; color: #991b1b; }
              .balance { background: #e0e7ff; color: #3730a3; }
              .low-stock { background: #fef3c7; }
              .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
              .date { color: #666; }
            </style>
          </head>
          <body>
            <div class="header">
              <div>
                <h1>${businessName}</h1>
                <h2>${tituloRelatorio}</h2>
              </div>
              <div class="date">Gerado em: ${dataAtual}</div>
            </div>
            ${conteudoRelatorio}
          </body>
          </html>
        `;

        return { 
          result: `✅ Relatório "${tituloRelatorio}" gerado com sucesso!\n\n📄 Clique no botão para baixar o PDF ou use os comandos abaixo para imprimir.`,
          pdfHtml
        };
      }
      
      default:
        return { result: `Função "${toolName}" não reconhecida.` };
    }
  } catch (error) {
    console.error(`Error executing ${toolName}:`, error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return { result: `Erro ao executar ${toolName}: ${errorMessage}` };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, user_id, customer_context } = await req.json();
    
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

    const ownerId = await getOwnerUserId(supabase, user_id);

    const { data: settings } = await supabase
      .from("business_settings")
      .select("business_name, business_type, ai_training")
      .eq("user_id", ownerId)
      .single();

    const businessName = settings?.business_name || "sua empresa";
    const businessType = settings?.business_type || "serviços";
    const aiTraining = settings?.ai_training || {};

    // Contexto adicional do cliente se fornecido
    const customerContextStr = customer_context 
      ? `\n\nCONTEXTO DO CLIENTE:\nVocê está analisando o cliente "${customer_context.name}" (ID: ${customer_context.id}). Use a função analisar_cliente para obter detalhes completos.`
      : "";

    const systemPrompt = `Você é um assistente inteligente do sistema de gestão "${businessName}" (${businessType}).

Sua personalidade: ${aiTraining.personality || "profissional e prestativo"}
Tom: ${aiTraining.tone || "amigável mas profissional"}

=== O QUE VOCÊ PODE FAZER (SUAS CAPACIDADES REAIS) ===
1. ✅ Listar e criar agendamentos no sistema
2. ✅ Buscar e cadastrar clientes
3. ✅ IMPORTAR CLIENTES EM MASSA - quando o usuário quiser importar uma lista de clientes
4. ✅ IMPORTAR ESTOQUE EM MASSA - quando o usuário quiser importar itens de estoque
5. ✅ Consultar finanças e registrar transações
6. ✅ Verificar e ajustar estoque
7. ✅ Criar tarefas
8. ✅ Gerar resumos do dia
9. ✅ ANALISAR CLIENTES - histórico, valor, sugestões de ações
10. ✅ GERAR PDFs - relatórios em formato PDF para download

=== O QUE VOCÊ NÃO PODE FAZER (NUNCA PROMETA ISSO) ===
❌ ENVIAR EMAILS - você NÃO pode enviar emails para ninguém
❌ ENVIAR WHATSAPP - você NÃO pode enviar mensagens de WhatsApp
❌ ENVIAR SMS - você NÃO pode enviar SMS
❌ FAZER LIGAÇÕES - você NÃO pode fazer ligações telefônicas
❌ ACESSAR INTERNET EXTERNA - você NÃO pode acessar sites externos
❌ ENVIAR NOTIFICAÇÕES PUSH - você NÃO pode enviar notificações
❌ COMPARTILHAR ARQUIVOS - você NÃO pode enviar arquivos por nenhum meio
❌ AGENDAR ENVIOS AUTOMÁTICOS - você NÃO pode programar envios futuros
❌ INTEGRAR COM OUTROS SISTEMAS - você NÃO pode se conectar a sistemas externos

REGRA CRÍTICA: NUNCA diga que vai "enviar", "notificar", "avisar por email/WhatsApp" ou qualquer ação de comunicação externa.
Se o usuário pedir algo que você não pode fazer, seja HONESTO e diga: "Desculpe, eu não consigo [ação]. Mas posso [alternativa que você PODE fazer]."

REGRAS PARA IMPORTAÇÃO:
- Quando o usuário quiser importar clientes ou estoque, peça a lista no formato:
  nome, telefone, email (para clientes)
  nome, quantidade, preço custo, preço venda, categoria (para estoque)
- Você pode processar até 500 registros por vez
- Após importar, confirme a quantidade importada

REGRAS IMPORTANTES:
- Seja conciso e direto nas respostas
- Use emojis para tornar a comunicação mais amigável
- Quando criar algo, confirme o que foi feito
- Se precisar de informações adicionais, pergunte
- Para criar agendamentos, você precisa do horário no formato correto (ISO 8601)
- Ao buscar clientes, mostre o ID para usar em agendamentos
- Fale sempre em português brasileiro
- SEJA HONESTO sobre suas limitações
${customerContextStr}

Data atual: ${new Date().toLocaleDateString("pt-BR")}
Hora atual: ${new Date().toLocaleTimeString("pt-BR")}`;

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

    let dataChanged = false;
    let importCount = 0;
    let pdfHtml: string | undefined;

    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      const toolResults: any[] = [];
      
      for (const toolCall of assistantMessage.tool_calls) {
        const functionName = toolCall.function.name;
        const functionArgs = JSON.parse(toolCall.function.arguments);
        
        console.log(`Executing tool: ${functionName}`, functionArgs);
        
        const result = await executeTool(supabase, ownerId, functionName, functionArgs, settings);
        
        if (result.dataChanged) dataChanged = true;
        if (result.importCount) importCount += result.importCount;
        if (result.pdfHtml) pdfHtml = result.pdfHtml;
        
        toolResults.push({
          tool_call_id: toolCall.id,
          role: "tool",
          content: result.result
        });
      }

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

      return new Response(JSON.stringify({ 
        content: finalContent,
        data_changed: dataChanged,
        import_count: importCount > 0 ? importCount : undefined,
        pdf_html: pdfHtml
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ 
      content: assistantMessage.content,
      data_changed: dataChanged
    }), {
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
