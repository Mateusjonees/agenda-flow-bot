/**
 * Shared Logger Utility for Edge Functions
 * 
 * Provides structured logging for better observability and debugging
 * 
 * Usage:
 * import { logInfo, logError, logWarning } from "../_shared/logger.ts";
 * 
 * logInfo("whatsapp-webhook", "message_received", { from: phone, type: "text" });
 * logError("pix-webhook", "payment_failed", { txid: "123", error: err.message });
 */

export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARNING = "WARNING",
  ERROR = "ERROR",
  CRITICAL = "CRITICAL",
}

interface LogData {
  level: LogLevel;
  module: string;
  action: string;
  timestamp: string;
  [key: string]: any;
}

/**
 * Log estruturado base
 */
function log(level: LogLevel, module: string, action: string, data?: Record<string, any>) {
  const logEntry: LogData = {
    level,
    module,
    action,
    timestamp: new Date().toISOString(),
    ...data,
  };

  // Em produção, pode enviar para serviço de logging (Datadog, Sentry, etc)
  console.log(JSON.stringify(logEntry));
}

/**
 * Log de informação (operações normais)
 */
export function logInfo(module: string, action: string, data?: Record<string, any>) {
  log(LogLevel.INFO, module, action, data);
}

/**
 * Log de debug (desenvolvimento)
 */
export function logDebug(module: string, action: string, data?: Record<string, any>) {
  log(LogLevel.DEBUG, module, action, data);
}

/**
 * Log de warning (situações anômalas mas não críticas)
 */
export function logWarning(module: string, action: string, data?: Record<string, any>) {
  log(LogLevel.WARNING, module, action, data);
}

/**
 * Log de erro (falhas recuperáveis)
 */
export function logError(module: string, action: string, data?: Record<string, any>) {
  log(LogLevel.ERROR, module, action, data);
}

/**
 * Log crítico (falhas graves que afetam sistema)
 */
export function logCritical(module: string, action: string, data?: Record<string, any>) {
  log(LogLevel.CRITICAL, module, action, data);
}

/**
 * Helper para logar performance de operações
 */
export function logPerformance(module: string, action: string, startTime: number, data?: Record<string, any>) {
  const duration = Date.now() - startTime;
  logInfo(module, `${action}_completed`, {
    ...data,
    duration_ms: duration,
  });
}

/**
 * Helper para logar erros com stack trace
 */
export function logException(module: string, action: string, error: Error, data?: Record<string, any>) {
  logError(module, action, {
    ...data,
    error_message: error.message,
    error_stack: error.stack,
    error_name: error.name,
  });
}
