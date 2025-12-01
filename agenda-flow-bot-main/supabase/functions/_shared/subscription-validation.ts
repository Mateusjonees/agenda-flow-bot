// Funções helper para validação de subscriptions

export interface Subscription {
  id: string;
  user_id: string;
  customer_id: string | null;
  plan_id: string | null;
  status: string;
  type?: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  subscriptionType?: 'platform' | 'client';
}

/**
 * Identifica se é uma assinatura DA PLATAFORMA
 * Critério: customer_id = NULL e plan_id = NULL
 */
export function isPlatformSubscription(subscription: Subscription): boolean {
  return subscription.customer_id === null && subscription.plan_id === null;
}

/**
 * Identifica se é uma assinatura DE CLIENTE
 * Critério: customer_id != NULL e plan_id != NULL
 */
export function isClientSubscription(subscription: Subscription): boolean {
  return subscription.customer_id !== null && subscription.plan_id !== null;
}

/**
 * Valida integridade dos dados da subscription
 * REGRA CRÍTICA: customer_id e plan_id devem ser AMBOS null OU AMBOS preenchidos
 */
export function validateSubscriptionIntegrity(subscription: Subscription): ValidationResult {
  const hasCustomer = subscription.customer_id !== null;
  const hasPlan = subscription.plan_id !== null;
  
  // Caso inconsistente: um campo preenchido e outro não
  if (hasCustomer !== hasPlan) {
    return {
      valid: false,
      error: `SUBSCRIPTION DATA CORRUPTION: Subscription ${subscription.id} has inconsistent data. customer_id=${subscription.customer_id}, plan_id=${subscription.plan_id}. Both must be null (platform) or both must be filled (client).`
    };
  }
  
  // Determinar tipo
  const subscriptionType = hasCustomer ? 'client' : 'platform';
  
  return {
    valid: true,
    subscriptionType
  };
}

/**
 * Valida operação específica baseada no tipo
 */
export function validateOperation(
  subscription: Subscription,
  operation: 'cancel' | 'reactivate' | 'expire' | 'process-payment',
  expectedType?: 'platform' | 'client'
): ValidationResult {
  // Primeiro valida integridade
  const integrityCheck = validateSubscriptionIntegrity(subscription);
  if (!integrityCheck.valid) {
    return integrityCheck;
  }
  
  // Se esperamos um tipo específico, validar
  if (expectedType && integrityCheck.subscriptionType !== expectedType) {
    return {
      valid: false,
      error: `INVALID OPERATION: Attempting ${operation} on ${integrityCheck.subscriptionType} subscription, but expected ${expectedType} subscription.`
    };
  }
  
  return {
    valid: true,
    subscriptionType: integrityCheck.subscriptionType
  };
}

/**
 * Gera filtro SQL para queries específicas de tipo
 */
export function getSubscriptionTypeFilter(type: 'platform' | 'client') {
  if (type === 'platform') {
    return {
      customerIdFilter: 'is.null',
      planIdFilter: 'is.null'
    };
  } else {
    return {
      customerIdFilter: 'not.is.null',
      planIdFilter: 'not.is.null'
    };
  }
}
