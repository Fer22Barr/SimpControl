/**
 * SimpControl - Formatters & Calculations
 */

/**
 * Formats a number as Argentine Currency ($ 1.234,56)
 */
export function formatCurrency(value: number): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '$ 0,00';
  }

  const isNegative = value < 0;
  const absValue = Math.abs(value);

  const formatted = absValue.toLocaleString('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `${isNegative ? '-' : ''}$ ${formatted}`;
}

/**
 * Calculates gross margin percentage: [ (Sell - Cost) / Sell ] * 100
 * If sellPrice is 0 or invalid, returns null ("No calculable")
 */
export function calculateGrossMargin(costPrice: number, sellPrice: number): number | null {
  if (sellPrice <= 0 || isNaN(sellPrice) || isNaN(costPrice)) {
    return null;
  }
  return ((sellPrice - costPrice) / sellPrice) * 100;
}

/**
 * Formats gross margin as string with 2 decimals or "No calculable"
 */
export function formatPercentage(value: number | null): string {
  if (value === null || isNaN(value) || !isFinite(value)) {
    return 'No calculable';
  }
  return `${value.toFixed(2)} %`;
}

/**
 * Formats an ISO string or timestamp to date & time: "DD/MM/YYYY HH:mm"
 */
export function formatDateTime(isoOrTimestamp: string | number): string {
  const date = new Date(isoOrTimestamp);
  if (isNaN(date.getTime())) return '-';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes} hs`;
}

/**
 * Formats an ISO string or timestamp to date only: "DD/MM/YYYY"
 */
export function formatDate(isoOrTimestamp: string | number): string {
  const date = new Date(isoOrTimestamp);
  if (isNaN(date.getTime())) return '-';

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

export const MONTH_NAMES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export function getMonthName(monthNumber: number): string {
  return MONTH_NAMES_ES[monthNumber - 1] || '';
}

/**
 * Generate human-friendly sequential or time-based IDs
 */
export function generateProductId(existingCount: number): string {
  const num = existingCount + 1;
  return `PRD-${String(num).padStart(4, '0')}`;
}

export function generateSaleId(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `VTA-${yyyy}${mm}${dd}-${rand}`;
}

export function generateMovementId(): string {
  const now = new Date();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `MOV-${now.getTime()}-${rand}`;
}
