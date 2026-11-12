import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { CategoryIcon } from './CategoryIcon';
import { formatCurrency } from '../utils/formatters';
import {
  Zap,
  Send,
  CheckCircle2,
  RotateCcw,
  SlidersHorizontal,
  Keyboard,
  Check,
  Plus,
} from 'lucide-react';
import { ExpenseItem, Transaction } from '../types/finance';

interface SmartQuickAddProps {
  onOpenFullModal: () => void;
}

interface QuickScenario {
  id: string;
  label: string;
  emoji: string;
  categoryId: string;
  color: string;
  subItems: string[]; // Tayyor nima olingani variantlari
  amountsUzs: number[]; // Shu bo'limga mos asosiy summa oraliqlari
  amountsUsd: number[];
}

// Kundalik eng ko'p ishlatiladigan tayyor bo'limlar va ularga mos summa oraliqlari
const QUICK_SCENARIOS: QuickScenario[] = [
  {
    id: 'meal',
    label: 'Ovqatlandim',
    emoji: '🍽️',
    categoryId: 'cat_cafe',
    color: '#ef4444',
    subItems: ['Tushlik', 'Nonushta', 'Kechki ovqat', 'Osh', 'Somsa / Lavash', 'Choyxona'],
    amountsUzs: [15000, 20000, 25000, 30000, 35000, 40000, 50000, 70000, 100000],
    amountsUsd: [3, 5, 8, 10, 15, 20, 30],
  },
  {
    id: 'taxi',
    label: "Yo'l / Taksi",
    emoji: '🚕',
    categoryId: 'cat_transport',
    color: '#3b82f6',
    subItems: ['Taksi', 'Avtobus / Metro', "Yo'l kira", 'Benzin / Metan', 'Parkovka'],
    amountsUzs: [2000, 5000, 10000, 15000, 20000, 25000, 30000, 40000, 50000],
    amountsUsd: [1, 2, 3, 5, 10, 15],
  },
  {
    id: 'daily_shop',
    label: "Do'kon / Non-Suv",
    emoji: '🥖',
    categoryId: 'cat_food',
    color: '#f59e0b',
    subItems: ['Non', 'Suv / Ichimlik', 'Sut / Qatiq', 'Shirinlik / Meva', 'Muzqaymoq', 'Tuxum'],
    amountsUzs: [3000, 5000, 8000, 10000, 15000, 20000, 25000, 30000, 50000],
    amountsUsd: [1, 2, 3, 5, 8, 10],
  },
  {
    id: 'market',
    label: 'Bozorlik',
    emoji: '🛒',
    categoryId: 'cat_food',
    color: '#10b981',
    subItems: ['Bozorlik', "Go'sht", 'Meva-sabzavot', 'Supermarket', "Ro'zg'or"],
    amountsUzs: [30000, 50000, 75000, 100000, 150000, 200000, 300000, 500000],
    amountsUsd: [10, 20, 30, 50, 100],
  },
  {
    id: 'coffee',
    label: 'Choy / Qahva',
    emoji: '☕',
    categoryId: 'cat_cafe',
    color: '#8b5cf6',
    subItems: ['Qahva (Coffee)', 'Choy va shirinlik', 'Salqin ichimlik'],
    amountsUzs: [5000, 10000, 15000, 20000, 25000, 30000, 40000],
    amountsUsd: [1, 2, 3, 5, 8],
  },
  {
    id: 'phone_net',
    label: 'Aloqa / Uy',
    emoji: '📱',
    categoryId: 'cat_phone',
    color: '#06b6d4',
    subItems: ['Telefon hisobi', 'Internet', 'Elektr / Gaz', 'Kommunal'],
    amountsUzs: [10000, 20000, 30000, 50000, 70000, 100000, 150000],
    amountsUsd: [2, 5, 10, 15, 20],
  },
  {
    id: 'health',
    label: 'Dorixona',
    emoji: '💊',
    categoryId: 'cat_health',
    color: '#ec4899',
    subItems: ['Dori-darmon', 'Shifokor', 'Gigiyena'],
    amountsUzs: [10000, 20000, 30000, 50000, 75000, 100000, 150000, 200000],
    amountsUsd: [3, 5, 10, 20, 30],
  },
];

function parseSmartSegment(segment: string): { name: string; amount: number } | null {
  const clean = segment.trim();
  if (!clean) return null;

  const regex = /(?:^|\s)(\d+(?:[.,]\d+)?)\s*(k|ming|mln)?(?=\s|$)/gi;
  const matches = Array.from(clean.matchAll(regex));
  if (matches.length === 0) return null;

  const priceMatch = matches[matches.length - 1];
  const fullMatchedStr = priceMatch[0];
  const numVal = parseFloat(priceMatch[1].replace(',', '.'));
  const suffix = (priceMatch[2] || '').toLowerCase();

  if (isNaN(numVal) || numVal <= 0) return null;

  let multiplier = 1;
  if (suffix === 'k' || suffix === 'ming') multiplier = 1000;
  else if (suffix === 'mln') multiplier = 1000000;

  const amount = Math.round(numVal * multiplier);
  const matchIndex = priceMatch.index || 0;
  const rawName = (
    clean.slice(0, matchIndex) + ' ' + clean.slice(matchIndex + fullMatchedStr.length)
  )
    .replace(/\s+/g, ' ')
    .replace(/^[-—:,.\s]+|[-—:,.\s]+$/g, '')
    .trim();

  return {
    name: rawName || 'Xarajat',
    amount,
  };
}

export const SmartQuickAdd: React.FC<SmartQuickAddProps> = ({ onOpenFullModal }) => {
  const {
    wallets,
    categories,
    addTransaction,
    deleteTransaction,
    guessCategoryForText,
  } = useFinance();

  // Active Scenario ("Ovqatlandim", "Yo'l / Taksi", etc.)
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('meal');
  const [selectedSubItem, setSelectedSubItem] = useState<string>('Tushlik');
  const [accumulatedAmount, setAccumulatedAmount] = useState<number>(0);
  const [showTextInput, setShowTextInput] = useState<boolean>(false);

  const [input, setInput] = useState<string>('');
  const [selectedWalletId, setSelectedWalletId] = useState<string>(
    () => wallets.find(w => w.id === 'wallet_card')?.id || wallets[0]?.id || ''
  );
  const [lastAddedTx, setLastAddedTx] = useState<Transaction | null>(null);

  const activeWallet = wallets.find(w => w.id === selectedWalletId) || wallets[0];
  const activeScenario = QUICK_SCENARIOS.find(s => s.id === selectedScenarioId) || QUICK_SCENARIOS[0];

  const handleSelectScenario = (scen: QuickScenario) => {
    setSelectedScenarioId(scen.id);
    setSelectedSubItem(scen.subItems[0]);
    setAccumulatedAmount(0);
  };

  // Instant 1-tap save when clicking an amount button!
  const handleInstantSaveAmount = (amount: number) => {
    if (!activeWallet || amount <= 0) return;

    const created = addTransaction({
      type: 'expense',
      amount,
      currency: activeWallet.currency,
      walletId: activeWallet.id,
      categoryId: activeScenario.categoryId,
      title: selectedSubItem || activeScenario.label,
      date: new Date().toISOString(),
    });

    setLastAddedTx(created);
    setAccumulatedAmount(0);
  };

  // Add to accumulated amount (if user wants e.g. 20k + 5k = 25k)
  const handleAccumulate = (delta: number) => {
    setAccumulatedAmount(prev => Math.max(0, prev + delta));
  };

  // Text input parser
  const parsedText = useMemo(() => {
    const trimmed = input.trim();
    if (!trimmed) return { isValid: false, title: '', amount: 0, categoryId: activeScenario.categoryId };

    if (trimmed.includes(',')) {
      const parts = trimmed.split(',').map(p => p.trim()).filter(Boolean);
      const parsedItems: ExpenseItem[] = [];
      parts.forEach((p, idx) => {
        const res = parseSmartSegment(p);
        if (res && res.amount > 0) {
          parsedItems.push({
            id: `quick_${idx}`,
            name: res.name.charAt(0).toUpperCase() + res.name.slice(1),
            price: res.amount,
          });
        }
      });

      if (parsedItems.length > 0) {
        const total = parsedItems.reduce((s, i) => s + i.price, 0);
        const combinedTitle = parsedItems.map(i => i.name).slice(0, 3).join(', ');
        return {
          isValid: true,
          title: combinedTitle,
          amount: total,
          categoryId: guessCategoryForText(combinedTitle),
          items: parsedItems.length > 1 ? parsedItems : undefined,
        };
      }
    }

    const single = parseSmartSegment(trimmed);
    if (!single) return { isValid: false, title: trimmed, amount: 0, categoryId: activeScenario.categoryId };

    const formattedTitle = single.name.charAt(0).toUpperCase() + single.name.slice(1);
    return {
      isValid: true,
      title: formattedTitle,
      amount: single.amount,
      categoryId: guessCategoryForText(formattedTitle),
    };
  }, [input, activeScenario.categoryId, guessCategoryForText]);

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsedText.isValid || parsedText.amount <= 0 || !activeWallet) return;

    const created = addTransaction({
      type: 'expense',
      amount: parsedText.amount,
      currency: activeWallet.currency,
      walletId: activeWallet.id,
      categoryId: parsedText.categoryId,
      title: parsedText.title,
      items: parsedText.items,
      date: new Date().toISOString(),
    });

    setLastAddedTx(created);
    setInput('');
  };

  const handleCycleWallet = () => {
    const idx = wallets.findIndex(w => w.id === activeWallet?.id);
    const nextWallet = wallets[(idx + 1) % wallets.length];
    if (nextWallet) setSelectedWalletId(nextWallet.id);
  };

  const handleUndo = () => {
    if (lastAddedTx) {
      deleteTransaction(lastAddedTx.id);
      setLastAddedTx(null);
    }
  };

  const amountPresets = activeWallet?.currency === 'USD'
    ? activeScenario.amountsUsd
    : activeScenario.amountsUzs;

  const formatShortAmount = (val: number) => {
    if (activeWallet?.currency === 'USD') return `$${val}`;
    if (val >= 1000) return `${val / 1000} ming`;
    return `${val}`;
  };

  return (
    <div className="p-4 rounded-3xl bg-white dark:bg-[#111827] border-2 border-emerald-500/30 dark:border-emerald-500/25 shadow-lg shadow-emerald-500/5 space-y-3.5">
      {/* Top Bar: Title + Wallet Switcher + Keyboard/Modal Toggles */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
            <Zap size={14} className="fill-emerald-500" />
          </div>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
            Tezkor Xarajat (Tanlang va summani bosing)
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {activeWallet && (
            <button
              type="button"
              onClick={handleCycleWallet}
              title="Hamyonni almashtirish uchun bosing"
              className="text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1 transition-colors border border-slate-200/60 dark:border-slate-700"
            >
              <CategoryIcon name={activeWallet.icon} size={12} style={{ color: activeWallet.color }} />
              <span>{activeWallet.name}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowTextInput(!showTextInput)}
            title="Yozib kiritish"
            className={`p-1.5 rounded-xl transition-colors ${
              showTextInput
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-emerald-500'
            }`}
          >
            <Keyboard size={14} />
          </button>

          <button
            type="button"
            onClick={onOpenFullModal}
            title="Batafsil oyna / Bozorlik ro'yxati"
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-emerald-500 transition-colors"
          >
            <SlidersHorizontal size={14} />
          </button>
        </div>
      </div>

      {/* STEP 1: Main Scenario Buttons ("Ovqatlandim", "Yo'l / Taksi", "Do'kon", "Bozorlik"...) */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {QUICK_SCENARIOS.map((scen) => {
          const isSelected = scen.id === activeScenario.id;
          return (
            <button
              key={scen.id}
              type="button"
              onClick={() => handleSelectScenario(scen)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all active:scale-95 ${
                isSelected
                  ? 'text-white shadow-md scale-[1.02]'
                  : 'bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              style={
                isSelected
                  ? { backgroundColor: scen.color, boxShadow: `0 6px 16px -4px ${scen.color}66` }
                  : undefined
              }
            >
              <span className="text-sm">{scen.emoji}</span>
              <span>{scen.label}</span>
            </button>
          );
        })}
      </div>

      {/* STEP 2: Sub-item pills ("Tushlik", "Kechki ovqat", "Osh"...) */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex-shrink-0 mr-0.5">
          Nima:
        </span>
        {activeScenario.subItems.map((sub) => {
          const isSubSelected = selectedSubItem === sub;
          return (
            <button
              key={sub}
              type="button"
              onClick={() => setSelectedSubItem(sub)}
              className={`text-[11px] px-2.5 py-1 rounded-xl font-semibold whitespace-nowrap transition-all ${
                isSubSelected
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border border-slate-200/70 dark:border-slate-700/70 hover:border-slate-400'
              }`}
            >
              {sub}
            </button>
          );
        })}
      </div>

      {/* STEP 3: Ready Amount Interval Buttons (15 ming, 20 ming, 30 ming...) */}
      <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            Summani bosing — <strong className="text-slate-800 dark:text-slate-200">{selectedSubItem}</strong> darhol saqlanadi:
          </span>
          {accumulatedAmount > 0 && (
            <button
              type="button"
              onClick={() => setAccumulatedAmount(0)}
              className="text-[10px] text-rose-500 font-semibold hover:underline"
            >
              Tozalash
            </button>
          )}
        </div>

        {/* Grid of Preset Amounts (1-Tap Instant Save) */}
        <div className="grid grid-cols-3 gap-2">
          {amountPresets.map((amt) => (
            <button
              key={amt}
              type="button"
              onClick={() => handleInstantSaveAmount(amt)}
              className="py-2.5 px-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-500 dark:hover:text-white border border-slate-200/90 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-extrabold text-xs shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1 group"
            >
              <span>{formatShortAmount(amt)}</span>
            </button>
          ))}
        </div>

        {/* Custom Accumulator Row (+5k, +10k, +50k -> Save) for non-standard amounts like 23 000 or 35 000 */}
        <div className="pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            <span className="text-[10px] text-slate-400 mr-1 flex-shrink-0">Yig'ish:</span>
            {(activeWallet?.currency === 'USD' ? [1, 5, 10] : [1000, 5000, 10000, 50000]).map((step) => (
              <button
                key={step}
                type="button"
                onClick={() => handleAccumulate(step)}
                className="text-[11px] px-2 py-1 rounded-lg bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-500/20 hover:text-emerald-500 font-bold whitespace-nowrap active:scale-95"
              >
                +{activeWallet?.currency === 'USD' ? `$${step}` : `${step / 1000}k`}
              </button>
            ))}
          </div>

          {accumulatedAmount > 0 && (
            <button
              type="button"
              onClick={() => handleInstantSaveAmount(accumulatedAmount)}
              className="px-3 py-1.5 rounded-xl bg-emerald-500 text-white text-xs font-extrabold shadow-md shadow-emerald-500/25 flex items-center gap-1 flex-shrink-0 animate-in zoom-in-95 duration-150"
            >
              <Check size={13} className="stroke-[3]" />
              <span>{formatShortAmount(accumulatedAmount)} Saqlash</span>
            </button>
          )}
        </div>
      </div>

      {/* Optional Keyboard Input (Toggled via Keyboard icon or when typing custom items) */}
      {showTextInput && (
        <form onSubmit={handleTextSubmit} className="pt-1 flex items-center gap-2 animate-in fade-in duration-150">
          <input
            type="text"
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='Yozib kiritish: "Go&#39;sht 95k, Non 10k"'
            className="flex-1 text-xs pl-3.5 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
          />
          <button
            type="submit"
            disabled={!parsedText.isValid}
            className={`px-3.5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all ${
              parsedText.isValid
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Send size={13} />
            <span>Qo'shish</span>
          </button>
        </form>
      )}

      {/* Undo Banner right after saving */}
      {lastAddedTx && (
        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-medium truncate">
            <CheckCircle2 size={15} className="text-emerald-500 flex-shrink-0" />
            <span className="truncate">
              Qo'shildi: <strong>{lastAddedTx.title}</strong> (-{formatCurrency(lastAddedTx.amount, lastAddedTx.currency)})
            </span>
          </div>
          <button
            type="button"
            onClick={handleUndo}
            className="ml-2 text-[11px] font-bold text-rose-500 hover:underline flex items-center gap-1 flex-shrink-0"
          >
            <RotateCcw size={12} /> Bekor qilish
          </button>
        </div>
      )}
    </div>
  );
};
