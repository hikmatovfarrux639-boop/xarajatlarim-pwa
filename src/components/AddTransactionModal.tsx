import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, ListPlus, Zap, Check, RotateCcw, CalendarClock, Repeat } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { ExpenseItem, Transaction } from '../types/finance';
import { CategoryIcon } from './CategoryIcon';
import { toInputDate, formatCurrency, formatNumber } from '../utils/formatters';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTransaction?: Transaction | null;
}

const CATEGORY_PRESETS: Record<
  string,
  { titles: string[]; amountsUzs: number[]; amountsUsd: number[] }
> = {
  cat_cafe: {
    titles: ['Tushlik', 'Kechki ovqat', 'Nonushta', 'Osh', 'Somsa / Lavash', 'Qahva / Choy', 'Choyxona'],
    amountsUzs: [15000, 20000, 25000, 30000, 35000, 40000, 50000, 75000, 100000],
    amountsUsd: [3, 5, 8, 10, 15, 20, 30],
  },
  cat_food: {
    titles: ['Bozorlik', 'Non va suv', "Do'kon xarid", "Go'sht", 'Meva-sabzavot', 'Sut-qatiq', 'Shirinlik'],
    amountsUzs: [5000, 10000, 15000, 20000, 30000, 50000, 100000, 150000, 200000],
    amountsUsd: [2, 5, 10, 20, 30, 50, 100],
  },
  cat_transport: {
    titles: ['Taksi', 'Avtobus / Metro', "Yo'l kira", 'Benzin / Metan', 'Moyka / Servis', 'Parkovka'],
    amountsUzs: [2000, 5000, 10000, 15000, 20000, 25000, 30000, 50000, 100000],
    amountsUsd: [1, 2, 3, 5, 10, 20],
  },
  cat_home: {
    titles: ['Elektr energiya', 'Tabiiy gaz', 'Suv / Axlat', "Uy-ro'zg'or buyumlari", 'Ijara / Kvartira'],
    amountsUzs: [20000, 30000, 50000, 100000, 150000, 200000, 300000, 500000],
    amountsUsd: [10, 20, 50, 100, 200, 300],
  },
  cat_phone: {
    titles: ['Telefon hisobi', 'Oylik tarif', 'Uy interneti (Wi-Fi)'],
    amountsUzs: [10000, 20000, 30000, 50000, 70000, 100000, 150000],
    amountsUsd: [2, 5, 10, 15, 20],
  },
  cat_health: {
    titles: ['Dori-darmon', "Shifokor ko'rigi", 'Tish shifokori', 'Vitaminlar', 'Gigiyena'],
    amountsUzs: [15000, 25000, 40000, 50000, 75000, 100000, 150000, 250000],
    amountsUsd: [5, 10, 20, 30, 50],
  },
  cat_clothes: {
    titles: ['Kiyim-kechak', 'Oyoq kiyim', "Ko'ylak / Futbolka", 'Shim'],
    amountsUzs: [50000, 100000, 150000, 200000, 300000, 400000, 500000],
    amountsUsd: [10, 20, 30, 50, 100],
  },
  cat_entertainment: {
    titles: ['Dam olish', "Bog' / Park", "Kino / O'yin", "Sovg'a"],
    amountsUzs: [20000, 30000, 50000, 100000, 150000, 200000, 300000],
    amountsUsd: [5, 10, 20, 30, 50],
  },
};

const BOZORLIK_QUICK_ITEMS = [
  { name: 'Non (2 ta)', price: 10000 },
  { name: 'Sut / Qatiq', price: 14000 },
  { name: 'Tuxum (10 ta)', price: 18000 },
  { name: 'Kartoshka (2 kg)', price: 14000 },
  { name: 'Piyoz / Sabzi', price: 10000 },
  { name: "Mol go'shti (1 kg)", price: 95000 },
  { name: "O'simlik yog'i", price: 24000 },
  { name: 'Mevalar', price: 30000 },
  { name: 'Suv / Ichimlik', price: 12000 },
  { name: 'Shirinlik / Choy', price: 25000 },
];

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  editingTransaction,
}) => {
  const {
    wallets,
    categories,
    addTransaction,
    updateTransaction,
    addPlannedPayment,
    guessCategoryForText,
  } = useFinance();

  // 'expense' (Kunlik xarajat) vs 'reminder' (Kelajakdagi to'lov eslatmasi)
  const [tabMode, setTabMode] = useState<'expense' | 'reminder'>('expense');
  const [isChecklistMode, setIsChecklistMode] = useState<boolean>(false);

  const [amountStr, setAmountStr] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [selectedWalletId, setSelectedWalletId] = useState<string>('wallet_card');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('cat_cafe');
  const [manualCatSelected, setManualCatSelected] = useState<boolean>(false);
  const [date, setDate] = useState<string>(toInputDate(new Date()));

  // Planned reminder extra fields
  const [dueDate, setDueDate] = useState<string>(() => toInputDate(new Date(Date.now() + 86400000)));
  const [isRecurringMonthly, setIsRecurringMonthly] = useState<boolean>(true);
  const [notifyDaysBefore, setNotifyDaysBefore] = useState<number>(1);

  const [items, setItems] = useState<ExpenseItem[]>([{ id: '1', name: '', price: 0 }]);

  useEffect(() => {
    if (!isOpen) return;

    if (editingTransaction) {
      setTabMode('expense');
      setAmountStr(editingTransaction.amount.toString());
      setTitle(editingTransaction.title);
      setNote(editingTransaction.note || '');
      setSelectedWalletId(editingTransaction.walletId);
      setSelectedCategoryId(editingTransaction.categoryId);
      setManualCatSelected(true);
      setDate(toInputDate(new Date(editingTransaction.date)));
      if (editingTransaction.items && editingTransaction.items.length > 0) {
        setIsChecklistMode(true);
        setItems(editingTransaction.items);
      } else {
        setIsChecklistMode(false);
        setItems([{ id: '1', name: '', price: 0 }]);
      }
    } else {
      setTabMode('expense');
      setAmountStr('');
      setTitle('');
      setNote('');
      setSelectedWalletId('wallet_card');
      setSelectedCategoryId('cat_cafe');
      setManualCatSelected(false);
      setDate(toInputDate(new Date()));
      setIsChecklistMode(false);
      setItems([{ id: '1', name: '', price: 0 }]);
    }
  }, [isOpen, editingTransaction]);

  if (!isOpen) return null;

  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const activeCategoryId = selectedCategoryId || expenseCategories[0]?.id || 'cat_cafe';
  const selectedWallet = wallets.find((w) => w.id === selectedWalletId) || wallets[0];

  const checklistTotal = items.reduce((sum, item) => sum + (Number(item.price) || 0), 0);
  const rawAmount = parseFloat(amountStr.replace(/\s/g, '')) || 0;
  const currentTotal = isChecklistMode ? checklistTotal : rawAmount;

  const formattedDisplayAmount = amountStr
    ? amountStr.endsWith('.')
      ? formatNumber(rawAmount) + '.'
      : formatNumber(rawAmount)
    : '';

  const handleAmountChange = (val: string) => {
    const clean = val.replace(/[^0-9.]/g, '');
    setAmountStr(clean);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!manualCatSelected && val.trim().length >= 3) {
      const guessed = guessCategoryForText(val);
      if (guessed) setSelectedCategoryId(guessed);
    }
  };

  const currentPreset = CATEGORY_PRESETS[activeCategoryId] || {
    titles: ['Xarajat', 'Bozorlik', 'Tushlik', 'Taksi'],
    amountsUzs: [10000, 15000, 20000, 25000, 30000, 40000, 50000, 100000],
    amountsUsd: [2, 5, 10, 20, 30, 50, 100],
  };

  const presetAmounts = selectedWallet?.currency === 'USD'
    ? currentPreset.amountsUsd
    : currentPreset.amountsUzs;

  const handleAddItem = () => {
    setItems([...items, { id: Date.now().toString(), name: '', price: 0 }]);
  };

  const handleQuickAddBozorlikChip = (chip: { name: string; price: number }) => {
    if (items.length === 1 && !items[0].name.trim() && !items[0].price) {
      setItems([{ id: Date.now().toString(), name: chip.name, price: chip.price }]);
    } else {
      setItems([...items, { id: Date.now().toString(), name: chip.name, price: chip.price }]);
    }
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      setItems([{ id: '1', name: '', price: 0 }]);
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: 'name' | 'price', value: any) => {
    const updated = [...items];
    if (field === 'price') {
      updated[index].price = parseFloat(value) || 0;
    } else {
      updated[index].name = value;
      if (index === 0 && !manualCatSelected && value.trim().length >= 3) {
        setSelectedCategoryId(guessCategoryForText(value));
      }
    }
    setItems(updated);
  };

  const buildAccurateIsoDate = (dateInput: string): string => {
    const now = new Date();
    const todayStr = toInputDate(now);
    if (dateInput === todayStr) return now.toISOString();
    const [y, m, d] = dateInput.split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1, now.getHours(), now.getMinutes()).toISOString();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentTotal <= 0) return;

    let finalTitle = title.trim();
    if (!finalTitle) {
      if (isChecklistMode && items.some(i => i.name.trim())) {
        finalTitle = items.map(i => i.name.trim()).filter(Boolean).slice(0, 3).join(', ');
      } else {
        const cat = categories.find(c => c.id === activeCategoryId);
        finalTitle = cat ? cat.name : 'Xarajat';
      }
    }

    if (tabMode === 'reminder') {
      addPlannedPayment({
        title: finalTitle,
        amount: currentTotal,
        currency: selectedWallet?.currency || 'UZS',
        categoryId: activeCategoryId,
        dueDate,
        isRecurringMonthly,
        notifyDaysBefore,
      });
      onClose();
      return;
    }

    const validItems = isChecklistMode
      ? items.filter(i => i.name.trim() || i.price > 0)
      : undefined;

    const finalDateIso = editingTransaction && toInputDate(new Date(editingTransaction.date)) === date
      ? editingTransaction.date
      : buildAccurateIsoDate(date);

    if (editingTransaction) {
      updateTransaction({
        ...editingTransaction,
        type: 'expense',
        amount: currentTotal,
        currency: selectedWallet.currency,
        walletId: selectedWallet.id,
        categoryId: activeCategoryId,
        title: finalTitle,
        note: note.trim() || undefined,
        items: validItems && validItems.length > 0 ? validItems : undefined,
        date: finalDateIso,
      });
    } else {
      addTransaction({
        type: 'expense',
        amount: currentTotal,
        currency: selectedWallet.currency,
        walletId: selectedWallet.id,
        categoryId: activeCategoryId,
        title: finalTitle,
        note: note.trim() || undefined,
        items: validItems && validItems.length > 0 ? validItems : undefined,
        date: finalDateIso,
      });
    }

    onClose();
  };

  const formatShortChip = (val: number) => {
    if (selectedWallet?.currency === 'USD') return `$${val}`;
    if (val >= 1000000) return `${val / 1000000} mln`;
    if (val >= 1000) return `${val / 1000} ming`;
    return `${val}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-[#111827] rounded-t-3xl sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header: Daily Expense vs Scheduled Payment Reminder */}
        <div className="px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex-1">
            <button
              type="button"
              onClick={() => setTabMode('expense')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                tabMode === 'expense'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              🛒 Bugungi xarajat
            </button>
            {!editingTransaction && (
              <button
                type="button"
                onClick={() => {
                  setTabMode('reminder');
                  setIsChecklistMode(false);
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  tabMode === 'reminder'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                ⏰ To'lov eslatmasi
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* 1. Category Picker */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
                1. Bo'limni tanlang:
              </label>
              {tabMode === 'expense' && (
                <button
                  type="button"
                  onClick={() => {
                    setIsChecklistMode(!isChecklistMode);
                    if (!isChecklistMode) setSelectedCategoryId('cat_food');
                  }}
                  className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 flex items-center gap-1"
                >
                  {isChecklistMode ? <Zap size={12} /> : <ListPlus size={12} />}
                  {isChecklistMode ? "Oddiy rejimga o'tish" : "Bozorlik ro'yxati rejimi"}
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 max-h-36 overflow-y-auto p-0.5">
              {expenseCategories.map((c) => {
                const isSelected = c.id === activeCategoryId;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategoryId(c.id);
                      setManualCatSelected(true);
                    }}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500'
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-white"
                      style={{ backgroundColor: c.color }}
                    >
                      <CategoryIcon name={c.icon} size={13} />
                    </div>
                    <span className="text-[11px] font-semibold truncate">{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. What was bought / Payment title */}
          {!isChecklistMode && (
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                2. {tabMode === 'reminder' ? "Qanday to'lov?" : 'Nima olindi?'}
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {currentPreset.titles.map((t) => {
                  const isTitleSelected = title.toLowerCase() === t.toLowerCase();
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTitle(t)}
                      className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition-all active:scale-95 ${
                        isTitleSelected
                          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-500/15 hover:text-emerald-500'
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>

              <input
                type="text"
                placeholder="Yoki nomini yozing..."
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

          {/* 3. Amount Selection OR Checklist Mode */}
          {!isChecklistMode ? (
            <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  3. Summani tanlang yoki yozing ({selectedWallet?.currency}):
                </span>
                {rawAmount > 0 && (
                  <button
                    type="button"
                    onClick={() => setAmountStr('')}
                    className="text-xs text-rose-500 font-semibold flex items-center gap-1 hover:underline"
                  >
                    <RotateCcw size={12} /> Tozalash
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                {presetAmounts.map((amt) => {
                  const isAmtSelected = rawAmount === amt;
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleAmountChange(amt.toString())}
                      className={`py-2 px-2 rounded-xl text-xs font-extrabold transition-all active:scale-95 ${
                        isAmtSelected
                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:border-emerald-500'
                      }`}
                    >
                      {formatShortChip(amt)}
                    </button>
                  );
                })}
              </div>

              {/* Amount input & quick adjustment */}
              <div className="pt-1 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0"
                      value={formattedDisplayAmount}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      className="w-full text-2xl font-black px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="absolute right-3.5 top-3.5 text-xs font-bold text-slate-400">
                      {selectedWallet?.currency}
                    </span>
                  </div>

                  {rawAmount >= 1000 && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleAmountChange(Math.max(0, rawAmount - (selectedWallet?.currency === 'USD' ? 1 : 1000)).toString())}
                        className="px-2.5 py-2.5 rounded-xl bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-rose-500 hover:text-white transition-colors"
                        title="1 ming ayirish"
                      >
                        -1k
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAmountChange(Math.max(0, rawAmount - (selectedWallet?.currency === 'USD' ? 5 : 5000)).toString())}
                        className="px-2.5 py-2.5 rounded-xl bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-rose-500 hover:text-white transition-colors"
                        title="5 ming ayirish"
                      >
                        -5k
                      </button>
                    </div>
                  )}
                </div>

                {/* Ustiga qo'shish tugmalari (+1k, +2k, +5k, +10k, +20k, +50k) */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase mr-0.5 flex-shrink-0">
                    Qo'shish:
                  </span>
                  {(selectedWallet?.currency === 'USD'
                    ? [1, 2, 5, 10, 20]
                    : [1000, 2000, 5000, 10000, 20000, 50000]
                  ).map((inc) => (
                    <button
                      key={inc}
                      type="button"
                      onClick={() => handleAmountChange((rawAmount + inc).toString())}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 hover:text-white text-emerald-700 dark:text-emerald-300 dark:bg-emerald-500/15 text-xs font-black transition-all active:scale-95 border border-emerald-500/25 whitespace-nowrap"
                    >
                      +{selectedWallet?.currency === 'USD' ? `$${inc}` : `${inc >= 1000 ? inc / 1000 : inc}k`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
                  Tayyor mahsulotlarni bosing:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {BOZORLIK_QUICK_ITEMS.map((chip) => (
                    <button
                      key={chip.name}
                      type="button"
                      onClick={() => handleQuickAddBozorlikChip(chip)}
                      className="text-[11px] px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-500 font-semibold active:scale-95 transition-all"
                    >
                      + {chip.name} <span className="opacity-60">({chip.price / 1000}k)</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-200/70 dark:border-slate-700/70">
                {items.map((item, idx) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={`Mahsulot ${idx + 1}`}
                      value={item.name}
                      onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                      className="flex-1 text-xs px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                    />
                    <input
                      type="number"
                      inputMode="decimal"
                      placeholder="Narxi"
                      value={item.price || ''}
                      onChange={(e) => handleItemChange(idx, 'price', e.target.value)}
                      className="w-28 text-xs px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-right font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1.5 text-rose-400 hover:text-rose-600 rounded-lg"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:underline"
                  >
                    <Plus size={14} /> Qator qo'shish
                  </button>
                  <span className="text-sm font-black text-slate-900 dark:text-white">
                    Jami: {formatCurrency(checklistTotal, selectedWallet?.currency || 'UZS')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Reminder Schedule Settings OR Daily Payment Type & Date */}
          {tabMode === 'reminder' ? (
            <div className="space-y-3 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-amber-800 dark:text-amber-300 mb-1">
                    To'lov sanasi (Qachon?)
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-500/30 text-slate-800 dark:text-white font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-amber-800 dark:text-amber-300 mb-1">
                    Eslatish vaqti
                  </label>
                  <select
                    value={notifyDaysBefore}
                    onChange={(e) => setNotifyDaysBefore(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-500/30 text-slate-800 dark:text-white font-semibold"
                  >
                    <option value={1}>1 kun oldin</option>
                    <option value={2}>2 kun oldin</option>
                    <option value={3}>3 kun oldin</option>
                  </select>
                </div>
              </div>

              <label className="flex items-center justify-between pt-1 cursor-pointer">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <Repeat size={14} /> Har oyda shu sanada takrorlansin
                </span>
                <input
                  type="checkbox"
                  checked={isRecurringMonthly}
                  onChange={(e) => setIsRecurringMonthly(e.target.checked)}
                  className="w-4 h-4 accent-amber-500 rounded"
                />
              </label>
            </div>
          ) : (
            <>
              {/* Payment Method (Simple Card / Cash / USD badge without fake balances) */}
              <div className="grid grid-cols-3 gap-2">
                {wallets.map((w) => {
                  const isSelected = w.id === selectedWallet?.id;
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => setSelectedWalletId(w.id)}
                      className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <CategoryIcon name={w.icon} size={14} style={{ color: w.color }} />
                      <span className="truncate">{w.name.split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>

              {/* Date & Note */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Sana
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Izoh (ixtiyoriy)
                  </label>
                  <input
                    type="text"
                    placeholder="Qo'shimcha..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>
              </div>
            </>
          )}

          {/* Submit Button */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={currentTotal <= 0}
              className={`w-full py-3.5 px-4 rounded-2xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                currentTotal <= 0
                  ? 'bg-slate-400 cursor-not-allowed opacity-60'
                  : tabMode === 'reminder'
                  ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/30'
                  : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/30'
              }`}
            >
              {tabMode === 'reminder' ? <CalendarClock size={19} /> : <Check size={20} className="stroke-[3]" />}
              {editingTransaction
                ? "O'zgarishlarni saqlash"
                : tabMode === 'reminder'
                ? "To'lov eslatmasini saqlash"
                : `${currentTotal > 0 ? formatCurrency(currentTotal, selectedWallet?.currency || 'UZS') + ' — ' : ''}Xarajatni saqlash`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
