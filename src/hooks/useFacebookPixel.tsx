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

const isPixelAvailable = (): boolean => {
  const hasPixel = typeof window !== 'undefined' && typeof window.fbq === 'function';
  const hasConsent = localStorage.getItem("cookie_consent") === "accepted";
  return hasPixel && hasConsent;
};

const trackEvent = (eventName: string, params?: Record<string, unknown>) => {
  if (!isPixelAvailable()) return false;
  window.fbq('track', eventName, params);
  return true;
};

export const useFacebookPixel = () => {
  const trackViewContent = (params?: ViewContentParams) => {
    trackEvent('ViewContent', { currency: 'BRL', ...params });
  };

  const trackCompleteRegistration = (method?: string) => {
    trackEvent('CompleteRegistration', { content_name: method || 'email', status: 'completed' });
  };

  const trackLead = (params?: LeadParams) => {
    trackEvent('Lead', { currency: 'BRL', ...params });
  };

  const trackInitiateCheckout = (params?: InitiateCheckoutParams) => {
    trackEvent('InitiateCheckout', { currency: 'BRL', ...params });
  };

  const trackAddPaymentInfo = (paymentMethod?: string) => {
    trackEvent('AddPaymentInfo', { content_category: paymentMethod || 'credit_card' });
  };

  const trackPurchase = (params: PurchaseParams) => {
    trackEvent('Purchase', { currency: 'BRL', ...params });
  };

  const trackSubscribe = (params: SubscribeParams) => {
    trackEvent('Subscribe', { currency: 'BRL', ...params });
  };

  const trackStartTrial = (params?: StartTrialParams) => {
    trackEvent('StartTrial', { currency: 'BRL', value: 0, ...params });
  };

  const trackSchedule = (params?: ScheduleParams) => {
    trackEvent('Schedule', { currency: 'BRL', ...params });
  };

  const trackContact = (method?: string) => {
    trackEvent('Contact', { content_name: method || 'general' });
  };

  const trackSearch = (params?: SearchParams) => {
    trackEvent('Search', params as Record<string, unknown>);
  };

  const trackAddToCart = (params?: AddToCartParams) => {
    trackEvent('AddToCart', { currency: 'BRL', ...params });
  };

  const trackCustomEvent = (eventName: string, params?: Record<string, unknown>) => {
    if (!isPixelAvailable()) return;
    window.fbq('trackCustom', eventName, params);
  };

  const trackLogin = (method?: string) => {
    trackEvent('Login', { content_name: method || 'email' });
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

export const fbPixel = {
  track: (event: string, params?: Record<string, unknown>) => {
    if (!isPixelAvailable()) return;
    window.fbq('track', event, params);
  },
  trackCustom: (event: string, params?: Record<string, unknown>) => {
    if (!isPixelAvailable()) return;
    window.fbq('trackCustom', event, params);
  },
  isAvailable: isPixelAvailable,
};