import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DocumentRequest {
  subscriptionId: string;
  documentType: "contract" | "receipt";
}

const generateContractHTML = (data: any): string => {
  const { business, customer, plan, subscription } = data;
  const startDate = new Date(subscription.start_date).toLocaleDateString("pt-BR");
  const nextBilling = new Date(subscription.next_billing_date).toLocaleDateString("pt-BR");
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #333;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #E31E24;
      margin: 0;
    }
    .section {
      margin: 30px 0;
    }
    .section h2 {
      color: #333;
      border-bottom: 1px solid #ccc;
      padding-bottom: 10px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin: 20px 0;
    }
    .info-item {
      padding: 10px;
      background: #f9f9f9;
      border-radius: 5px;
    }
    .info-item label {
      font-weight: bold;
      color: #666;
      font-size: 12px;
      display: block;
    }
    .info-item value {
      color: #333;
      font-size: 14px;
    }
    .clause {
      margin: 15px 0;
      text-align: justify;
    }
    .signatures {
      margin-top: 60px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
    }
    .signature-line {
      border-top: 1px solid #333;
      padding-top: 10px;
      text-align: center;
    }
    .footer {
      margin-top: 40px;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>CONTRATO DE ASSINATURA DE SERVIÇOS</h1>
    <p>Nº ${subscription.id.substring(0, 8).toUpperCase()}</p>
  </div>

  <div class="section">
    <h2>CONTRATANTE</h2>
    <div class="info-grid">
      <div class="info-item">
        <label>EMPRESA:</label>
        <value>${business.business_name || "Empresa"}</value>
      </div>
      <div class="info-item">
        <label>ENDEREÇO:</label>
        <value>${business.address || "Não informado"}</value>
      </div>
      <div class="info-item">
        <label>E-MAIL:</label>
        <value>${business.email || "Não informado"}</value>
      </div>
      <div class="info-item">
        <label>TELEFONE:</label>
        <value>${business.whatsapp_number || "Não informado"}</value>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>CONTRATADO</h2>
    <div class="info-grid">
      <div class="info-item">
        <label>NOME:</label>
        <value>${customer.name}</value>
      </div>
      <div class="info-item">
        <label>CPF:</label>
        <value>${customer.cpf || "Não informado"}</value>
      </div>
      <div class="info-item">
        <label>E-MAIL:</label>
        <value>${customer.email || "Não informado"}</value>
      </div>
      <div class="info-item">
        <label>TELEFONE:</label>
        <value>${customer.phone || "Não informado"}</value>
      </div>
      <div class="info-item">
        <label>ENDEREÇO:</label>
        <value>${customer.address || "Não informado"}</value>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>OBJETO DO CONTRATO</h2>
    <div class="info-grid">
      <div class="info-item">
        <label>PLANO:</label>
        <value>${plan.name}</value>
      </div>
      <div class="info-item">
        <label>VALOR:</label>
        <value>R$ ${plan.price.toFixed(2).replace(".", ",")}</value>
      </div>
      <div class="info-item">
        <label>PERIODICIDADE:</label>
        <value>${plan.billing_frequency === "monthly" ? "Mensal" : plan.billing_frequency === "quarterly" ? "Trimestral" : "Único"}</value>
      </div>
      <div class="info-item">
        <label>DATA DE INÍCIO:</label>
        <value>${startDate}</value>
      </div>
      <div class="info-item">
        <label>PRÓXIMO VENCIMENTO:</label>
        <value>${nextBilling}</value>
      </div>
    </div>
    ${plan.description ? `<p style="margin-top: 20px;"><strong>Descrição:</strong> ${plan.description}</p>` : ""}
  </div>

  <div class="section">
    <h2>CLÁUSULAS</h2>
    
    <div class="clause">
      <strong>CLÁUSULA 1ª - DO OBJETO:</strong> O presente contrato tem como objeto a prestação de serviços conforme plano "${plan.name}", 
      pelo valor de R$ ${plan.price.toFixed(2).replace(".", ",")} (${extenso(plan.price)}), 
      com periodicidade ${plan.billing_frequency === "monthly" ? "mensal" : plan.billing_frequency === "quarterly" ? "trimestral" : "única"}.
    </div>

    <div class="clause">
      <strong>CLÁUSULA 2ª - DO PAGAMENTO:</strong> O pagamento será realizado através de PIX, 
      com vencimento na data acordada. Em caso de atraso, será cobrada multa de 2% e juros de 1% ao mês.
    </div>

    <div class="clause">
      <strong>CLÁUSULA 3ª - DA VIGÊNCIA:</strong> O presente contrato entra em vigor na data de sua assinatura, 
      iniciado em ${startDate}, com renovação automática conforme periodicidade estabelecida.
    </div>

    <div class="clause">
      <strong>CLÁUSULA 4ª - DO CANCELAMENTO:</strong> O contratado poderá cancelar a assinatura a qualquer momento, 
      mediante aviso prévio de 30 (trinta) dias, não havendo direito a reembolso proporcional do período já pago.
    </div>

    <div class="clause">
      <strong>CLÁUSULA 5ª - DAS RESPONSABILIDADES:</strong> O contratante se compromete a prestar os serviços 
      descritos no plano contratado com qualidade e profissionalismo. O contratado deve realizar os pagamentos 
      nas datas acordadas.
    </div>

    <div class="clause">
      <strong>CLÁUSULA 6ª - DO FORO:</strong> Fica eleito o foro da comarca do contratante para dirimir 
      quaisquer questões oriundas do presente contrato.
    </div>
  </div>

  <div class="signatures">
    <div class="signature-line">
      <p><strong>${business.business_name || "CONTRATANTE"}</strong></p>
      <p>${business.email || ""}</p>
    </div>
    <div class="signature-line">
      <p><strong>${customer.name}</strong></p>
      <p>${customer.email || ""}</p>
    </div>
  </div>

  <div class="footer">
    <p>Documento gerado em ${new Date().toLocaleString("pt-BR")}</p>
    <p>Contrato Nº ${subscription.id.substring(0, 8).toUpperCase()}</p>
  </div>
</body>
</html>
  `;
};

const generateReceiptHTML = (data: any): string => {
  const { business, customer, plan, subscription } = data;
  const startDate = new Date(subscription.start_date).toLocaleDateString("pt-BR");
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 40px;
      max-width: 600px;
      margin: 0 auto;
    }
    .receipt {
      border: 2px solid #E31E24;
      border-radius: 10px;
      padding: 30px;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #E31E24;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #E31E24;
      margin: 0;
      font-size: 28px;
    }
    .receipt-number {
      background: #E31E24;
      color: white;
      padding: 5px 15px;
      border-radius: 5px;
      display: inline-block;
      margin-top: 10px;
    }
    .info-box {
      background: #f9f9f9;
      padding: 20px;
      border-radius: 5px;
      margin: 20px 0;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #ddd;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .label {
      font-weight: bold;
      color: #666;
    }
    .value {
      color: #333;
    }
    .total-box {
      background: #E31E24;
      color: white;
      padding: 20px;
      border-radius: 5px;
      text-align: center;
      margin: 20px 0;
    }
    .total-box h2 {
      margin: 0;
      font-size: 32px;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      color: #666;
      font-size: 12px;
    }
    .stamp {
      text-align: center;
      margin: 30px 0;
      font-size: 14px;
      color: #E31E24;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <h1>COMPROVANTE DE ASSINATURA</h1>
      <div class="receipt-number">Nº ${subscription.id.substring(0, 8).toUpperCase()}</div>
    </div>

    <div class="info-box">
      <h3 style="margin-top: 0; color: #333;">DADOS DA EMPRESA</h3>
      <div class="info-row">
        <span class="label">Empresa:</span>
        <span class="value">${business.business_name || "Não informado"}</span>
      </div>
      <div class="info-row">
        <span class="label">Endereço:</span>
        <span class="value">${business.address || "Não informado"}</span>
      </div>
      <div class="info-row">
        <span class="label">Telefone:</span>
        <span class="value">${business.whatsapp_number || "Não informado"}</span>
      </div>
      <div class="info-row">
        <span class="label">E-mail:</span>
        <span class="value">${business.email || "Não informado"}</span>
      </div>
    </div>

    <div class="info-box">
      <h3 style="margin-top: 0; color: #333;">DADOS DO CLIENTE</h3>
      <div class="info-row">
        <span class="label">Nome:</span>
        <span class="value">${customer.name}</span>
      </div>
      <div class="info-row">
        <span class="label">CPF:</span>
        <span class="value">${customer.cpf || "Não informado"}</span>
      </div>
      <div class="info-row">
        <span class="label">Telefone:</span>
        <span class="value">${customer.phone || "Não informado"}</span>
      </div>
      <div class="info-row">
        <span class="label">E-mail:</span>
        <span class="value">${customer.email || "Não informado"}</span>
      </div>
    </div>

    <div class="info-box">
      <h3 style="margin-top: 0; color: #333;">DETALHES DO PLANO</h3>
      <div class="info-row">
        <span class="label">Plano:</span>
        <span class="value">${plan.name}</span>
      </div>
      <div class="info-row">
        <span class="label">Descrição:</span>
        <span class="value">${plan.description || "Não informado"}</span>
      </div>
      <div class="info-row">
        <span class="label">Periodicidade:</span>
        <span class="value">${plan.billing_frequency === "monthly" ? "Mensal" : plan.billing_frequency === "quarterly" ? "Trimestral" : "Único"}</span>
      </div>
      <div class="info-row">
        <span class="label">Data de Início:</span>
        <span class="value">${startDate}</span>
      </div>
    </div>

    <div class="total-box">
      <p style="margin: 0; font-size: 14px;">VALOR DA ASSINATURA</p>
      <h2>R$ ${plan.price.toFixed(2).replace(".", ",")}</h2>
      <p style="margin: 0; font-size: 12px;">${plan.billing_frequency === "monthly" ? "por mês" : plan.billing_frequency === "quarterly" ? "por trimestre" : "pagamento único"}</p>
    </div>

    <div class="stamp">
      ✓ ASSINATURA ATIVA
    </div>

    <div class="footer">
      <p><strong>Documento gerado em:</strong> ${new Date().toLocaleString("pt-BR")}</p>
      <p>Este é um comprovante válido de assinatura de serviços</p>
      <p>Código de Verificação: ${subscription.id}</p>
    </div>
  </div>
</body>
</html>
  `;
};

// Função auxiliar para converter número em extenso (simplificado)
const extenso = (valor: number): string => {
  // Implementação simplificada
  let parteInteira = Math.floor(valor);
  const parteCentavos = Math.round((valor - parteInteira) * 100);
  
  const unidades = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
  const dezenas = ["", "dez", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
  const centenas = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];
  
  let resultado = "";
  
  if (parteInteira >= 100) {
    resultado += centenas[Math.floor(parteInteira / 100)] + " ";
    parteInteira = parteInteira % 100;
  }
  
  if (parteInteira >= 10) {
    resultado += dezenas[Math.floor(parteInteira / 10)] + " ";
    parteInteira = parteInteira % 10;
  }
  
  if (parteInteira > 0) {
    resultado += unidades[parteInteira] + " ";
  }
  
  resultado += parteInteira === 1 ? "real" : "reais";
  
  if (parteCentavos > 0) {
    resultado += " e " + parteCentavos + " centavos";
  }
  
  return resultado.trim();
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { subscriptionId, documentType }: DocumentRequest = await req.json();

    console.log(`Generating ${documentType} for subscription ${subscriptionId}`);

    // Buscar dados da assinatura
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("id", subscriptionId)
      .single();

    if (subError) throw subError;

    // Buscar dados do cliente
    const { data: customer, error: custError } = await supabase
      .from("customers")
      .select("*")
      .eq("id", subscription.customer_id)
      .single();

    if (custError) throw custError;

    // Buscar dados do plano
    const { data: plan, error: planError } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", subscription.plan_id)
      .single();

    if (planError) throw planError;

    // Buscar dados da empresa
    const { data: business, error: bizError } = await supabase
      .from("business_settings")
      .select("*")
      .eq("user_id", subscription.user_id)
      .single();

    if (bizError) throw bizError;

    const data = { business, customer, plan, subscription };

    // Gerar HTML apropriado
    const html = documentType === "contract" 
      ? generateContractHTML(data)
      : generateReceiptHTML(data);

    console.log(`${documentType} generated successfully`);

    return new Response(html, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
      },
    });

  } catch (error: any) {
    console.error("Error generating document:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
