export type Currency = 'UZS' | 'USD';

export type PaymentMethod = 'card' | 'cash' | 'usd';

export interface ExpenseItem {
  id: string;
  name: string;
  price: number;
  quantity?: number;
  unit?: string;
}

export interface Wallet {
  id: string;
  name: string;
  currency: Currency;
  balance: number;
  color: string;
  icon: string;
  isDefault?: boolean;
}

export interface Category {
  id: string;
  name: string;
  type: 'expense' | 'income';
  icon: string;
  color: string;
  isCustom?: boolean;
}

export interface Transaction {
  id: string;
  type: 'expense' | 'income';
  amount: number;
  currency: Currency;
  walletId: string; // 'wallet_card' | 'wallet_cash' | 'wallet_usd'
  categoryId: string;
  title: string;
  note?: string;
  items?: ExpenseItem[];
  date: string; // ISO string
  createdAt: number;
}

export interface PlannedPayment {
  id: string;
  title: string; // masalan: "Uy interneti (Wi-Fi)", "Kredit to'lovi", "Kommunal"
  amount: number;
  currency: Currency;
  categoryId: string;
  dueDate: string; // YYYY-MM-DD (navbatdagi to'lov sanasi)
  isRecurringMonthly: boolean; // Har oy takrorlanadimi?
  notifyDaysBefore: number; // Necha kun oldin eslatsin (default: 1 yoki 2 kun)
  lastPaidDate?: string;
}

export interface UserSettings {
  exchangeRateUsdToUzs: number;
  theme: 'dark' | 'light' | 'system';
  primaryCurrency: Currency;
  dailyTargetLimit?: number; // Kunlik mo'ljal (ixtiyoriy)
  monthlyBudgetLimit?: number;
  userName?: string;
  cloudSyncEnabled: boolean;
}
