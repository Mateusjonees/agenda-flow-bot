/**
 * Meta Pixel Tracking Hook
 * 
 * Este hook fornece funções para rastrear eventos do Meta/Facebook Pixel.
 * Eventos disponíveis (conforme documentação oficial do Meta):
 * https://developers.facebook.com/docs/meta-pixel/reference
 * 
 * Eventos Padrão:
 * - PageView (automático no CookieConsent)
 * - CompleteRegistration
 * - Lead
 * - Purchase
 * - Subscribe
 * - StartTrial
 * - InitiateCheckout
 * - AddPaymentInfo
 * - AddToCart
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
  num_items?: number;
}

interface SubscribeParams {
  value: number;
  currency?: string;
  predicted_ltv?: number;
  content_name?: string;
}

interface StartTrialParams {
  value?: number;
  currency?: string;
  predicted_ltv?: number;
  content_name?: string;
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

interface AddToCartParams {
  content_name?: string;
  content_type?: string;
  content_ids?: string[];
  value?: number;
  currency?: string;
}

/**
 * Verifica se o pixel está disponível e o usuário consentiu
 */
const isPixelAvailable = (): boolean => {
  const hasPixel = typeof window !== 'undefined' && typeof window.fbq === 'function';
  const hasConsent = localStorage.getItem("cookie_consent") === "accepted";
  return hasPixel && hasConsent;
};

/**
 * Função auxiliar para rastrear eventos com logging
 */
const trackEvent = (eventName: string, params?: Record<string, unknown>) => {
  if (!isPixelAvailable()) {
    console.log('[Meta Pixel] Event skipped (no consent or pixel):', eventName);
    return false;
  }
  
  window.fbq('track', eventName, params);
  console.log('[Meta Pixel] Event tracked:', eventName, params);
  return true;
};

export const useFacebookPixel = () => {

  /**
   * Rastreia visualização de conteúdo
   */
  const trackViewContent = (params?: ViewContentParams) => {
    trackEvent('ViewContent', { currency: 'BRL', ...params });
  };

  /**
   * Rastreia registro/cadastro completo
   */
  const trackCompleteRegistration = (method?: string) => {
    trackEvent('CompleteRegistration', {
      content_name: method || 'email',
      status: 'completed',
    });
  };

  /**
   * Rastreia lead gerado
   */
  const trackLead = (params?: LeadParams) => {
    trackEvent('Lead', { currency: 'BRL', ...params });
  };

  /**
   * Rastreia início de checkout
   */
  const trackInitiateCheckout = (params?: InitiateCheckoutParams) => {
    trackEvent('InitiateCheckout', { currency: 'BRL', ...params });
  };

  /**
   * Rastreia adição de informações de pagamento
   */
  const trackAddPaymentInfo = (paymentMethod?: string) => {
    trackEvent('AddPaymentInfo', {
      content_category: paymentMethod || 'credit_card',
    });
  };

  /**
   * Rastreia compra realizada
   */
  const trackPurchase = (params: PurchaseParams) => {
    trackEvent('Purchase', { currency: 'BRL', ...params });
  };

  /**
   * Rastreia assinatura
   */
  const trackSubscribe = (params: SubscribeParams) => {
    trackEvent('Subscribe', { currency: 'BRL', ...params });
  };

  /**
   * Rastreia início de período de trial
   */
  const trackStartTrial = (params?: StartTrialParams) => {
    trackEvent('StartTrial', { currency: 'BRL', value: 0, ...params });
  };

  /**
   * Rastreia agendamento
   */
  const trackSchedule = (params?: ScheduleParams) => {
    trackEvent('Schedule', { currency: 'BRL', ...params });
  };

  /**
   * Rastreia contato
   */
  const trackContact = (method?: string) => {
    trackEvent('Contact', { content_name: method || 'general' });
  };

  /**
   * Rastreia busca
   */
  const trackSearch = (params?: SearchParams) => {
    trackEvent('Search', params as Record<string, unknown>);
  };

  /**
   * Rastreia adição ao carrinho
   */
  const trackAddToCart = (params?: AddToCartParams) => {
    trackEvent('AddToCart', { currency: 'BRL', ...params });
  };

  /**
   * Rastreia evento customizado
   */
  const trackCustomEvent = (eventName: string, params?: Record<string, unknown>) => {
    if (!isPixelAvailable()) {
      console.log('[Meta Pixel] Custom event skipped:', eventName);
      return;
    }
    window.fbq('trackCustom', eventName, params);
    console.log('[Meta Pixel] Custom event tracked:', eventName, params);
  };

  /**
   * Rastreia login (evento customizado)
   */
  const trackLogin = (method?: string) => {
    trackEvent('Login', {
      content_name: method || 'email',
    });
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
    trackAddToCart,
    trackCustomEvent,
    trackLogin,
  };
};

// Função standalone para uso fora de componentes React
export const fbPixel = {
  track: (event: string, params?: Record<string, unknown>) => {
    if (!isPixelAvailable()) {
      console.log('[Meta Pixel] Event skipped (standalone):', event);
      return;
    }
    window.fbq('track', event, params);
    console.log('[Meta Pixel] Event tracked (standalone):', event, params);
  },
  trackCustom: (event: string, params?: Record<string, unknown>) => {
    if (!isPixelAvailable()) {
      console.log('[Meta Pixel] Custom event skipped (standalone):', event);
      return;
    }
    window.fbq('trackCustom', event, params);
    console.log('[Meta Pixel] Custom event tracked (standalone):', event, params);
  },
  isAvailable: isPixelAvailable,
};
