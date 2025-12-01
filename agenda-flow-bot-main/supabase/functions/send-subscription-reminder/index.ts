import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReminderRequest {
  subscriptionId: string;
  userId: string;
  userEmail: string;
  userName: string;
  daysUntilExpiration: number;
  nextBillingDate: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      subscriptionId, 
      userId, 
      userEmail, 
      userName, 
      daysUntilExpiration,
      nextBillingDate 
    }: ReminderRequest = await req.json();

    console.log(`Sending subscription reminder to ${userEmail} for subscription ${subscriptionId}`);

    const formattedDate = new Date(nextBillingDate).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              border-radius: 10px 10px 0 0;
              text-align: center;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .button {
              display: inline-block;
              background: #667eea;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 6px;
              margin-top: 20px;
              font-weight: 600;
            }
            .alert {
              background: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              color: #6b7280;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 style="margin: 0;">⏰ Lembrete de Renovação</h1>
          </div>
          <div class="content">
            <p>Olá <strong>${userName}</strong>,</p>
            
            <div class="alert">
              <strong>⚠️ Atenção:</strong> Sua assinatura vence em <strong>${daysUntilExpiration} dias</strong>!
            </div>
            
            <p>Sua assinatura está próxima do vencimento e será renovada automaticamente em:</p>
            
            <p style="text-align: center; font-size: 24px; font-weight: bold; color: #667eea; margin: 20px 0;">
              ${formattedDate}
            </p>
            
            <p>Para garantir a continuidade dos seus serviços sem interrupções:</p>
            
            <ul>
              <li>✅ Certifique-se de que seu método de pagamento está ativo</li>
              <li>✅ Verifique se há saldo ou limite disponível</li>
              <li>✅ Atualize seus dados de pagamento se necessário</li>
            </ul>
            
            <p style="text-align: center;">
              <a href="${Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".lovableproject.com") || ""}/planos" class="button">
                Gerenciar Minha Assinatura
              </a>
            </p>
            
            <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
              Se você não deseja renovar sua assinatura, acesse o painel e cancele antes da data de renovação.
            </p>
          </div>
          
          <div class="footer">
            <p>Este é um email automático. Por favor, não responda.</p>
            <p>© ${new Date().getFullYear()} - Todos os direitos reservados</p>
          </div>
        </body>
      </html>
    `;

    const { data, error } = await resend.emails.send({
      from: "Sistema <onboarding@resend.dev>", // Altere para seu domínio verificado
      to: [userEmail],
      subject: `⏰ Sua assinatura vence em ${daysUntilExpiration} dias`,
      html: emailHtml,
    });

    if (error) {
      console.error("Error sending email:", error);
      throw error;
    }

    console.log("Subscription reminder email sent successfully:", data);

    // Registrar o envio do lembrete
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { error: logError } = await supabaseClient
      .from("subscription_reminders")
      .insert({
        subscription_id: subscriptionId,
        user_id: userId,
        sent_at: new Date().toISOString(),
        days_before_expiration: daysUntilExpiration,
      });

    if (logError) {
      console.error("Error logging reminder:", logError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Reminder sent successfully",
        emailId: data?.id 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-subscription-reminder:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Error sending reminder",
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
