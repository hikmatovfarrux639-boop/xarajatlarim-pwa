import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { Wallet, Category, Transaction, UserSettings, ExpenseItem, PlannedPayment } from '../types/finance';
import { storage, ensurePersistentStorage, DEFAULT_CATEGORIES } from '../services/storage';
import { toInputDate } from '../utils/formatters';

export interface SmartHistorySuggestion {
  title: string;
  categoryId: string;
  walletId: string;
  lastAmount: number;
  currency: 'UZS' | 'USD';
  count: number;
}

export interface PlannedPaymentWithStatus extends PlannedPayment {
  daysLeft: number;
  isUrgent: boolean;
}

interface FinanceContextType {
  wallets: Wallet[];
  categories: Category[];
  transactions: Transaction[];
  plannedPayments: PlannedPaymentWithStatus[];
  urgentPayments: PlannedPaymentWithStatus[];
  settings: UserSettings;
  todaySpentUzs: number;
  yesterdaySpentUzs: number;
  thisWeekSpentUzs: number;
  thisMonthSpentUzs: number;
  recentTitles: string[];
  smartSuggestions: SmartHistorySuggestion[];
  isStoragePersisted: boolean;
  canInstallPwa: boolean;
  installPwa: () => Promise<void>;
  addTransaction: (tx: {
    type?: 'expense' | 'income';
    amount: number;
    currency: 'UZS' | 'USD';
    walletId: string;
    categoryId: string;
    title: string;
    note?: string;
    items?: ExpenseItem[];
    date?: string;
  }) => Transaction;
  updateTransaction: (updatedTx: Transaction) => void;
  deleteTransaction: (id: string) => void;
  addPlannedPayment: (plan: Omit<PlannedPayment, 'id'>) => void;
  updatePlannedPayment: (plan: PlannedPayment) => void;
  deletePlannedPayment: (id: string) => void;
  markPlannedPaymentAsPaid: (id: string, walletId?: string) => Transaction | null;
  addCategory: (category: Omit<Category, 'id'>) => void;
  deleteCategory: (id: string) => void;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  toggleTheme: () => void;
  exportCsv: () => void;
  exportJson: () => void;
  importJson: (jsonString: string) => boolean;
  resetAllToZero: () => void;
  clearTodayTransactions: () => void;
  guessCategoryForText: (text: string) => string;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  cat_food: ['non', 'bozor', "go'sht", 'gosht', 'kartoshka', 'piyoz', 'sabzi', 'meva', 'olma', 'banan', 'sut', 'qatiq', 'tuxum', "yog'", 'yog', 'shakar', 'un', 'makaron', 'guruch', 'korzinka', 'makro', 'havas', 'bozorlik', 'suv', 'ichimlik', 'choy', 'qahva', 'shirinlik', 'kolbasa', 'pishloq', 'sariyog'],
  cat_cafe: ['tushlik', 'osh', 'kafe', 'restoran', 'choyxona', 'shashlik', 'lavash', 'burger', 'pitsa', 'pizza', 'somsa', 'kechki ovqat', 'nonushta', 'fastfud', 'evos', 'oqtepa', 'kfc', 'coffee'],
  cat_transport: ['taksi', 'taxi', 'yandex', 'uklon', 'mycab', 'avtobus', 'metro', "yo'l", 'yol', 'benzin', 'metan', 'propan', 'zapravka', 'parkovka', 'moyka', 'avto', 'mashina', 'chipta', 'poyezd'],
  cat_home: ['kommunal', 'svet', 'elektr', 'gaz', 'suv', 'axlat', 'ijara', 'kvartira', 'remont', 'uy', "ro'zg'or", 'rozgor', 'kir yuvish', 'sovun', 'shampun', 'kredit'],
  cat_phone: ['internet', 'aloqa', 'telefon', 'ucell', 'beeline', 'uzmobile', 'mobiuz', 'paynet', 'wifi', 'tarif', 'megabayt'],
  cat_health: ['dori', 'apteka', 'dorixona', 'shifokor', 'doktor', 'klinika', 'tish', 'stomatolog', 'analiz', 'davolanish', 'vitamin'],
  cat_clothes: ['kiyim', "ko'ylak", 'koylak', 'shim', 'oyoq kiyim', 'krossovka', 'tufli', 'kurtka', 'futbolka', 'paypoq'],
  cat_entertainment: ['kino', "bog'", 'park', "o'yin", 'oyin', 'konsert', 'futbol', 'bilyard', 'playstation', 'dam olish', 'sayohat', "sovg'a"],
};

function calculateDaysLeft(dueDateStr: string): number {
  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const [y, m, d] = dueDateStr.split('-').map(Number);
  const dueMidnight = new Date(y, (m || 1) - 1, d || 1);
  const diffMs = dueMidnight.getTime() - todayMidnight.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function getNextMonthDateString(dueDateStr: string): string {
  const [y, m, d] = dueDateStr.split('-').map(Number);
  const nextDate = new Date(y, m, d);
  return toInputDate(nextDate);
}

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [wallets] = useState<Wallet[]>(() => storage.getWallets());
  const [categories, setCategories] = useState<Category[]>(() => storage.getCategories());
  const [transactions, setTransactions] = useState<Transaction[]>(() => storage.getTransactions());
  const [rawPlannedPayments, setRawPlannedPayments] = useState<PlannedPayment[]>(() => storage.getPlannedPayments());
  const [settings, setSettings] = useState<UserSettings>(() => storage.getSettings());
  const [isStoragePersisted, setIsStoragePersisted] = useState<boolean>(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Request persistent storage & listen for PWA install prompt
  useEffect(() => {
    ensurePersistentStorage().then(persisted => {
      setIsStoragePersisted(persisted);
    });

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  useEffect(() => {
    storage.saveCategories(categories);
  }, [categories]);

  useEffect(() => {
    storage.saveTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    storage.savePlannedPayments(rawPlannedPayments);
  }, [rawPlannedPayments]);

  useEffect(() => {
    storage.saveSettings(settings);
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  const installPwa = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const toUzs = (amount: number, currency: 'UZS' | 'USD') => {
    return currency === 'USD' ? amount * settings.exchangeRateUsdToUzs : amount;
  };

  const { todaySpentUzs, yesterdaySpentUzs, thisWeekSpentUzs, thisMonthSpentUzs } = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart.getTime() - 86400000);
    const weekStart = new Date(todayStart.getTime() - 6 * 86400000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let today = 0;
    let yesterday = 0;
    let week = 0;
    let month = 0;

    for (const t of transactions) {
      if (t.type !== 'expense') continue;
      const d = new Date(t.date);
      const val = toUzs(t.amount, t.currency);

      if (d >= todayStart) {
        today += val;
      } else if (d >= yesterdayStart && d < todayStart) {
        yesterday += val;
      }

      if (d >= weekStart) {
        week += val;
      }

      if (d >= monthStart) {
        month += val;
      }
    }

    return {
      todaySpentUzs: today,
      yesterdaySpentUzs: yesterday,
      thisWeekSpentUzs: week,
      thisMonthSpentUzs: month,
    };
  }, [transactions, settings.exchangeRateUsdToUzs]);

  const plannedPayments: PlannedPaymentWithStatus[] = useMemo(() => {
    return rawPlannedPayments
      .map(p => {
        const daysLeft = calculateDaysLeft(p.dueDate);
        const isUrgent = daysLeft <= (p.notifyDaysBefore ?? 2);
        return {
          ...p,
          daysLeft,
          isUrgent,
        };
      })
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [rawPlannedPayments]);

  const urgentPayments = useMemo(() => {
    return plannedPayments.filter(p => p.isUrgent);
  }, [plannedPayments]);

  const smartSuggestions = useMemo(() => {
    const map = new Map<string, SmartHistorySuggestion>();
    for (const t of transactions) {
      if (t.type !== 'expense') continue;
      const key = t.title.trim().toLowerCase();
      if (!key) continue;
      if (!map.has(key)) {
        map.set(key, {
          title: t.title.trim(),
          categoryId: t.categoryId,
          walletId: t.walletId,
          lastAmount: t.amount,
          currency: t.currency,
          count: 1,
        });
      } else {
        const existing = map.get(key)!;
        existing.count += 1;
      }
    }
    return Array.from(map.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);
  }, [transactions]);

  const recentTitles = useMemo(() => {
    return smartSuggestions.map(s => s.title);
  }, [smartSuggestions]);

  const guessCategoryForText = (text: string): string => {
    const lower = text.toLowerCase().trim();
    const pastMatch = transactions.find(
      t => t.title.toLowerCase().includes(lower) && lower.length >= 3
    );
    if (pastMatch) return pastMatch.categoryId;

    for (const [catId, words] of Object.entries(CATEGORY_KEYWORDS)) {
      if (words.some(w => lower.includes(w))) {
        return catId;
      }
    }

    return 'cat_food';
  };

  const addTransaction: FinanceContextType['addTransaction'] = (txData) => {
    const newTx: Transaction = {
      ...txData,
      type: 'expense',
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      date: txData.date || new Date().toISOString(),
      createdAt: Date.now(),
    };

    setTransactions(prev => [newTx, ...prev]);
    return newTx;
  };

  const updateTransaction = (updatedTx: Transaction) => {
    setTransactions(prev => prev.map(t => (t.id === updatedTx.id ? updatedTx : t)));
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const addPlannedPayment = (planData: Omit<PlannedPayment, 'id'>) => {
    const newPlan: PlannedPayment = {
      ...planData,
      id: `plan_${Date.now()}`,
    };
    setRawPlannedPayments(prev => [...prev, newPlan]);
  };

  const updatePlannedPayment = (updated: PlannedPayment) => {
    setRawPlannedPayments(prev => prev.map(p => (p.id === updated.id ? updated : p)));
  };

  const deletePlannedPayment = (id: string) => {
    setRawPlannedPayments(prev => prev.filter(p => p.id !== id));
  };

  const markPlannedPaymentAsPaid = (id: string, walletId: string = 'wallet_card'): Transaction | null => {
    const plan = rawPlannedPayments.find(p => p.id === id);
    if (!plan) return null;

    const createdTx = addTransaction({
      type: 'expense',
      amount: plan.amount,
      currency: plan.currency,
      walletId: plan.currency === 'USD' ? 'wallet_usd' : walletId,
      categoryId: plan.categoryId,
      title: plan.title,
      note: "Rejali to'lov bajarildi",
      date: new Date().toISOString(),
    });

    if (plan.isRecurringMonthly) {
      const nextDueDate = getNextMonthDateString(plan.dueDate);
      setRawPlannedPayments(prev =>
        prev.map(p =>
          p.id === id
            ? { ...p, dueDate: nextDueDate, lastPaidDate: new Date().toISOString() }
            : p
        )
      );
    } else {
      setRawPlannedPayments(prev => prev.filter(p => p.id !== id));
    }

    return createdTx;
  };

  const addCategory = (catData: Omit<Category, 'id'>) => {
    const newCat: Category = {
      ...catData,
      id: `cat_${Date.now()}`,
      isCustom: true,
    };
    setCategories(prev => [...prev, newCat]);
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const toggleTheme = () => {
    setSettings(prev => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark',
    }));
  };

  const resetAllToZero = () => {
    storage.clearAllData();
    setTransactions([]);
  };

  const clearTodayTransactions = () => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    setTransactions(prev => prev.filter(t => new Date(t.date) < todayStart));
  };

  const exportCsv = () => {
    const csvContent = storage.exportTransactionsCsv(transactions, categories, wallets);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `spendo_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportJson = () => {
    const jsonContent = storage.exportJsonBackup();
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `spendo_zaxira_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const importJson = (jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (data.categories && Array.isArray(data.categories)) setCategories(data.categories);
      if (data.transactions && Array.isArray(data.transactions)) setTransactions(data.transactions);
      if (data.plannedPayments && Array.isArray(data.plannedPayments)) setRawPlannedPayments(data.plannedPayments);
      if (data.settings) setSettings(prev => ({ ...prev, ...data.settings }));
      return true;
    } catch (e) {
      console.error('Import error:', e);
      return false;
    }
  };

  return (
    <FinanceContext.Provider
      value={{
        wallets,
        categories,
        transactions,
        plannedPayments,
        urgentPayments,
        settings,
        todaySpentUzs,
        yesterdaySpentUzs,
        thisWeekSpentUzs,
        thisMonthSpentUzs,
        recentTitles,
        smartSuggestions,
        isStoragePersisted,
        canInstallPwa: !!deferredPrompt,
        installPwa,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addPlannedPayment,
        updatePlannedPayment,
        deletePlannedPayment,
        markPlannedPaymentAsPaid,
        addCategory,
        deleteCategory,
        updateSettings,
        toggleTheme,
        exportCsv,
        exportJson,
        importJson,
        resetAllToZero,
        clearTodayTransactions,
        guessCategoryForText,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
