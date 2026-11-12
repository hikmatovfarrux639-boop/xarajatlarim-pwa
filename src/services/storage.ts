import { Wallet, Category, Transaction, UserSettings, PlannedPayment } from '../types/finance';

// Yangi v2 kalitlar — barcha eski demo/namuna ma'lumotlar tozalanib, 0 dan boshlanadi!
const STORAGE_KEYS = {
  WALLETS: 'hamyon_wallets_v2',
  CATEGORIES: 'hamyon_categories_v2',
  TRANSACTIONS: 'hamyon_transactions_v2',
  PLANNED_PAYMENTS: 'hamyon_planned_payments_v2',
  SETTINGS: 'hamyon_settings_v2',
};

export const DEFAULT_WALLETS: Wallet[] = [
  {
    id: 'wallet_card',
    name: 'Karta',
    currency: 'UZS',
    balance: 0,
    color: '#6366f1',
    icon: 'credit-card',
    isDefault: true,
  },
  {
    id: 'wallet_cash',
    name: 'Naqd pul',
    currency: 'UZS',
    balance: 0,
    color: '#10b981',
    icon: 'banknote',
  },
  {
    id: 'wallet_usd',
    name: 'Dollar ($)',
    currency: 'USD',
    balance: 0,
    color: '#0ea5e9',
    icon: 'dollar-sign',
  },
];

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat_cafe', name: 'Kafe & Tushlik', type: 'expense', icon: 'utensils', color: '#ef4444' },
  { id: 'cat_food', name: 'Oziq-ovqat & Bozorlik', type: 'expense', icon: 'shopping-cart', color: '#f59e0b' },
  { id: 'cat_transport', name: "Transport & Yo'l kira", type: 'expense', icon: 'car', color: '#3b82f6' },
  { id: 'cat_home', name: 'Uy & Kommunal', type: 'expense', icon: 'home', color: '#8b5cf6' },
  { id: 'cat_phone', name: 'Aloqa & Internet', type: 'expense', icon: 'smartphone', color: '#06b6d4' },
  { id: 'cat_health', name: 'Salomatlik & Dorixona', type: 'expense', icon: 'heart-pulse', color: '#ec4899' },
  { id: 'cat_clothes', name: 'Kiyim-kechak', type: 'expense', icon: 'shirt', color: '#14b8a6' },
  { id: 'cat_entertainment', name: "Ko'ngilochar", type: 'expense', icon: 'film', color: '#a855f7' },
  { id: 'cat_other_exp', name: 'Boshqa xarajat', type: 'expense', icon: 'more-horizontal', color: '#64748b' },
];

export const DEFAULT_SETTINGS: UserSettings = {
  exchangeRateUsdToUzs: 12850,
  theme: 'dark',
  primaryCurrency: 'UZS',
  dailyTargetLimit: 0,
  monthlyBudgetLimit: 0,
  userName: 'Foydalanuvchi',
  cloudSyncEnabled: false,
};

// Hech qanday soxta xarajat va eslatma yo'q — hammasi 0 va bo'sh ro'yxatdan boshlanadi!
export const INITIAL_PLANNED_PAYMENTS: PlannedPayment[] = [];
export const INITIAL_TRANSACTIONS: Transaction[] = [];

// Brauzer xotirasi hech qachon o'chib ketmasligi uchun Persistent Storage so'rash
export async function ensurePersistentStorage(): Promise<boolean> {
  try {
    if (navigator.storage && navigator.storage.persist) {
      const isPersisted = await navigator.storage.persisted();
      if (isPersisted) return true;
      return await navigator.storage.persist();
    }
  } catch (e) {
    console.warn('Persistent storage check error:', e);
  }
  return false;
}

export const storage = {
  getWallets(): Wallet[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WALLETS);
      return data ? JSON.parse(data) : DEFAULT_WALLETS;
    } catch {
      return DEFAULT_WALLETS;
    }
  },

  saveWallets(wallets: Wallet[]) {
    localStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(wallets));
  },

  getCategories(): Category[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      return data ? JSON.parse(data) : DEFAULT_CATEGORIES;
    } catch {
      return DEFAULT_CATEGORIES;
    }
  },

  saveCategories(categories: Category[]) {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  },

  getTransactions(): Transaction[] {
    try {
      // Eski v1 demo kalitlarni tozalash
      localStorage.removeItem('hamyon_transactions_v1');
      localStorage.removeItem('hamyon_planned_payments_v1');
      localStorage.removeItem('hamyon_wallets_v1');

      const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (!data) return INITIAL_TRANSACTIONS;
      return JSON.parse(data);
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  },

  saveTransactions(transactions: Transaction[]) {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  },

  getPlannedPayments(): PlannedPayment[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PLANNED_PAYMENTS);
      return data ? JSON.parse(data) : INITIAL_PLANNED_PAYMENTS;
    } catch {
      return INITIAL_PLANNED_PAYMENTS;
    }
  },

  savePlannedPayments(payments: PlannedPayment[]) {
    localStorage.setItem(STORAGE_KEYS.PLANNED_PAYMENTS, JSON.stringify(payments));
  },

  getSettings(): UserSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: UserSettings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  clearAllData() {
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.PLANNED_PAYMENTS);
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.WALLETS);
  },

  exportJsonBackup(): string {
    const backup = {
      version: '2.1.0',
      exportedAt: new Date().toISOString(),
      wallets: this.getWallets(),
      categories: this.getCategories(),
      transactions: this.getTransactions(),
      plannedPayments: this.getPlannedPayments(),
      settings: this.getSettings(),
    };
    return JSON.stringify(backup, null, 2);
  },

  exportTransactionsCsv(transactions: Transaction[], categories: Category[], wallets: Wallet[]): string {
    const catMap = new Map(categories.map(c => [c.id, c.name]));
    const walMap = new Map(wallets.map(w => [w.id, w.name]));

    const headers = ['Sana', 'Kategoriya', 'Nima olindi', 'Summa', 'Valyuta', "To'lov turi", 'Izoh', 'Bozorlik tarkibi'];
    const rows = transactions.map(t => {
      const dateStr = new Date(t.date).toLocaleString('uz-UZ');
      const catName = catMap.get(t.categoryId) || 'Boshqa';
      const walName = walMap.get(t.walletId) || 'Karta';
      const itemsStr = t.items && t.items.length > 0
        ? t.items.map(i => `${i.name}: ${i.price}`).join('; ')
        : '';

      const escape = (val: string) => `"${(val || '').replace(/"/g, '""')}"`;

      return [
        escape(dateStr),
        escape(catName),
        escape(t.title),
        t.amount,
        t.currency,
        escape(walName),
        escape(t.note || ''),
        escape(itemsStr),
      ].join(',');
    });

    return '\uFEFF' + [headers.join(','), ...rows].join('\n');
  },
};
