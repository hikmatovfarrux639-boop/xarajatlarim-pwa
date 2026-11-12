import { Currency } from '../types/finance';

/**
 * Format currency amount cleanly
 * e.g. 150000 UZS -> "150 000 so'm"
 * e.g. 25.5 USD -> "$25.50"
 */
export function formatCurrency(amount: number, currency: Currency = 'UZS'): string {
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  // UZS format: 150 000 so'm
  const formatted = new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 0,
  }).format(Math.round(amount)).replace(/,/g, ' ');

  return `${formatted} so'm`;
}

/**
 * Format raw numbers cleanly with spaces: 1500000 -> "1 500 000"
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 0,
  }).format(value).replace(/,/g, ' ');
}

/**
 * Parse a localized formatted number string back to number
 */
export function parseFormattedNumber(value: string): number {
  const clean = value.replace(/\s/g, '').replace(/,/g, '.');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

/**
 * Uzbek relative/friendly date formatting
 * e.g. "Bugun, 14:30", "Kecha, 18:10", "12-noyabr"
 */
export function formatUzbekDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const time = `${hours}:${minutes}`;

  if (isToday) {
    return `Bugun, ${time}`;
  }
  if (isYesterday) {
    return `Kecha, ${time}`;
  }

  const uzbekMonths = [
    'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
    'iyul', 'avgust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'
  ];

  return `${date.getDate()}-${uzbekMonths[date.getMonth()]} ${date.getFullYear() !== now.getFullYear() ? date.getFullYear() : ''}, ${time}`.trim();
}

/**
 * Format date for input[type="date"]
 */
export function toInputDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}
