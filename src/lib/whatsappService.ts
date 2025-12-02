import { evolutionApi } from '@/lib/evolutionApi';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface SendAppointmentReminderParams {
  appointmentId: string;
  customerPhone: string;
  customerName: string;
  serviceName: string;
  appointmentDate: Date;
  appointmentTime: string;
}

interface SendWelcomeMessageParams {
  customerPhone: string;
  customerName: string;
}

export class WhatsAppService {
  
  /**
   * Enviar lembrete de agendamento
   */
  static async sendAppointmentReminder({
    appointmentId,
    customerPhone,
    customerName,
    serviceName,
    appointmentDate,
    appointmentTime,
  }: SendAppointmentReminderParams): Promise<boolean> {
    try {
      // Formatar data
      const formattedDate = new Intl.DateTimeFormat('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }).format(appointmentDate);

      // Mensagem personalizada
      const message = `🚀 *Sistema Foguete* - Lembrete de Agendamento

Olá, *${customerName}*! 👋

📅 *Seu agendamento está confirmado:*

🔹 Serviço: ${serviceName}
🔹 Data: ${formattedDate}
🔹 Horário: ${appointmentTime}

⏰ *Não esqueça!* Estamos esperando você.

Para reagendar ou cancelar, entre em contato conosco.

_Mensagem automática - Sistema Foguete_`;

      // Enviar via Evolution API
      const response = await evolutionApi.sendText({
        number: customerPhone,
        text: message,
      });

      // Atualizar no banco de dados se sucesso (status 200-299 ou tem key)
      const isSuccess = (response.status >= 200 && response.status < 300) || response.key;
      
      if (isSuccess) {
        await supabase
          .from('appointments')
          .update({
            whatsapp_reminder_sent: true,
            whatsapp_reminder_sent_at: new Date().toISOString(),
            whatsapp_message_id: response.key?.id || null,
          })
          .eq('id', appointmentId);

        // Atualizar última mensagem do cliente
        await supabase
          .from('customers')
          .update({
            last_whatsapp_message: new Date().toISOString(),
          })
          .eq('phone', customerPhone);

        return true;
      }

      return false;
    } catch (error) {
      console.error('Erro ao enviar lembrete WhatsApp:', error);
      toast({
        title: 'Erro ao enviar WhatsApp',
        description: 'Não foi possível enviar o lembrete via WhatsApp.',
        variant: 'destructive',
      });
      return false;
    }
  }

  /**
   * Enviar mensagem de boas-vindas para novo cliente
   */
  static async sendWelcomeMessage({
    customerPhone,
    customerName,
  }: SendWelcomeMessageParams): Promise<boolean> {
    try {
      const message = `🎉 *Bem-vindo ao Sistema Foguete!*

Olá, *${customerName}*! 👋

Estamos muito felizes em tê-lo(a) conosco! 🚀

Agora você receberá lembretes automáticos dos seus agendamentos por aqui.

📱 Salve nosso contato para não perder nenhuma novidade!

_Equipe Sistema Foguete_`;

      const response = await evolutionApi.sendText({
        number: customerPhone,
        text: message,
      });

      return response.status === 200 || !!response.key;
    } catch (error) {
      console.error('Erro ao enviar mensagem de boas-vindas:', error);
      return false;
    }
  }

  /**
   * Verificar se número está no WhatsApp
   */
  static async verifyWhatsAppNumber(phone: string): Promise<boolean> {
    try {
      const exists = await evolutionApi.checkNumberExists(phone);
      
      if (exists) {
        // Atualizar no banco
        await supabase
          .from('customers')
          .update({ whatsapp_verified: true })
          .eq('phone', phone);
      }
      
      return exists;
    } catch (error) {
      console.error('Erro ao verificar número WhatsApp:', error);
      return false;
    }
  }

  /**
   * Enviar mensagem personalizada
   */
  static async sendCustomMessage(
    phone: string,
    message: string
  ): Promise<boolean> {
    try {
      const response = await evolutionApi.sendText({
        number: phone,
        text: message,
      });

      return response.status === 200 || !!response.key;
    } catch (error) {
      console.error('Erro ao enviar mensagem personalizada:', error);
      return false;
    }
  }

  /**
   * Enviar imagem/documento
   */
  static async sendMedia(
    phone: string,
    mediaUrl: string,
    caption?: string,
    type: 'image' | 'document' = 'image'
  ): Promise<boolean> {
    try {
      const response = await evolutionApi.sendMedia({
        number: phone,
        mediaUrl,
        caption,
        mediaType: type,
      });

      return response.status === 200 || !!response.key;
    } catch (error) {
      console.error('Erro ao enviar mídia WhatsApp:', error);
      return false;
    }
  }

  /**
   * Verificar status da conexão Evolution API
   */
  static async checkConnection(): Promise<boolean> {
    try {
      const status = await evolutionApi.getInstanceStatus();
      return status.state === 'open';
    } catch (error) {
      console.error('Erro ao verificar conexão Evolution API:', error);
      return false;
    }
  }

  /**
   * Formatar número brasileiro para WhatsApp
   * Exemplo: (11) 99999-9999 → 5511999999999
   */
  static formatPhoneToBrazilian(phone: string): string {
    // Remove tudo que não é número
    const cleaned = phone.replace(/\D/g, '');
    
    // Se já tem DDI (55), retorna
    if (cleaned.startsWith('55') && cleaned.length >= 12) {
      return cleaned;
    }
    
    // Se tem 11 dígitos (DDD + número), adiciona DDI
    if (cleaned.length === 11) {
      return `55${cleaned}`;
    }
    
    // Se tem 10 dígitos (DDD + número sem 9), adiciona 9 e DDI
    if (cleaned.length === 10) {
      return `55${cleaned.substring(0, 2)}9${cleaned.substring(2)}`;
    }
    
    return cleaned;
  }
}
