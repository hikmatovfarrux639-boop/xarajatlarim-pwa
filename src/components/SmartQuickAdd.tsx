import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { CategoryIcon } from './CategoryIcon';
import { formatCurrency, formatNumber, parseFormattedNumber } from '../utils/formatters';
import {
  Zap,
  Send,
  CheckCircle2,
  RotateCcw,
  SlidersHorizontal,
  Keyboard,
  Check,
  Plus,
  Minus,
  Edit2,
  X,
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
  subItems: string[];
  defaultAmountUzs: number;
  amountsUzs: number[];
  amountsUsd: number[];
}

const QUICK_SCENARIOS: QuickScenario[] = [
  {
    id: 'meal',
    label: 'Ovqatlandim',
    emoji: '🍽️',
    categoryId: 'cat_cafe',
    color: '#ef4444',
    subItems: ['Tushlik', 'Nonushta', 'Kechki ovqat', 'Osh', 'Somsa / Lavash', 'Choyxona'],
    defaultAmountUzs: 20000,
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
    defaultAmountUzs: 15000,
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
    defaultAmountUzs: 10000,
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
    defaultAmountUzs: 50000,
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
    defaultAmountUzs: 15000,
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
    defaultAmountUzs: 30000,
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
    defaultAmountUzs: 25000,
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

  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('meal');
  const [selectedSubItem, setSelectedSubItem] = useState<string>('Tushlik');
  const [customItemMode, setCustomItemMode] = useState<boolean>(false);
  const [customItemText, setCustomItemText] = useState<string>('');

  // Selected live amount state (Default 20,000 for meal)
  const [selectedAmount, setSelectedAmount] = useState<number>(20000);
  const [isEditingAmountDirectly, setIsEditingAmountDirectly] = useState<boolean>(false);
  const [manualAmountInput, setManualAmountInput] = useState<string>('20 000');

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
    setCustomItemMode(false);
    setCustomItemText('');
    const baseAmt = activeWallet?.currency === 'USD' ? scen.amountsUsd[1] || 5 : scen.defaultAmountUzs;
    setSelectedAmount(baseAmt);
    setManualAmountInput(formatNumber(baseAmt));
  };

  // Click on a preset amount (e.g. 20k)
  const handlePresetClick = (amt: number) => {
    // If the user taps the SAME preset that was already active, save immediately!
    if (selectedAmount === amt) {
      handleSave(amt);
      return;
    }
    // Otherwise, set it as the new base amount so they can add +1k, +2k, +5k!
    setSelectedAmount(amt);
    setManualAmountInput(formatNumber(amt));
  };

  // Add / Subtract from the active amount (e.g. 20k + 5k + 2k = 27k)
  const handleIncrement = (delta: number) => {
    setSelectedAmount(prev => {
      const next = Math.max(0, prev + delta);
      setManualAmountInput(formatNumber(next));
      return next;
    });
  };

  // Direct manual amount typing
  const handleManualAmountChange = (val: string) => {
    const raw = parseFormattedNumber(val);
    setSelectedAmount(raw);
    setManualAmountInput(val.replace(/[^0-9]/g, ''));
  };

  const handleManualAmountBlur = () => {
    setIsEditingAmountDirectly(false);
    setManualAmountInput(formatNumber(selectedAmount));
  };

  // Save transaction
  const handleSave = (amountToSave = selectedAmount) => {
    if (!activeWallet || amountToSave <= 0) return;

    const finalTitle = customItemMode && customItemText.trim()
      ? customItemText.trim()
      : selectedSubItem || activeScenario.label;

    const created = addTransaction({
      type: 'expense',
      amount: amountToSave,
      currency: activeWallet.currency,
      walletId: activeWallet.id,
      categoryId: activeScenario.categoryId,
      title: finalTitle,
      date: new Date().toISOString(),
    });

    setLastAddedTx(created);
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

  // Uzbek step chips: +1k, +2k, +5k, +10k, +20k, +50k
  const stepChips = activeWallet?.currency === 'USD'
    ? [
        { label: '+$1', value: 1 },
        { label: '+$2', value: 2 },
        { label: '+$5', value: 5 },
        { label: '+$10', value: 10 },
        { label: '+$20', value: 20 },
      ]
    : [
        { label: '+1 ming', value: 1000 },
        { label: '+2 ming', value: 2000 },
        { label: '+5 ming', value: 5000 },
        { label: '+10 ming', value: 10000 },
        { label: '+20 ming', value: 20000 },
        { label: '+50 ming', value: 50000 },
      ];

  const formatShortAmount = (val: number) => {
    if (activeWallet?.currency === 'USD') return `$${val}`;
    if (val >= 1000) return `${val / 1000}k`;
    return `${val}`;
  };

  const activeTitle = customItemMode && customItemText.trim()
    ? customItemText.trim()
    : selectedSubItem || activeScenario.label;

  return (
    <div className="p-4 rounded-3xl bg-white dark:bg-[#111827] border-2 border-emerald-500/30 dark:border-emerald-500/25 shadow-lg shadow-emerald-500/5 space-y-3.5">
      {/* Top Header: Scenario Title + Hamyon Switcher + Keyboard & Modal Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
            <Zap size={14} className="fill-emerald-500" />
          </div>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
            Tezkor Xarajat
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {activeWallet && (
            <button
              type="button"
              onClick={handleCycleWallet}
              title="Hamyonni almashtirish"
              className="text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-1 transition-colors border border-slate-200/60 dark:border-slate-700"
            >
              <CategoryIcon name={activeWallet.icon} size={12} style={{ color: activeWallet.color }} />
              <span>{activeWallet.name}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowTextInput(!showTextInput)}
            title="Matn orqali kiritish"
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
            title="Batafsil / Bozorlik ro'yxati"
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-emerald-500 transition-colors"
          >
            <SlidersHorizontal size={14} />
          </button>
        </div>
      </div>

      {/* STEP 1: Main Category Scenario Tabs ("Ovqatlandim", "Yo'l / Taksi", "Do'kon", "Bozorlik"...) */}
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

      {/* STEP 2: Sub-item Pills + Custom Name Option */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex-shrink-0 mr-0.5">
          Nima:
        </span>
        {activeScenario.subItems.map((sub) => {
          const isSubSelected = !customItemMode && selectedSubItem === sub;
          return (
            <button
              key={sub}
              type="button"
              onClick={() => {
                setSelectedSubItem(sub);
                setCustomItemMode(false);
              }}
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

        {/* Custom title chip */}
        {customItemMode ? (
          <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500 rounded-xl px-2 py-0.5 flex-shrink-0">
            <input
              type="text"
              autoFocus
              placeholder="Nomini yozing..."
              value={customItemText}
              onChange={(e) => setCustomItemText(e.target.value)}
              className="text-[11px] bg-transparent text-emerald-700 dark:text-emerald-300 font-bold focus:outline-none w-28"
            />
            <button
              type="button"
              onClick={() => {
                setCustomItemMode(false);
                setCustomItemText('');
              }}
              className="text-slate-400 hover:text-rose-500"
            >
              <X size={12} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setCustomItemMode(true)}
            className="text-[11px] px-2 py-1 rounded-xl font-semibold whitespace-nowrap text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-dashed border-emerald-500/40 flex items-center gap-1"
          >
            <Plus size={11} /> Boshqa nom
          </button>
        )}
      </div>

      {/* STEP 3: LIVE AMOUNT & INTERACTIVE CALCULATION BLOCK */}
      <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 space-y-3">
        {/* Dynamic Amount Bar: Shows current sum with direct edit & clear */}
        <div className="flex items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-baseline gap-1.5 flex-1 min-w-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
              Summa:
            </span>
            {isEditingAmountDirectly ? (
              <input
                type="text"
                autoFocus
                inputMode="numeric"
                value={manualAmountInput}
                onChange={(e) => handleManualAmountChange(e.target.value)}
                onBlur={handleManualAmountBlur}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleManualAmountBlur();
                }}
                className="text-xl font-black text-slate-900 dark:text-white bg-transparent border-b-2 border-emerald-500 focus:outline-none w-36"
              />
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsEditingAmountDirectly(true);
                  setManualAmountInput(selectedAmount ? selectedAmount.toString() : '');
                }}
                className="text-xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                title="Summani qo'lda yozish uchun bosing"
              >
                <span>{formatCurrency(selectedAmount, activeWallet.currency)}</span>
                <Edit2 size={13} className="text-slate-400 opacity-60" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1">
            {selectedAmount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSelectedAmount(0);
                  setManualAmountInput('0');
                }}
                className="px-2 py-1 rounded-lg text-[10px] text-rose-500 font-bold hover:bg-rose-500/10 transition-colors flex items-center gap-0.5"
                title="Summani 0 ga tushirish"
              >
                <RotateCcw size={11} /> 0 qilish
              </button>
            )}
          </div>
        </div>

        {/* 1. Base Preset Amounts: Click once sets base, click twice immediately saves! */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Asosiy summani tanlang:
            </span>
            <span className="text-[10px] text-slate-400">
              (2 marta bosish = tezkor saqlash)
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {amountPresets.map((amt) => {
              const isActive = selectedAmount === amt;
              return (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handlePresetClick(amt)}
                  className={`py-2 px-2 rounded-xl text-xs font-black transition-all active:scale-95 flex items-center justify-center gap-1 ${
                    isActive
                      ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30 ring-2 ring-emerald-500 scale-[1.02]'
                      : 'bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:border-emerald-500'
                  }`}
                >
                  <span>{formatShortAmount(amt)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. THE DYNAMIC ACCUMULATOR ROW (+1k, +2k, +5k, +10k, +20k) */}
        {/* User can click 20k, then click +5k then +2k to easily get 27k! */}
        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
              Ustiga qo'shish (masalan: 20k + 5k + 2k):
            </span>
            {selectedAmount >= 1000 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleIncrement(activeWallet?.currency === 'USD' ? -1 : -1000)}
                  className="text-[10px] px-1.5 py-0.5 rounded-lg bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-rose-500/20 hover:text-rose-500 transition-colors"
                  title="1 ming ayirish"
                >
                  -1k
                </button>
                <button
                  type="button"
                  onClick={() => handleIncrement(activeWallet?.currency === 'USD' ? -5 : -5000)}
                  className="text-[10px] px-1.5 py-0.5 rounded-lg bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-rose-500/20 hover:text-rose-500 transition-colors"
                  title="5 ming ayirish"
                >
                  -5k
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {stepChips.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => handleIncrement(chip.value)}
                className="flex-1 min-w-[58px] py-1.5 px-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 hover:text-white dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs font-black transition-all active:scale-95 border border-emerald-500/25 flex items-center justify-center whitespace-nowrap"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. BIG PRIMARY SAVE BUTTON */}
        <button
          type="button"
          onClick={() => handleSave()}
          disabled={selectedAmount <= 0}
          className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] ${
            selectedAmount > 0
              ? 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-emerald-500/25 ring-2 ring-emerald-400/40'
              : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none'
          }`}
        >
          <Check size={18} className="stroke-[3]" />
          <span>
            {selectedAmount > 0
              ? `Saqlash: ${activeTitle} (${formatCurrency(selectedAmount, activeWallet.currency)})`
              : "Iltimos, summani tanlang"}
          </span>
        </button>
      </div>

      {/* Optional Free-text Input Bar ("Go'sht 95k, Non 10k") */}
      {showTextInput && (
        <form onSubmit={handleTextSubmit} className="pt-1 flex items-center gap-2 animate-in fade-in duration-150">
          <input
            type="text"
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='Yozib kiritish: "Tushlik 27k, Non 5k"'
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

      {/* Instant Undo Banner */}
      {lastAddedTx && (
        <div className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-xs animate-in fade-in duration-150 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-200 font-bold truncate">
            <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
            <span className="truncate">
              Qo'shildi: <strong>{lastAddedTx.title}</strong> (-{formatCurrency(lastAddedTx.amount, lastAddedTx.currency)})
            </span>
          </div>
          <button
            type="button"
            onClick={handleUndo}
            className="ml-2 text-[11px] font-black text-rose-500 hover:text-rose-600 hover:underline flex items-center gap-1 flex-shrink-0"
          >
            <RotateCcw size={12} /> Bekor qilish
          </button>
        </div>
      )}
    </div>
  );
};
