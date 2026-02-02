import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";
import { logEmailSent } from "../_shared/email-logger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReportData {
  date: string;
  payments: {
    pix: number;
    card: number;
    cash: number;
    total: number;
  };
  services: Array<{
    title: string;
    customer: string;
    amount: number;
    payment_method: string;
  }>;
  expenses: Array<{
    description: string;
    amount: number;
    category: string;
  }>;
  balance: number;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const generateHTMLReport = (data: ReportData): string => {
  const servicesHTML = data.services.length > 0
    ? data.services.map(s => `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px 8px;">
            <strong>${s.title}</strong><br/>
            <small style="color: #6b7280;">${s.customer}</small><br/>
            <small style="color: #6b7280; text-transform: capitalize;">Pag: ${s.payment_method}</small>
          </td>
          <td style="padding: 12px 8px; text-align: right; color: #10b981; font-weight: bold;">
            ${formatCurrency(s.amount)}
          </td>
        </tr>
      `).join("")
    : '<tr><td colspan="2" style="padding: 20px; text-align: center; color: #6b7280;">Nenhum serviço realizado</td></tr>';

  const expensesHTML = data.expenses.length > 0
    ? data.expenses.map(e => `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px 8px;">
            <strong>${e.description}</strong><br/>
            <small style="color: #6b7280;">${e.category}</small>
          </td>
          <td style="padding: 12px 8px; text-align: right; color: #ef4444; font-weight: bold;">
            -${formatCurrency(e.amount)}
          </td>
        </tr>
      `).join("")
    : '<tr><td colspan="2" style="padding: 20px; text-align: center; color: #6b7280;">Nenhuma despesa registrada</td></tr>';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Fechamento do Dia - ${data.date}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 800px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
        <h1 style="margin: 0 0 10px 0; font-size: 32px;">Fechamento do Dia</h1>
        <p style="margin: 0; font-size: 18px; opacity: 0.9;">${data.date}</p>
      </div>

      <!-- Recebimentos por Método -->
      <div style="background: #f9fafb; padding: 25px; border-radius: 10px; margin-bottom: 25px;">
        <h2 style="margin: 0 0 20px 0; color: #374151; font-size: 20px;">Recebimentos por Método</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px; text-align: center; border-right: 1px solid #e5e7eb;">
              <div style="color: #6b7280; font-size: 14px; margin-bottom: 5px;">Pix</div>
              <div style="color: #667eea; font-size: 24px; font-weight: bold;">${formatCurrency(data.payments.pix)}</div>
            </td>
            <td style="padding: 10px; text-align: center; border-right: 1px solid #e5e7eb;">
              <div style="color: #6b7280; font-size: 14px; margin-bottom: 5px;">Cartão</div>
              <div style="color: #667eea; font-size: 24px; font-weight: bold;">${formatCurrency(data.payments.card)}</div>
            </td>
            <td style="padding: 10px; text-align: center; border-right: 1px solid #e5e7eb;">
              <div style="color: #6b7280; font-size: 14px; margin-bottom: 5px;">Dinheiro</div>
              <div style="color: #667eea; font-size: 24px; font-weight: bold;">${formatCurrency(data.payments.cash)}</div>
            </td>
            <td style="padding: 10px; text-align: center;">
              <div style="color: #6b7280; font-size: 14px; margin-bottom: 5px;">Total</div>
              <div style="color: #10b981; font-size: 28px; font-weight: bold;">${formatCurrency(data.payments.total)}</div>
            </td>
          </tr>
        </table>
      </div>

      <!-- Serviços Realizados -->
      <div style="background: white; padding: 25px; border-radius: 10px; margin-bottom: 25px; border: 1px solid #e5e7eb;">
        <h2 style="margin: 0 0 15px 0; color: #374151; font-size: 20px;">Serviços Realizados (${data.services.length})</h2>
        <table style="width: 100%; border-collapse: collapse;">
          ${servicesHTML}
        </table>
      </div>

      <!-- Despesas -->
      <div style="background: white; padding: 25px; border-radius: 10px; margin-bottom: 25px; border: 1px solid #e5e7eb;">
        <h2 style="margin: 0 0 15px 0; color: #374151; font-size: 20px;">Despesas (${data.expenses.length})</h2>
        <table style="width: 100%; border-collapse: collapse;">
          ${expensesHTML}
        </table>
      </div>

      <!-- Saldo Final -->
      <div style="background: ${data.balance >= 0 ? '#ecfdf5' : '#fef2f2'}; padding: 30px; border-radius: 10px; border: 2px solid ${data.balance >= 0 ? '#10b981' : '#ef4444'};">
        <table style="width: 100%;">
          <tr>
            <td style="font-size: 24px; font-weight: bold; color: #374151;">Saldo do Dia</td>
            <td style="text-align: right; font-size: 36px; font-weight: bold; color: ${data.balance >= 0 ? '#10b981' : '#ef4444'};">
              ${formatCurrency(data.balance)}
            </td>
          </tr>
        </table>
      </div>

      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
        <p>Este relatório foi gerado automaticamente em ${new Date().toLocaleString("pt-BR")}</p>
      </div>
    </body>
    </html>
  `;
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
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

    const { reportData, userEmail } = await req.json() as {
      reportData: ReportData;
      userEmail: string;
    };

    console.log("Gerando relatório para:", userEmail, "Data:", reportData.date);

    // Gerar HTML do relatório
    const htmlContent = generateHTMLReport(reportData);

    // Enviar por email usando Resend API
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY não configurado");
    }

    const emailSubject = `Fechamento do Dia - ${reportData.date}`;
    
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Gestão Financeira <onboarding@resend.dev>",
        to: [userEmail],
        subject: emailSubject,
        html: htmlContent,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      
      // Log failed email
      await logEmailSent({
        user_id: user.id,
        email_type: "daily_report",
        recipient_email: userEmail,
        subject: emailSubject,
        status: "failed",
        error_message: errorText,
        metadata: { date: reportData.date },
      });
      
      throw new Error(`Erro ao enviar email: ${errorText}`);
    }

    const emailResult = await emailResponse.json();
    console.log("Email enviado com sucesso:", emailResult);
    
    // Log successful email
    await logEmailSent({
      user_id: user.id,
      email_type: "daily_report",
      recipient_email: userEmail,
      subject: emailSubject,
      status: "sent",
      resend_email_id: emailResult.id,
      metadata: { date: reportData.date },
    });

    // TODO: Implementar envio via WhatsApp
    // Requer integração com WhatsApp Business API
    // Pode usar serviços como Twilio, MessageBird, etc.
    /*
    const whatsappMessage = `
🗓️ *Fechamento do Dia - ${reportData.date}*

💰 *Recebimentos:*
Pix: ${formatCurrency(reportData.payments.pix)}
Cartão: ${formatCurrency(reportData.payments.card)}
Dinheiro: ${formatCurrency(reportData.payments.cash)}
*Total:* ${formatCurrency(reportData.payments.total)}

📊 Serviços: ${reportData.services.length}
📉 Despesas: ${reportData.expenses.length}

💵 *Saldo do Dia:* ${formatCurrency(reportData.balance)}

✅ Relatório completo enviado por e-mail!
    `;
    
    // Enviar WhatsApp aqui
    */

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Relatório gerado e enviado com sucesso",
        emailResult 
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
    console.error("Erro ao gerar relatório:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Erro ao gerar relatório" 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
});