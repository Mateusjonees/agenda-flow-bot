import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const generateProposalHTML = (proposal: any, businessInfo: any): string => {
  // Garantir que items existe e é um array  
  const items = Array.isArray(proposal.items) ? proposal.items : [];
  const servicesHTML = items
    .map(
      (s: any) => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px 8px;">${s.description}</td>
        <td style="padding: 12px 8px; text-align: center;">${s.quantity}</td>
        <td style="padding: 12px 8px; text-align: right;">${formatCurrency(s.unit_price)}</td>
        <td style="padding: 12px 8px; text-align: right; font-weight: bold;">${formatCurrency(s.quantity * s.unit_price)}</td>
      </tr>
    `
    )
    .join("");

  const discountAmount = (proposal.total_amount * (proposal.discount_percentage || 0)) / 100;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Orçamento - ${proposal.title}</title>
      <style>
        @media print {
          body { margin: 0; padding: 20px; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 800px; margin: 0 auto; padding: 20px; background: #f9fafb;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
        <div style="display: flex; align-items: center; gap: 20px;">
          ${businessInfo.profile_image_url ? `
            <img src="${businessInfo.profile_image_url}" alt="Logo" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 3px solid white;" />
          ` : ''}
          <div>
            <h1 style="margin: 0 0 10px 0; font-size: 32px;">Orçamento</h1>
            <p style="margin: 0; font-size: 18px; opacity: 0.9;">${businessInfo.business_name}</p>
            ${businessInfo.email ? `<p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.8;">${businessInfo.email}</p>` : ""}
            ${businessInfo.whatsapp_number ? `<p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.8;">📱 ${businessInfo.whatsapp_number}</p>` : ""}
          </div>
        </div>
        ${businessInfo.address ? `<p style="margin: 15px 0 0 0; font-size: 12px; opacity: 0.7;">📍 ${businessInfo.address}</p>` : ""}
        ${businessInfo.cpf_cnpj ? `<p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.7;">CPF/CNPJ: ${businessInfo.cpf_cnpj}</p>` : ""}
      </div>

      <div style="background: white; padding: 25px; border-radius: 10px; margin-bottom: 25px; border: 1px solid #e5e7eb;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
          <div>
            <h3 style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px; text-transform: uppercase;">Cliente</h3>
            <p style="margin: 0; font-size: 18px; font-weight: bold; color: #374151;">${proposal.customers.name}</p>
            <p style="margin: 5px 0 0 0; color: #6b7280;">${proposal.customers.phone || ""}</p>
          </div>
          <div style="text-align: right;">
            <h3 style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px; text-transform: uppercase;">Data</h3>
            <p style="margin: 0; font-size: 18px; font-weight: bold; color: #374151;">${new Date().toLocaleDateString("pt-BR")}</p>
          </div>
        </div>
        
        <h2 style="margin: 20px 0 15px 0; color: #374151; font-size: 24px;">${proposal.title}</h2>
        ${proposal.description ? `<p style="color: #6b7280; margin-top: 10px;">${proposal.description}</p>` : ""}
      </div>

      <div style="background: white; padding: 25px; border-radius: 10px; margin-bottom: 25px; border: 1px solid #e5e7eb;">
        <h3 style="margin: 0 0 15px 0; color: #374151; font-size: 20px;">Serviços</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f9fafb; border-bottom: 2px solid #e5e7eb;">
              <th style="padding: 12px 8px; text-align: left; font-weight: 600;">Descrição</th>
              <th style="padding: 12px 8px; text-align: center; font-weight: 600;">Qtd</th>
              <th style="padding: 12px 8px; text-align: right; font-weight: 600;">Valor Unit.</th>
              <th style="padding: 12px 8px; text-align: right; font-weight: 600;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${servicesHTML}
          </tbody>
        </table>
      </div>

      <div style="background: white; padding: 25px; border-radius: 10px; margin-bottom: 25px; border: 1px solid #e5e7eb;">
        <table style="width: 100%;">
          <tr>
            <td style="padding: 8px 0; font-size: 16px; color: #6b7280;">Subtotal</td>
            <td style="text-align: right; padding: 8px 0; font-size: 16px; color: #374151;">${formatCurrency(proposal.total_amount)}</td>
          </tr>
          ${discountAmount > 0 ? `
          <tr>
            <td style="padding: 8px 0; font-size: 16px; color: #ef4444;">Desconto (${proposal.discount_percentage || 0}%)</td>
            <td style="text-align: right; padding: 8px 0; font-size: 16px; color: #ef4444;">- ${formatCurrency(discountAmount)}</td>
          </tr>
          ` : ""}
          <tr style="border-top: 2px solid #e5e7eb;">
            <td style="padding: 15px 0 8px 0; font-size: 24px; font-weight: bold; color: #374151;">Valor Total</td>
            <td style="text-align: right; padding: 15px 0 8px 0; font-size: 28px; font-weight: bold; color: #10b981;">
              ${formatCurrency(proposal.final_amount)}
            </td>
          </tr>
        </table>
      </div>

      ${proposal.valid_until ? `
      <div style="background: #fef3c7; padding: 20px; border-radius: 10px; border: 1px solid #fbbf24; margin-bottom: 25px;">
        <p style="margin: 0; font-size: 14px; color: #92400e;">
          <strong>⏰ Validade:</strong> Este orçamento é válido até ${new Date(proposal.valid_until).toLocaleDateString("pt-BR")}
        </p>
      </div>
      ` : ""}

      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
        <p>Orçamento gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}</p>
        <p>${businessInfo.business_name}</p>
      </div>
      
      <div class="no-print" style="text-align: center; margin-top: 30px;">
        <button onclick="window.print()" style="background: #667eea; color: white; padding: 12px 30px; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; font-weight: bold;">
          🖨️ Imprimir ou Salvar como PDF
        </button>
      </div>
    </body>
    </html>
  `;
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("Autorização não fornecida");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error("Usuário não autenticado");
    }

    const { proposalId } = (await req.json()) as { proposalId: string };

    console.log("Gerando PDF do orçamento:", proposalId);

    // Buscar proposta com dados do cliente
    const { data: proposal, error: proposalError } = await supabase
      .from("proposals")
      .select(`
        *,
        customers (
          name,
          phone,
          email
        )
      `)
      .eq("id", proposalId)
      .eq("user_id", user.id)
      .single();

    if (proposalError || !proposal) {
      throw new Error("Orçamento não encontrado");
    }

    // Buscar configurações do negócio
    const { data: businessSettings } = await supabase
      .from("business_settings")
      .select("business_name, email, whatsapp_number, address, cpf_cnpj, profile_image_url")
      .eq("user_id", user.id)
      .single();

    const businessInfo = {
      business_name: businessSettings?.business_name || "Estabelecimento",
      email: businessSettings?.email || "",
      whatsapp_number: businessSettings?.whatsapp_number || "",
      address: businessSettings?.address || "",
      cpf_cnpj: businessSettings?.cpf_cnpj || "",
      profile_image_url: businessSettings?.profile_image_url || ""
    };

    // Gerar HTML da proposta
    const htmlContent = generateProposalHTML(proposal, businessInfo);

    return new Response(htmlContent, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Erro ao gerar PDF do orçamento:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Erro ao gerar PDF do orçamento",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
});
