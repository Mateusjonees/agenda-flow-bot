import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WhatsAppProposalRequest {
  proposalId: string;
  customerPhone: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { proposalId, customerPhone }: WhatsAppProposalRequest = await req.json();
    
    console.log("Enviando proposta via WhatsApp:", { proposalId, customerPhone });

    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar detalhes da proposta
    const { data: proposal, error: proposalError } = await supabase
      .from("proposals")
      .select(`
        *,
        customers (name, phone)
      `)
      .eq("id", proposalId)
      .single();

    if (proposalError || !proposal) {
      console.error("Erro ao buscar proposta:", proposalError);
      throw new Error("Proposta não encontrada");
    }

    // Formatar mensagem
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(value);
    };

    let servicesText = "";
    if (proposal.services && Array.isArray(proposal.services)) {
      servicesText = proposal.services
        .map((s: any) => `- ${s.description} (${s.quantity}x ${formatCurrency(s.unit_price)})`)
        .join("\n");
    }

    const message = `
🎯 *Nova Proposta de Orçamento*

Olá ${proposal.customers.name}!

Segue a proposta: *${proposal.title}*

📋 *Serviços Inclusos:*
${servicesText}

💰 *Valor Total:* ${formatCurrency(proposal.final_amount)}
${proposal.deposit_amount ? `💳 *Sinal:* ${formatCurrency(proposal.deposit_amount)}\n` : ""}
📅 *Validade:* ${new Date(proposal.valid_until).toLocaleDateString("pt-BR")}

${proposal.description ? `\n📝 *Detalhes:*\n${proposal.description}\n` : ""}
Para aceitar esta proposta ou tirar dúvidas, entre em contato conosco!
    `.trim();

    // Enviar via WhatsApp Cloud API
    const whatsappToken = Deno.env.get("WHATSAPP_API_TOKEN");
    const whatsappPhoneId = Deno.env.get("WHATSAPP_PHONE_ID");

    if (!whatsappToken || !whatsappPhoneId) {
      console.error("WhatsApp API não configurado");
      throw new Error("WhatsApp API não está configurado. Adicione WHATSAPP_API_TOKEN e WHATSAPP_PHONE_ID");
    }

    // Limpar número de telefone (remover caracteres especiais)
    const cleanPhone = customerPhone.replace(/\D/g, "");
    const phoneNumber = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;

    const whatsappResponse = await fetch(
      `https://graph.facebook.com/v17.0/${whatsappPhoneId}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${whatsappToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phoneNumber,
          type: "text",
          text: {
            body: message,
          },
        }),
      }
    );

    const whatsappData = await whatsappResponse.json();

    if (!whatsappResponse.ok) {
      console.error("Erro ao enviar WhatsApp:", whatsappData);
      throw new Error(`Erro ao enviar WhatsApp: ${JSON.stringify(whatsappData)}`);
    }

    console.log("WhatsApp enviado com sucesso:", whatsappData);

    // Atualizar status da proposta para "sent"
    await supabase
      .from("proposals")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
      })
      .eq("id", proposalId);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Proposta enviada via WhatsApp com sucesso",
        whatsappData,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Erro na função:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
};

serve(handler);
