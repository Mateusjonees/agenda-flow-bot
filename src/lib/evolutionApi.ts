// Evolution API Client - Sistema Foguete
// Integração com WhatsApp via Evolution API v2.3.6
// Usa Supabase Edge Function como proxy para evitar Mixed Content (HTTPS → HTTP)

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://pnwelorcrncqltqiyxwx.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBud2Vsb3Jjcm5jcWx0cWl5eHd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNTIyNjAsImV4cCI6MjA3NzkyODI2MH0.Y6xkoKV4V8tAXqceJfnZ8pfWOTn30jUw9paGoPUcVog';
const INSTANCE_NAME = import.meta.env.VITE_EVOLUTION_INSTANCE_NAME || 'sistema-foguete';

// URL da Edge Function proxy
const EVOLUTION_PROXY_URL = `${SUPABASE_URL}/functions/v1/evolution-api-proxy`;

interface SendMessageParams {
  number: string; // Número com DDI, ex: 5511999999999
  text: string;
  delay?: number;
}

interface SendMediaParams {
  number: string;
  mediaUrl: string;
  caption?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'document';
}

interface EvolutionApiResponse {
  status: number;
  message?: string;
  key?: {
    id: string;
    remoteJid: string;
  };
}

class EvolutionApiClient {
  private proxyUrl: string;
  private supabaseKey: string;
  private instance: string;

  constructor() {
    this.proxyUrl = EVOLUTION_PROXY_URL;
    this.supabaseKey = SUPABASE_ANON_KEY;
    this.instance = INSTANCE_NAME;
  }

  private async request(endpoint: string, method: string = 'GET', body?: any): Promise<any> {
    // Fazer requisição via Edge Function proxy
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.supabaseKey}`,
      'apikey': this.supabaseKey,
    };

    const proxyPayload = {
      endpoint,
      method,
      body,
    };

    try {
      const response = await fetch(this.proxyUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(proxyPayload),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || data.error || `HTTP ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('Evolution API Error:', error);
      throw error;
    }
  }

  // Enviar mensagem de texto
  async sendText({ number, text, delay = 1000 }: SendMessageParams): Promise<EvolutionApiResponse> {
    const endpoint = `/message/sendText/${this.instance}`;
    
    const payload = {
      number: number.replace(/\D/g, ''), // Remove caracteres não numéricos
      text,
      delay,
    };

    return await this.request(endpoint, 'POST', payload);
  }

  // Enviar mídia (imagem, vídeo, documento)
  async sendMedia({ number, mediaUrl, caption, mediaType = 'image' }: SendMediaParams): Promise<EvolutionApiResponse> {
    const endpoint = `/message/sendMedia/${this.instance}`;
    
    const payload = {
      number: number.replace(/\D/g, ''),
      mediatype: mediaType,
      media: mediaUrl,
      caption: caption || '',
    };

    return await this.request(endpoint, 'POST', payload);
  }

  // Enviar mensagem com botões
  async sendButtons(number: string, text: string, buttons: string[]): Promise<EvolutionApiResponse> {
    const endpoint = `/message/sendButtons/${this.instance}`;
    
    const payload = {
      number: number.replace(/\D/g, ''),
      text,
      buttons: buttons.map((label, index) => ({
        id: `btn_${index + 1}`,
        displayText: label,
      })),
    };

    return await this.request(endpoint, 'POST', payload);
  }

  // Buscar status da instância
  async getInstanceStatus(): Promise<any> {
    const endpoint = `/instance/connectionState/${this.instance}`;
    return await this.request(endpoint, 'GET');
  }

  // Buscar QR Code (se desconectado)
  async getQrCode(): Promise<any> {
    const endpoint = `/instance/connect/${this.instance}`;
    return await this.request(endpoint, 'GET');
  }

  // Formatar número para WhatsApp (adicionar @s.whatsapp.net)
  formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    return `${cleaned}@s.whatsapp.net`;
  }

  // Verificar se número está no WhatsApp
  async checkNumberExists(number: string): Promise<boolean> {
    try {
      const endpoint = `/chat/whatsappNumbers/${this.instance}`;
      const payload = {
        numbers: [number.replace(/\D/g, '')],
      };
      
      const response = await this.request(endpoint, 'POST', payload);
      return response[0]?.exists || false;
    } catch (error) {
      console.error('Error checking number:', error);
      return false;
    }
  }
}

// Exportar instância singleton
export const evolutionApi = new EvolutionApiClient();

// Exportar tipos
export type { SendMessageParams, SendMediaParams, EvolutionApiResponse };
