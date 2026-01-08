import { format, isValid, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Parse any date format safely
 */
export function parseAnyDate(input: string | null | undefined): Date | null {
  if (!input) return null;

  try {
    // Remove extra whitespace
    const cleanInput = input.trim();

    // Try ISO format first
    if (cleanInput.includes("T")) {
      const date = parseISO(cleanInput);
      if (isValid(date)) return date;
    }

    // Try as date string with time zone handling
    // Add noon time to avoid timezone issues
    const withTime = cleanInput.includes("T")
      ? cleanInput
      : `${cleanInput.split(" ")[0]}T12:00:00`;

    const date = new Date(withTime);
    if (isValid(date)) return date;

    // Last resort: direct parse
    const directDate = new Date(cleanInput);
    if (isValid(directDate)) return directDate;

    return null;
  } catch {
    return null;
  }
}

/**
 * Convert to date input value (yyyy-MM-dd)
 */
export function toDateInputValue(
  input: string | Date | null | undefined
): string {
  if (!input) return "";

  try {
    const date = input instanceof Date ? input : parseAnyDate(input);
    if (!date || !isValid(date)) return "";
    return format(date, "yyyy-MM-dd");
  } catch {
    return "";
  }
}

/**
 * Format date in long Portuguese format
 */
export function formatLongPtBr(
  input: string | Date | null | undefined
): string {
  if (!input) return "[Não definida]";

  try {
    const date = input instanceof Date ? input : parseAnyDate(input);
    if (!date || !isValid(date)) return "[Data inválida]";
    return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  } catch {
    return "[Data inválida]";
  }
}

/**
 * Format date in short format (dd/MM/yyyy)
 */
export function formatShortPtBr(
  input: string | Date | null | undefined
): string {
  if (!input) return "[Não definida]";

  try {
    const date = input instanceof Date ? input : parseAnyDate(input);
    if (!date || !isValid(date)) return "[Data inválida]";
    return format(date, "dd/MM/yyyy", { locale: ptBR });
  } catch {
    return "[Data inválida]";
  }
}

/**
 * Get day of month from date
 */
export function getDayOfMonth(input: string | Date | null | undefined): number {
  if (!input) return 1;

  try {
    const date = input instanceof Date ? input : parseAnyDate(input);
    if (!date || !isValid(date)) return 1;
    return date.getDate();
  } catch {
    return 1;
  }
}
