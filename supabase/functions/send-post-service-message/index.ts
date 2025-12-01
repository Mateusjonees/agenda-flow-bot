import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Encontrar agendamentos completados há 24 horas que ainda não receberam feedback
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const twentyFiveHoursAgo = new Date();
    twentyFiveHoursAgo.setHours(twentyFiveHoursAgo.getHours() - 25);

    const { data: completedAppointments, error: fetchError } = await supabaseClient
      .from("appointments")
      .select(`
        *,
        customers (
          id,
          name,
          phone,
          email
        ),
        business_settings (
          business_name,
          google_review_link,
          instagram_link,
          loyalty_enabled,
          coupon_enabled
        )
      `)
      .eq("status", "completed")
      .gte("end_time", twentyFiveHoursAgo.toISOString())
      .lte("end_time", twentyFourHoursAgo.toISOString())
      .limit(50);

    if (fetchError) {
      throw fetchError;
    }

    if (!completedAppointments || completedAppointments.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true,
          message: "No appointments need post-service messages" 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const results = [];

    for (const appointment of completedAppointments) {
      try {
        // Verificar se já existe review para este agendamento
        const { data: existingReview } = await supabaseClient
          .from("reviews")
          .select("id")
          .eq("appointment_id", appointment.id)
          .single();

        if (existingReview) {
          console.log(`Review already exists for appointment ${appointment.id}`);
          continue;
        }

        const customer = appointment.customers;
        const businessSettings = appointment.business_settings;
        const businessName = businessSettings?.business_name || "Estabelecimento";
        const googleReviewLink = businessSettings?.google_review_link || "";
        const instagramLink = businessSettings?.instagram_link || "";
        const loyaltyEnabled = businessSettings?.loyalty_enabled !== false;
        const couponEnabled = businessSettings?.coupon_enabled ?? false; // Desativado por padrão

        if (!customer || !customer.phone) {
          console.log(`No customer or phone for appointment ${appointment.id}`);
          continue;
        }

        // Gerar cupom de retorno APENAS se programa estiver ativado
        let coupon = null;
        let couponCode = "";
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        if (couponEnabled) {
          couponCode = `RETORNO${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
          
          const { data: couponData, error: couponError } = await supabaseClient
            .from("coupons")
            .insert({
              user_id: appointment.user_id,
              customer_id: customer.id,
              code: couponCode,
              discount_percentage: 10,
              expires_at: expiresAt.toISOString(),
              is_active: true
            })
            .select()
            .single();

          if (couponError) {
            console.error(`Error creating coupon for appointment ${appointment.id}:`, couponError);
          } else {
            coupon = couponData;
            console.log(`✅ Cupom gerado: ${couponCode}`);
          }
        } else {
          console.log(`ℹ️ Cupons desativados - pulando geração`);
        }

        // Buscar cartão fidelidade do cliente (se programa ativo)
        let loyaltyCard = null;
        if (loyaltyEnabled) {
          const { data } = await supabaseClient
            .from("loyalty_cards")
            .select("*")
            .eq("user_id", appointment.user_id)
            .eq("customer_id", customer.id)
            .single();
          loyaltyCard = data;
        }

        const loyaltyMessage = loyaltyCard 
          ? `\n\n🎁 *Cartão Fidelidade:* ${loyaltyCard.current_stamps}/${loyaltyCard.stamps_required} carimbos${loyaltyCard.current_stamps === loyaltyCard.stamps_required - 1 ? " - Próxima visita GRÁTIS! 🎉" : ""}`
          : "";

        // Links de avaliação (apenas se configurados)
        let reviewLinksMessage = "";
        if (googleReviewLink || instagramLink) {
          reviewLinksMessage = "\n\nDeixe sua avaliação:";
          if (googleReviewLink) {
            reviewLinksMessage += `\n📍 Google: ${googleReviewLink}`;
          }
          if (instagramLink) {
            reviewLinksMessage += `\n📸 Instagram: ${instagramLink}`;
          }
        }

        // Montar mensagem de WhatsApp
        const whatsappMessage = `
Olá ${customer.name}! 👋

Obrigado por escolher o *${businessName}*! 

Como foi sua experiência conosco? 
Sua opinião é muito importante! ⭐

Por favor, avalie nosso atendimento:
⭐⭐⭐⭐⭐
${reviewLinksMessage}
${coupon ? `\n\n🎉 *Cupom de Retorno:* ${couponCode}\n10% de desconto na próxima visita!\nVálido até ${new Date(expiresAt).toLocaleDateString("pt-BR")}` : ""}
${loyaltyMessage}

Esperamos vê-lo(a) em breve! 😊
        `.trim();

        // Enviar WhatsApp via send-whatsapp-message Edge Function
        if (customer.phone) {
          try {
            const sendWhatsAppUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-whatsapp-message`;
            const whatsappResponse = await fetch(sendWhatsAppUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
              },
              body: JSON.stringify({
                user_id: appointment.user_id,
                to: customer.phone,
                message_type: "text",
                content: whatsappMessage,
              }),
            });

            if (!whatsappResponse.ok) {
              const errorText = await whatsappResponse.text();
              console.error(`❌ Erro ao enviar WhatsApp para ${customer.phone}:`, errorText);
            } else {
              console.log(`✅ WhatsApp enviado com sucesso para ${customer.phone}`);
            }
          } catch (whatsappError: any) {
            console.error(`❌ Erro ao enviar WhatsApp:`, whatsappError.message);
          }
        }

        // Enviar também por email se disponível
        const resendApiKey = Deno.env.get("RESEND_API_KEY");
        
        console.log(`📧 Appointment ${appointment.id} - Cliente: ${customer.name}`);
        console.log(`RESEND_API_KEY: ${resendApiKey ? "✅" : "❌"}, Email: ${appointment.customers?.email || "❌"}`);
        
        if (!resendApiKey) {
          console.warn("⚠️ RESEND_API_KEY não configurado");
        } else if (appointment.customers?.email) {
          try {
            console.log(`📤 Enviando email pós-serviço para: ${appointment.customers.email}`);
            
            const emailResponse = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${resendApiKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: `${businessName} <onboarding@resend.dev>`,
                to: [appointment.customers.email],
                subject: `Como foi sua experiência no ${businessName}?`,
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Olá ${customer.name}! 👋</h2>
                    <p>Obrigado por escolher o <strong>${businessName}</strong>!</p>
                    <p>Como foi sua experiência conosco? Sua opinião é muito importante! ⭐</p>
                    
                    <div style="background: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
                      <p style="margin: 0;"><strong>Deixe sua avaliação:</strong></p>
                      <p style="font-size: 32px; margin: 10px 0;">⭐⭐⭐⭐⭐</p>
                    </div>

                    ${googleReviewLink || instagramLink ? `
                    <div style="margin: 20px 0;">
                      ${googleReviewLink ? `<a href="${googleReviewLink}" style="display: inline-block; background: #4285f4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-right: 10px;">Avaliar no Google</a>` : ''}
                      ${instagramLink ? `<a href="${instagramLink}" style="display: inline-block; background: #e4405f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Avaliar no Instagram</a>` : ''}
                    </div>
                    ` : ""}

                    ${coupon ? `
                    <div style="background: #10b981; color: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
                      <h3 style="margin: 0 0 10px 0;">🎉 Cupom de Retorno!</h3>
                      <p style="font-size: 24px; font-weight: bold; margin: 10px 0;">${couponCode}</p>
                      <p style="margin: 0;">10% de desconto na próxima visita!</p>
                      <p style="margin: 5px 0; font-size: 14px;">Válido até ${new Date(expiresAt).toLocaleDateString("pt-BR")}</p>
                    </div>
                    ` : ""}

                    ${loyaltyCard ? `
                    <div style="background: #667eea; color: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
                      <h3 style="margin: 0 0 10px 0;">🎁 Cartão Fidelidade</h3>
                      <p style="font-size: 32px; margin: 10px 0;">${loyaltyCard.current_stamps}/${loyaltyCard.stamps_required}</p>
                      <p style="margin: 0;">${loyaltyCard.current_stamps === loyaltyCard.stamps_required - 1 ? "Próxima visita GRÁTIS! 🎉" : `Faltam ${loyaltyCard.stamps_required - loyaltyCard.current_stamps} carimbos para ganhar uma visita grátis!`}</p>
                    </div>
                    ` : ""}

                    <p>Esperamos vê-lo(a) em breve! 😊</p>
                  </div>
                `,
              }),
            });

            if (!emailResponse.ok) {
              const errorText = await emailResponse.text();
              console.error("❌ Erro ao enviar email:", emailResponse.status, errorText);
            } else {
              const emailData = await emailResponse.json();
              console.log(`✅ Email enviado com sucesso para ${appointment.customers.email}:`, emailData);
            }
          } catch (emailError: any) {
            console.error("❌ Erro ao enviar email:", emailError.message);
          }
        } else {
          console.warn(`⚠️ Cliente sem email cadastrado`);
        }

        results.push({
          appointmentId: appointment.id,
          customerId: customer.id,
          success: true,
          couponGenerated: !!coupon,
        });

      } catch (error: any) {
        console.error(`Error processing appointment ${appointment.id}:`, error);
        results.push({
          appointmentId: appointment.id,
          success: false,
          error: error.message
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        appointmentsProcessed: completedAppointments.length,
        results: results
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in post-service message function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Error sending post-service messages",
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