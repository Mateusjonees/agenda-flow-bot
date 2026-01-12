/**
 * Facebook Pixel Tracking Hook
 * 
 * Este hook fornece funções para rastrear eventos do Facebook Pixel.
 * Eventos disponíveis (conforme documentação do Meta):
 * - PageView (automático)
 * - CompleteRegistration
 * - Lead
 * - Purchase
 * - Subscribe
 * - StartTrial
 * - InitiateCheckout
 * - AddPaymentInfo
 * - Schedule
 * - Contact
 * - Search
 * - ViewContent
 */

declare global {
  interface Window {
    fbq: (...args: unknown[]) => void;
    _fbq: unknown;
  }
}

interface PurchaseParams {
  value: number;
  currency?: string;
  content_name?: string;
  content_type?: string;
  content_ids?: string[];
}

interface SubscribeParams {
  value: number;
  currency?: string;
  predicted_ltv?: number;
}

interface StartTrialParams {
  value?: number;
  currency?: string;
  predicted_ltv?: number;
}

interface ViewContentParams {
  content_name?: string;
  content_category?: string;
  content_type?: string;
  content_ids?: string[];
  value?: number;
  currency?: string;
}

interface SearchParams {
  search_string?: string;
  content_category?: string;
}

interface LeadParams {
  content_name?: string;
  content_category?: string;
  value?: number;
  currency?: string;
}

interface ScheduleParams {
  content_name?: string;
  value?: number;
  currency?: string;
}

interface InitiateCheckoutParams {
  value?: number;
  currency?: string;
  content_name?: string;
  content_ids?: string[];
  num_items?: number;
}

export const useFacebookPixel = () => {
  const isPixelAvailable = (): boolean => {
    return typeof window !== 'undefined' && typeof window.fbq === 'function';
  };

  /**
   * Rastreia visualização de conteúdo
   */
  const trackViewContent = (params?: ViewContentParams) => {
    if (!isPixelAvailable()) return;
    window.fbq('track', 'ViewContent', params);
    console.log('[FB Pixel] ViewContent tracked:', params);
  };

  /**
   * Rastreia registro/cadastro completo
   */
  const trackCompleteRegistration = (method?: string) => {
    if (!isPixelAvailable()) return;
    window.fbq('track', 'CompleteRegistration', {
      content_name: method || 'email',
      status: 'completed',
    });
    console.log('[FB Pixel] CompleteRegistration tracked:', method);
  };

  /**
   * Rastreia lead gerado
   */
  const trackLead = (params?: LeadParams) => {
    if (!isPixelAvailable()) return;
    window.fbq('track', 'Lead', {
      currency: 'BRL',
      ...params,
    });
    console.log('[FB Pixel] Lead tracked:', params);
  };

  /**
   * Rastreia início de checkout
   */
  const trackInitiateCheckout = (params?: InitiateCheckoutParams) => {
    if (!isPixelAvailable()) return;
    window.fbq('track', 'InitiateCheckout', {
      currency: 'BRL',
      ...params,
    });
    console.log('[FB Pixel] InitiateCheckout tracked:', params);
  };

  /**
   * Rastreia adição de informações de pagamento
   */
  const trackAddPaymentInfo = (paymentMethod?: string) => {
    if (!isPixelAvailable()) return;
    window.fbq('track', 'AddPaymentInfo', {
      content_category: paymentMethod || 'credit_card',
    });
    console.log('[FB Pixel] AddPaymentInfo tracked:', paymentMethod);
  };

  /**
   * Rastreia compra realizada
   */
  const trackPurchase = (params: PurchaseParams) => {
    if (!isPixelAvailable()) return;
    window.fbq('track', 'Purchase', {
      currency: 'BRL',
      ...params,
    });
    console.log('[FB Pixel] Purchase tracked:', params);
  };

  /**
   * Rastreia assinatura
   */
  const trackSubscribe = (params: SubscribeParams) => {
    if (!isPixelAvailable()) return;
    window.fbq('track', 'Subscribe', {
      currency: 'BRL',
      ...params,
    });
    console.log('[FB Pixel] Subscribe tracked:', params);
  };

  /**
   * Rastreia início de período de trial
   */
  const trackStartTrial = (params?: StartTrialParams) => {
    if (!isPixelAvailable()) return;
    window.fbq('track', 'StartTrial', {
      currency: 'BRL',
      value: 0,
      ...params,
    });
    console.log('[FB Pixel] StartTrial tracked:', params);
  };

  /**
   * Rastreia agendamento
   */
  const trackSchedule = (params?: ScheduleParams) => {
    if (!isPixelAvailable()) return;
    window.fbq('track', 'Schedule', {
      currency: 'BRL',
      ...params,
    });
    console.log('[FB Pixel] Schedule tracked:', params);
  };

  /**
   * Rastreia contato
   */
  const trackContact = (method?: string) => {
    if (!isPixelAvailable()) return;
    window.fbq('track', 'Contact', {
      content_name: method || 'general',
    });
    console.log('[FB Pixel] Contact tracked:', method);
  };

  /**
   * Rastreia busca
   */
  const trackSearch = (params?: SearchParams) => {
    if (!isPixelAvailable()) return;
    window.fbq('track', 'Search', params);
    console.log('[FB Pixel] Search tracked:', params);
  };

  /**
   * Rastreia evento customizado
   */
  const trackCustomEvent = (eventName: string, params?: Record<string, unknown>) => {
    if (!isPixelAvailable()) return;
    window.fbq('trackCustom', eventName, params);
    console.log('[FB Pixel] Custom event tracked:', eventName, params);
  };

  return {
    isPixelAvailable,
    trackViewContent,
    trackCompleteRegistration,
    trackLead,
    trackInitiateCheckout,
    trackAddPaymentInfo,
    trackPurchase,
    trackSubscribe,
    trackStartTrial,
    trackSchedule,
    trackContact,
    trackSearch,
    trackCustomEvent,
  };
};

// Função standalone para uso fora de componentes React
export const fbPixel = {
  track: (event: string, params?: Record<string, unknown>) => {
    if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
      window.fbq('track', event, params);
      console.log('[FB Pixel] Event tracked:', event, params);
    }
  },
  trackCustom: (event: string, params?: Record<string, unknown>) => {
    if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
      window.fbq('trackCustom', event, params);
      console.log('[FB Pixel] Custom event tracked:', event, params);
    }
  },
};
