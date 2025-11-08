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

const extenso = (valor: number): string => {
  // Implementação simplificada
  const unidades = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
  const dezenas = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
  const especiais = ["dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];

  if (valor === 0) return "zero";
  if (valor < 10) return unidades[valor];
  if (valor >= 10 && valor < 20) return especiais[valor - 10];
  if (valor >= 20 && valor < 100) {
    const dezena = Math.floor(valor / 10);
    const unidade = valor % 10;
    return dezenas[dezena] + (unidade > 0 ? " e " + unidades[unidade] : "");
  }
  if (valor >= 100 && valor < 1000) {
    const centena = Math.floor(valor / 100);
    const resto = valor % 100;
    const centenas = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];
    if (valor === 100) return "cem";
    return centenas[centena] + (resto > 0 ? " e " + extenso(resto) : "");
  }
  return "valor muito alto";
};

const generateContractHTML = (data: any): string => {
  const { subscription, customer, plan, businessSettings } = data;
  const valorExtenso = extenso(Math.floor(plan.price));

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Contrato de Assinatura</title>
      <style>
        body {
          font-family: 'Times New Roman', Times, serif;
          line-height: 1.6;
          color: #000;
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 20px;
          background: #fff;
        }
        h1 {
          text-align: center;
          text-transform: uppercase;
          margin-bottom: 30px;
          font-size: 18px;
          border-bottom: 2px solid #000;
          padding-bottom: 10px;
        }
        h2 {
          font-size: 14px;
          margin-top: 25px;
          margin-bottom: 10px;
          text-transform: uppercase;
        }
        p {
          text-align: justify;
          margin-bottom: 15px;
          font-size: 12px;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
        }
        .section {
          margin-bottom: 20px;
        }
        .signature {
          margin-top: 60px;
          border-top: 1px solid #000;
          padding-top: 5px;
          text-align: center;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        table td {
          padding: 8px;
          border: 1px solid #ddd;
        }
        .highlight {
          background: #f0f0f0;
          padding: 15px;
          border-left: 4px solid #667eea;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Contrato de Prestação de Serviços por Assinatura</h1>
      </div>

      <div class="section">
        <h2>Partes Contratantes</h2>
        <p><strong>CONTRATANTE:</strong> ${customer.name}, inscrito no CPF ${customer.cpf || "não informado"}, residente e domiciliado à ${customer.address || "não informado"}, telefone ${customer.phone}, e-mail ${customer.email || "não informado"}.</p>
        <p><strong>CONTRATADA:</strong> ${businessSettings.business_name || "Estabelecimento"}, inscrito no CNPJ/CPF ${businessSettings.document || "não informado"}, com sede à ${businessSettings.address || "não informado"}, telefone ${businessSettings.whatsapp_number || "não informado"}, e-mail ${businessSettings.email || "não informado"}.</p>
      </div>

      <div class="section">
        <h2>Do Objeto</h2>
        <p>O presente contrato tem por objeto a prestação de serviços conforme descrito no plano <strong>"${plan.name}"</strong>, que será realizado pela CONTRATADA em favor da CONTRATANTE, mediante o pagamento de assinatura conforme especificado neste instrumento.</p>
        
        <div class="highlight">
          <p><strong>Plano Contratado:</strong> ${plan.name}</p>
          <p><strong>Descrição:</strong> ${plan.description || "Conforme especificado nos serviços inclusos"}</p>
          <p><strong>Valor da Assinatura:</strong> ${formatCurrency(plan.price)} (${valorExtenso} reais)</p>
          <p><strong>Frequência de Cobrança:</strong> ${plan.billing_frequency === "monthly" ? "Mensal" : plan.billing_frequency === "quarterly" ? "Trimestral" : plan.billing_frequency}</p>
        </div>
      </div>

      <div class="section">
        <h2>Serviços Inclusos</h2>
        <p>A assinatura inclui os seguintes serviços:</p>
        ${Array.isArray(plan.services) && plan.services.length > 0 ? `
          <table>
            <tr style="background: #f5f5f5; font-weight: bold;">
              <td>Serviço</td>
              <td style="text-align: center;">Quantidade</td>
              <td style="text-align: center;">Frequência</td>
            </tr>
            ${plan.services.map((s: any) => `
              <tr>
                <td>${s.service || "Serviço"}</td>
                <td style="text-align: center;">${s.quantity || 1}</td>
                <td style="text-align: center;">${s.frequency || "mês"}</td>
              </tr>
            `).join("")}
          </table>
        ` : "<p>Conforme descrito no plano contratado.</p>"}
      </div>

      <div class="section">
        <h2>Do Prazo</h2>
        <p>O presente contrato terá início em <strong>${new Date(subscription.start_date).toLocaleDateString("pt-BR")}</strong> e vigorará por prazo indeterminado, podendo ser cancelado por qualquer das partes mediante comunicação prévia de 30 (trinta) dias.</p>
      </div>

      <div class="section">
        <h2>Do Pagamento</h2>
        <p>O pagamento deverá ser efetuado ${plan.billing_frequency === "monthly" ? "mensalmente" : "trimestralmente"}, sempre no dia <strong>${new Date(subscription.next_billing_date).getDate()}</strong> de cada ${plan.billing_frequency === "monthly" ? "mês" : "trimestre"}, através dos meios de pagamento disponibilizados pela CONTRATADA.</p>
        <p>O não pagamento na data de vencimento implicará em suspensão imediata dos serviços, sem prejuízo das demais cominações legais.</p>
      </div>

      <div class="section">
        <h2>Do Cancelamento</h2>
        <p>Qualquer das partes poderá solicitar o cancelamento da assinatura mediante comunicação com antecedência mínima de 30 (trinta) dias. Em caso de cancelamento, não haverá devolução de valores já pagos referentes ao período em curso.</p>
      </div>

      <div class="section">
        <h2>Das Obrigações da Contratada</h2>
        <p>A CONTRATADA se compromete a:</p>
        <p>a) Prestar os serviços com qualidade e profissionalismo;</p>
        <p>b) Manter sigilo sobre informações do CONTRATANTE;</p>
        <p>c) Cumprir os horários e prazos acordados;</p>
        <p>d) Informar com antecedência qualquer alteração nos serviços.</p>
      </div>

      <div class="section">
        <h2>Das Obrigações da Contratante</h2>
        <p>O CONTRATANTE se compromete a:</p>
        <p>a) Efetuar os pagamentos nas datas acordadas;</p>
        <p>b) Comparecer nos horários agendados;</p>
        <p>c) Comunicar eventuais cancelamentos com antecedência mínima de 24 horas;</p>
        <p>d) Fornecer informações verdadeiras e atualizadas.</p>
      </div>

      <div class="section">
        <h2>Disposições Finais</h2>
        <p>Este contrato obriga as partes e seus sucessores, podendo ser aditado mediante acordo entre as partes. Fica eleito o foro da comarca do domicílio da CONTRATADA para dirimir quaisquer questões oriundas do presente contrato.</p>
      </div>

      <p style="margin-top: 40px; text-align: center;">
        ${businessSettings.address || "[Cidade]"}, ${new Date().toLocaleDateString("pt-BR")}
      </p>

      <div style="margin-top: 60px;">
        <div class="signature" style="margin-bottom: 40px;">
          _________________________________________________<br>
          <strong>${businessSettings.business_name || "CONTRATADA"}</strong>
        </div>
        <div class="signature">
          _________________________________________________<br>
          <strong>${customer.name} - CONTRATANTE</strong><br>
          CPF: ${customer.cpf || "_______________"}
        </div>
      </div>
    </body>
    </html>
  `;
};

const generateReceiptHTML = (data: any): string => {
  const { subscription, customer, plan, businessSettings } = data;

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Comprovante de Pagamento</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 20px;
          background: #f9fafb;
        }
        .receipt {
          background: white;
          padding: 40px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 2px solid #667eea;
        }
        .header h1 {
          color: #667eea;
          margin: 0 0 10px 0;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 15px;
          padding: 10px;
          background: #f9fafb;
          border-radius: 5px;
        }
        .info-label {
          font-weight: bold;
          color: #6b7280;
        }
        .info-value {
          color: #1f2937;
        }
        .total {
          margin-top: 30px;
          padding: 20px;
          background: #ecfdf5;
          border-radius: 10px;
          border: 2px solid #10b981;
          text-align: center;
        }
        .total .amount {
          font-size: 36px;
          font-weight: bold;
          color: #10b981;
          margin: 10px 0;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          color: #6b7280;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="header">
          <h1>✓ Comprovante de Pagamento</h1>
          <p style="margin: 0; color: #6b7280;">${businessSettings.business_name || "Estabelecimento"}</p>
          ${businessSettings.email ? `<p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;">${businessSettings.email}</p>` : ""}
        </div>

        <div style="margin-bottom: 30px;">
          <h2 style="color: #374151; font-size: 18px; margin-bottom: 15px;">Dados do Pagamento</h2>
          
          <div class="info-row">
            <span class="info-label">Cliente:</span>
            <span class="info-value">${customer.name}</span>
          </div>
          
          <div class="info-row">
            <span class="info-label">CPF:</span>
            <span class="info-value">${customer.cpf || "Não informado"}</span>
          </div>
          
          <div class="info-row">
            <span class="info-label">Data do Pagamento:</span>
            <span class="info-value">${new Date().toLocaleDateString("pt-BR")}</span>
          </div>
          
          <div class="info-row">
            <span class="info-label">Referência:</span>
            <span class="info-value">Assinatura - ${plan.name}</span>
          </div>
          
          <div class="info-row">
            <span class="info-label">Período:</span>
            <span class="info-value">
              ${new Date(subscription.start_date).toLocaleDateString("pt-BR")} - 
              ${new Date(subscription.next_billing_date).toLocaleDateString("pt-BR")}
            </span>
          </div>
        </div>

        <div style="margin-bottom: 30px;">
          <h2 style="color: #374151; font-size: 18px; margin-bottom: 15px;">Detalhes da Assinatura</h2>
          
          <div class="info-row">
            <span class="info-label">Plano:</span>
            <span class="info-value">${plan.name}</span>
          </div>
          
          <div class="info-row">
            <span class="info-label">Descrição:</span>
            <span class="info-value">${plan.description || "Conforme contrato"}</span>
          </div>
          
          <div class="info-row">
            <span class="info-label">Frequência:</span>
            <span class="info-value">
              ${plan.billing_frequency === "monthly" ? "Mensal" : plan.billing_frequency === "quarterly" ? "Trimestral" : plan.billing_frequency}
            </span>
          </div>
        </div>

        <div class="total">
          <p style="margin: 0; color: #6b7280; font-size: 14px;">Valor Pago</p>
          <div class="amount">${formatCurrency(plan.price)}</div>
          <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 12px;">Pagamento confirmado e processado</p>
        </div>

        <div class="footer">
          <p>Este é um comprovante válido de pagamento.</p>
          <p>Emitido em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}</p>
          ${businessSettings.address ? `<p style="margin-top: 10px;">${businessSettings.address}</p>` : ""}
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

    const { subscriptionId, documentType } = (await req.json()) as {
      subscriptionId: string;
      documentType: "contract" | "receipt";
    };

    console.log(`Enviando documento de assinatura por email: ${documentType}`, subscriptionId);

    // Buscar assinatura
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("id", subscriptionId)
      .eq("user_id", user.id)
      .single();

    if (subError || !subscription) {
      throw new Error("Assinatura não encontrada");
    }

    // Buscar cliente
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("*")
      .eq("id", subscription.customer_id)
      .single();

    if (customerError || !customer) {
      throw new Error("Cliente não encontrado");
    }

    if (!customer.email) {
      throw new Error("Cliente não possui email cadastrado");
    }

    // Buscar plano
    const { data: plan, error: planError } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", subscription.plan_id)
      .single();

    if (planError || !plan) {
      throw new Error("Plano não encontrado");
    }

    // Buscar configurações do negócio
    const { data: businessSettings, error: settingsError } = await supabase
      .from("business_settings")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (settingsError || !businessSettings) {
      throw new Error("Configurações do negócio não encontradas");
    }

    if (!businessSettings.email) {
      throw new Error("Configure seu email nas Configurações antes de enviar documentos");
    }

    const data = { subscription, customer, plan, businessSettings };

    // Gerar HTML do documento
    const htmlContent =
      documentType === "contract"
        ? generateContractHTML(data)
        : generateReceiptHTML(data);

    // Enviar email usando Resend API
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY não configurado");
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${businessSettings.business_name} <${businessSettings.email}>`,
        to: [customer.email],
        subject:
          documentType === "contract"
            ? `Contrato de Assinatura - ${plan.name}`
            : `Comprovante de Pagamento - ${plan.name}`,
        html: htmlContent,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("Erro ao enviar email:", errorText);
      throw new Error("Erro ao enviar email");
    }

    const emailData = await emailResponse.json();
    console.log("Email enviado com sucesso:", emailData);

    // Registrar no histórico
    await supabase.from("document_history").insert({
      user_id: user.id,
      document_type: documentType,
      related_type: "subscription",
      related_id: subscriptionId,
      recipient_email: customer.email,
      recipient_name: customer.name,
      status: "sent",
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Documento enviado com sucesso",
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Erro ao enviar documento:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Erro ao enviar documento",
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
