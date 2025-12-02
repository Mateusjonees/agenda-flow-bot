// Evolution API Client - Sistema Foguete
// Integração com WhatsApp via Evolution API v2.3.6

const EVOLUTION_API_URL = import.meta.env.VITE_EVOLUTION_API_URL || 'http://72.60.155.81:8080';
const EVOLUTION_API_KEY = import.meta.env.VITE_EVOLUTION_API_KEY || 'vh123A1SkFhtjP2rwTBdUSqr0sKcpgTztuwWNaCurfA=';
const INSTANCE_NAME = import.meta.env.VITE_EVOLUTION_INSTANCE_NAME || 'sistema-foguete';

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
  private baseUrl: string;
  private apiKey: string;
  private instance: string;

  constructor() {
    this.baseUrl = EVOLUTION_API_URL;
    this.apiKey = EVOLUTION_API_KEY;
    this.instance = INSTANCE_NAME;
  }

  private async request(endpoint: string, method: string = 'GET', body?: any): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'apikey': this.apiKey,
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
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
