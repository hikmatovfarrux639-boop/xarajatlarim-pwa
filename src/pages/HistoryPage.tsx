import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatUzbekDate } from '../utils/formatters';
import { CategoryIcon } from '../components/CategoryIcon';
import { Search, Trash2, Pencil, ShoppingBag, X, AlertTriangle, Check } from 'lucide-react';
import { Transaction } from '../types/finance';

interface HistoryPageProps {
  onEditTransaction: (tx: Transaction) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ onEditTransaction }) => {
  const {
    transactions,
    categories,
    wallets,
    settings,
    deleteTransaction,
    resetAllToZero,
  } = useFinance();

  const [search, setSearch] = useState<string>('');
  const [selectedWalletId, setSelectedWalletId] = useState<string>('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState<boolean>(false);

  const catMap = new Map(categories.map((c) => [c.id, c]));
  const walMap = new Map(wallets.map((w) => [w.id, w]));

  const toUzs = (amount: number, currency: 'UZS' | 'USD') =>
    currency === 'USD' ? amount * settings.exchangeRateUsdToUzs : amount;

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (selectedWalletId !== 'all' && t.walletId !== selectedWalletId) return false;
      if (selectedCategoryId !== 'all' && t.categoryId !== selectedCategoryId) return false;
      if (search.trim()) {
        const query = search.toLowerCase();
        const inTitle = t.title.toLowerCase().includes(query);
        const inNote = t.note?.toLowerCase().includes(query) || false;
        const inItems = t.items?.some((i) => i.name.toLowerCase().includes(query)) || false;
        return inTitle || inNote || inItems;
      }
      return true;
    });
  }, [transactions, selectedWalletId, selectedCategoryId, search]);

  const groupedByDay = useMemo(() => {
    const groups: {
      dayKey: string;
      label: string;
      totalExpenseUzs: number;
      items: Transaction[];
    }[] = [];

    const map = new Map<string, typeof groups[0]>();
    const uzbekMonths = [
      'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
      'iyul', 'avgust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr',
    ];

    const now = new Date();
    const todayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
    const yest = new Date(now);
    yest.setDate(now.getDate() - 1);
    const yestKey = `${yest.getFullYear()}-${yest.getMonth()}-${yest.getDate()}`;

    filtered.forEach((tx) => {
      const d = new Date(tx.date);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

      if (!map.has(key)) {
        let label = `${d.getDate()}-${uzbekMonths[d.getMonth()]}`;
        if (key === todayKey) label = 'Bugun';
        else if (key === yestKey) label = 'Kecha';

        const group = {
          dayKey: key,
          label,
          totalExpenseUzs: 0,
          items: [],
        };
        map.set(key, group);
        groups.push(group);
      }

      const grp = map.get(key)!;
      grp.items.push(tx);
      grp.totalExpenseUzs += toUzs(tx.amount, tx.currency);
    });

    return groups;
  }, [filtered, settings.exchangeRateUsdToUzs]);

  const expenseCategories = categories.filter(c => c.type === 'expense');

  return (
    <div className="space-y-4 pb-24">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Xarajatlar Tarixi
          </h1>
          <span className="text-xs font-semibold text-slate-400">
            Jami: {transactions.length} ta yozuv
          </span>
        </div>

        {/* TOP CLEAR ALL BAR ("Xarajatlarni o'chirib tashlaysizmi?") */}
        {transactions.length > 0 && (
          <div className="mb-3 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Trash2 size={16} className="text-rose-500 flex-shrink-0" />
              <span className="text-xs font-bold text-rose-700 dark:text-rose-300 truncate">
                {confirmClearAll
                  ? "Barchasini o'chirishni tasdiqlaysizmi?"
                  : "Xarajatlarni o'chirib tashlaysizmi?"}
              </span>
            </div>

            {confirmClearAll ? (
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setConfirmClearAll(false)}
                  className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold"
                >
                  Yo'q
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetAllToZero();
                    setConfirmClearAll(false);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-1 shadow-sm"
                >
                  <Check size={13} /> Ha, o'chirilsin!
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClearAll(true)}
                className="px-3 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold flex-shrink-0 shadow-sm active:scale-95 transition-all"
              >
                Hammasini tozalash
              </button>
            )}
          </div>
        )}

        {/* Search Bar */}
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Nima olgandingiz? (Go'sht, Taksi, Kafe)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-10 pr-9 py-3 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800/80 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Category & Payment method filters */}
        <div className="grid grid-cols-2 gap-2">
          <select
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            className="text-xs px-3 py-2.5 rounded-xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 focus:outline-none font-medium"
          >
            <option value="all">Barcha Bo'limlar</option>
            {expenseCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={selectedWalletId}
            onChange={(e) => setSelectedWalletId(e.target.value)}
            className="text-xs px-3 py-2.5 rounded-xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 focus:outline-none font-medium"
          >
            <option value="all">Barcha To'lov turlari</option>
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grouped Transaction List */}
      {groupedByDay.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-[#111827] rounded-3xl border border-slate-200/80 dark:border-slate-800/80 mt-4">
          <ShoppingBag className="mx-auto mb-2 text-slate-300 dark:text-slate-600" size={36} />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Xarajatlar ro'yxati bo'sh (0 so'm)
          </p>
        </div>
      ) : (
        <div className="space-y-4 mt-2">
          {groupedByDay.map((group) => (
            <div key={group.dayKey} className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  {group.label}
                </span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Kunlik jami: -{formatCurrency(group.totalExpenseUzs, 'UZS')}
                </span>
              </div>

              {group.items.map((tx) => {
                const cat = catMap.get(tx.categoryId);
                const wal = walMap.get(tx.walletId);
                const isExpanded = expandedTxId === tx.id;
                const hasChecklist = tx.items && tx.items.length > 0;

                return (
                  <div
                    key={tx.id}
                    onClick={() => {
                      setExpandedTxId(isExpanded ? null : tx.id);
                      setConfirmDeleteId(null);
                    }}
                    className="p-3.5 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800/80 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                          style={{ backgroundColor: cat?.color || '#64748b' }}
                        >
                          <CategoryIcon name={cat?.icon || 'help-circle'} size={18} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 truncate">
                            <span className="truncate">{tx.title}</span>
                            {hasChecklist && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-medium flex-shrink-0">
                                {tx.items?.length} ta xarid
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                            <span>{wal?.name?.split(' ')[0]}</span>
                            <span>•</span>
                            <span>{formatUzbekDate(tx.date)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right pl-2 flex-shrink-0">
                        <span className="text-xs font-extrabold block text-slate-900 dark:text-white">
                          {formatCurrency(tx.amount, tx.currency)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {cat?.name}
                        </span>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs animate-in fade-in duration-150">
                        {tx.note && (
                          <p className="text-slate-600 dark:text-slate-300 mb-2 italic bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                            Izoh: "{tx.note}"
                          </p>
                        )}

                        {hasChecklist && (
                          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-2.5 mb-2.5 space-y-1.5">
                            <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                              Bozorlik ro'yxati tarkibi:
                            </span>
                            {tx.items?.map((item, i) => (
                              <div key={i} className="flex justify-between text-slate-600 dark:text-slate-400">
                                <span>• {item.name}</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                  {formatCurrency(item.price, tx.currency)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-end gap-2 pt-1">
                          {confirmDeleteId === tx.id ? (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="w-full flex items-center justify-between gap-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 animate-in fade-in duration-150"
                            >
                              <span className="text-[11px] font-bold text-rose-600 dark:text-rose-300">
                                O'chirishni tasdiqlaysizmi?
                              </span>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmDeleteId(null);
                                  }}
                                  className="text-[11px] px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700"
                                >
                                  Yo'q
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteTransaction(tx.id);
                                    setExpandedTxId(null);
                                    setConfirmDeleteId(null);
                                  }}
                                  className="text-[11px] bg-rose-500 hover:bg-rose-600 text-white flex items-center gap-1 font-bold px-2.5 py-1 rounded-lg shadow-sm"
                                >
                                  <Check size={12} /> Ha, o'chirilsin
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditTransaction(tx);
                                }}
                                className="text-xs text-slate-600 dark:text-slate-300 hover:text-emerald-500 flex items-center gap-1 font-semibold px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800"
                              >
                                <Pencil size={13} /> Tahrirlash
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmDeleteId(tx.id);
                                }}
                                className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1 font-semibold px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/30"
                              >
                                <Trash2 size={13} /> O'chirish
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
