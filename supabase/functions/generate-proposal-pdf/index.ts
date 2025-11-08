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
  const items = Array.isArray(proposal.items) ? proposal.items : [];
  const servicesHTML = items
    .map((s: any, index: number) => `
      <tr style="background: ${index % 2 === 0 ? '#f8fafc' : 'white'}; transition: background 0.3s;">
        <td style="padding: 16px 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #1e293b;">${s.description}</td>
        <td style="padding: 16px 12px; text-align: center; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #64748b; font-weight: 600;">${s.quantity}</td>
        <td style="padding: 16px 12px; text-align: right; border-bottom: 1px solid #e2e8f0; font-size: 14px; color: #64748b;">${formatCurrency(s.unit_price)}</td>
        <td style="padding: 16px 12px; text-align: right; border-bottom: 1px solid #e2e8f0; font-size: 15px; font-weight: 700; color: #0f172a;">${formatCurrency(s.quantity * s.unit_price)}</td>
      </tr>
    `)
    .join("");

  const discountAmount = (proposal.total_amount * (proposal.discount_percentage || 0)) / 100;
  const currentDate = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Proposta Comercial - ${proposal.title}</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        @page { size: A4; margin: 0; }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          line-height: 1.6;
          color: #1e293b;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          -webkit-font-smoothing: antialiased;
        }
        
        .page {
          width: 210mm;
          min-height: 297mm;
          background: white;
          margin: 0 auto;
          position: relative;
          overflow: hidden;
        }
        
        .watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 120px;
          font-weight: 900;
          color: rgba(148, 163, 184, 0.03);
          text-transform: uppercase;
          letter-spacing: 20px;
          pointer-events: none;
          z-index: 0;
        }
        
        .content {
          position: relative;
          z-index: 1;
          padding: 50px 50px 40px;
        }
        
        .header {
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          color: white;
          padding: 40px;
          border-radius: 20px;
          margin-bottom: 35px;
          box-shadow: 0 20px 40px rgba(30, 41, 59, 0.15);
          position: relative;
          overflow: hidden;
        }
        
        .header::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -20%;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
          border-radius: 50%;
        }
        
        .header-content {
          display: flex;
          align-items: center;
          gap: 25px;
          position: relative;
          z-index: 1;
        }
        
        .logo-circle {
          min-width: 90px;
          width: 90px;
          height: 90px;
          border-radius: 50%;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          overflow: hidden;
        }
        
        .logo-circle img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .header-text h1 {
          font-size: 36px;
          font-weight: 800;
          margin-bottom: 8px;
          letter-spacing: -0.5px;
        }
        
        .header-subtitle {
          font-size: 16px;
          font-weight: 500;
          opacity: 0.95;
          margin-bottom: 12px;
        }
        
        .header-info {
          font-size: 13px;
          opacity: 0.85;
          display: flex;
          gap: 15px;
          flex-wrap: wrap;
        }
        
        .info-item {
          display: flex;
          align-items: center;
          gap: 5px;
        }
        
        .section {
          background: white;
          border-radius: 16px;
          padding: 32px;
          margin-bottom: 24px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px rgba(0,0,0,0.02);
        }
        
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          padding-bottom: 20px;
          border-bottom: 2px solid #e2e8f0;
          margin-bottom: 25px;
        }
        
        .section-title {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: #64748b;
          margin-bottom: 8px;
        }
        
        .section-value {
          font-size: 20px;
          font-weight: 700;
          color: #0f172a;
        }
        
        .proposal-title {
          font-size: 28px;
          font-weight: 800;
          color: #0f172a;
          margin: 25px 0 15px;
          line-height: 1.3;
        }
        
        .proposal-description {
          color: #64748b;
          font-size: 15px;
          line-height: 1.8;
        }
        
        table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          border-radius: 12px;
          overflow: hidden;
        }
        
        thead th {
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          color: white;
          padding: 16px 12px;
          text-align: left;
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .totals-section {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-radius: 16px;
          padding: 28px 32px;
          border: 2px solid #e2e8f0;
        }
        
        .total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .total-row:last-child {
          border-bottom: none;
          padding-top: 20px;
          margin-top: 15px;
          border-top: 3px solid #1e293b;
        }
        
        .total-label {
          font-size: 16px;
          color: #64748b;
          font-weight: 600;
        }
        
        .total-value {
          font-size: 16px;
          color: #0f172a;
          font-weight: 700;
        }
        
        .final-total .total-label {
          font-size: 24px;
          color: #0f172a;
          font-weight: 800;
        }
        
        .final-total .total-value {
          font-size: 36px;
          color: #059669;
          font-weight: 900;
        }
        
        .validity-alert {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          padding: 20px 24px;
          border-radius: 12px;
          border-left: 5px solid #f59e0b;
          display: flex;
          align-items: center;
          gap: 15px;
        }
        
        .validity-icon {
          font-size: 32px;
          flex-shrink: 0;
        }
        
        .validity-text {
          font-size: 14px;
          color: #92400e;
          font-weight: 600;
        }
        
        .footer {
          margin-top: 40px;
          padding-top: 30px;
          border-top: 2px solid #e2e8f0;
          text-align: center;
        }
        
        .footer-info {
          color: #64748b;
          font-size: 12px;
          line-height: 1.8;
        }
        
        .signature-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-top: 50px;
          padding: 30px 0;
        }
        
        .signature-box {
          text-align: center;
        }
        
        .signature-line {
          border-top: 2px solid #1e293b;
          padding-top: 12px;
          margin-top: 60px;
          font-size: 14px;
          font-weight: 600;
          color: #1e293b;
        }
        
        .signature-label {
          font-size: 12px;
          color: #64748b;
          margin-top: 5px;
        }
        
        @media print {
          body { background: white; }
          .page { box-shadow: none; margin: 0; }
          .no-print { display: none !important; }
          .section { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="watermark">PROPOSTA</div>
        <div class="content">
          <!-- Header -->
          <div class="header">
            <div class="header-content">
              ${businessInfo.profile_image_url ? `
                <div class="logo-circle">
                  <img src="${businessInfo.profile_image_url}" alt="Logo da Empresa" />
                </div>
              ` : `
                <div class="logo-circle" style="font-size: 36px; font-weight: 900; color: #1e293b;">
                  ${businessInfo.business_name.charAt(0).toUpperCase()}
                </div>
              `}
              <div class="header-text">
                <h1>PROPOSTA COMERCIAL</h1>
                <div class="header-subtitle">${businessInfo.business_name}</div>
                <div class="header-info">
                  ${businessInfo.email ? `<div class="info-item">✉️ ${businessInfo.email}</div>` : ""}
                  ${businessInfo.whatsapp_number ? `<div class="info-item">📱 ${businessInfo.whatsapp_number}</div>` : ""}
                  ${businessInfo.address ? `<div class="info-item">📍 ${businessInfo.address}</div>` : ""}
                  ${businessInfo.cpf_cnpj ? `<div class="info-item">🏢 ${businessInfo.cpf_cnpj}</div>` : ""}
                </div>
              </div>
            </div>
          </div>

          <!-- Client & Date Section -->
          <div class="section">
            <div class="section-header">
              <div>
                <div class="section-title">Cliente</div>
                <div class="section-value">${proposal.customers.name}</div>
                <div style="color: #64748b; font-size: 14px; margin-top: 4px;">${proposal.customers.phone || ""}</div>
              </div>
              <div style="text-align: right;">
                <div class="section-title">Data de Emissão</div>
                <div class="section-value">${currentDate}</div>
              </div>
            </div>
            
            <h2 class="proposal-title">${proposal.title}</h2>
            ${proposal.description ? `<p class="proposal-description">${proposal.description}</p>` : ""}
          </div>

          <!-- Services Section -->
          <div class="section">
            <h3 style="font-size: 20px; font-weight: 700; margin-bottom: 20px; color: #0f172a;">Serviços Propostos</h3>
            <table>
              <thead>
                <tr>
                  <th>Descrição do Serviço</th>
                  <th style="text-align: center;">Qtd</th>
                  <th style="text-align: right;">Valor Unitário</th>
                  <th style="text-align: right;">Valor Total</th>
                </tr>
              </thead>
              <tbody>
                ${servicesHTML}
              </tbody>
            </table>
          </div>

          <!-- Totals Section -->
          <div class="totals-section">
            <div class="total-row">
              <span class="total-label">Subtotal</span>
              <span class="total-value">${formatCurrency(proposal.total_amount)}</span>
            </div>
            ${discountAmount > 0 ? `
            <div class="total-row">
              <span class="total-label" style="color: #dc2626;">Desconto (${proposal.discount_percentage || 0}%)</span>
              <span class="total-value" style="color: #dc2626;">- ${formatCurrency(discountAmount)}</span>
            </div>
            ` : ""}
            <div class="total-row final-total">
              <span class="total-label">Valor Total</span>
              <span class="total-value">${formatCurrency(proposal.final_amount)}</span>
            </div>
          </div>

          <!-- Validity Alert -->
          ${proposal.valid_until ? `
          <div class="validity-alert" style="margin-top: 24px;">
            <div class="validity-icon">⏰</div>
            <div>
              <div class="validity-text">Proposta válida até ${new Date(proposal.valid_until).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</div>
              <div style="font-size: 12px; color: #b45309; margin-top: 3px;">Após esta data, valores e condições poderão ser reavaliados</div>
            </div>
          </div>
          ` : ""}

          <!-- Signature Section -->
          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-line">${businessInfo.business_name}</div>
              <div class="signature-label">Prestador de Serviços</div>
            </div>
            <div class="signature-box">
              <div class="signature-line">${proposal.customers.name}</div>
              <div class="signature-label">Cliente Contratante</div>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <div class="footer-info">
              <strong>Documento gerado em:</strong> ${currentDate} às ${new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}<br>
              ${businessInfo.business_name} | Proposta Nº ${proposal.id.substring(0, 8).toUpperCase()}<br>
              Este documento é válido como proposta comercial
            </div>
          </div>
          
          <!-- Print Button -->
          <div class="no-print" style="text-align: center; margin-top: 40px;">
            <button onclick="window.print()" style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white; padding: 16px 40px; border: none; border-radius: 12px; font-size: 16px; font-weight: 700; cursor: pointer; box-shadow: 0 10px 25px rgba(30, 41, 59, 0.3); transition: all 0.3s;">
              🖨️ Imprimir ou Salvar como PDF
            </button>
          </div>
        </div>
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
