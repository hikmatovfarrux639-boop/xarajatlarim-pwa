import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/formatters';
import { CategoryIcon } from '../components/CategoryIcon';
import { PieChart, Search, Tag, Trash2, RotateCcw, Check } from 'lucide-react';

type Period = 'today' | 'week' | 'month' | 'all';

export const AnalyticsPage: React.FC = () => {
  const {
    transactions,
    categories,
    settings,
    resetAllToZero,
    clearTodayTransactions,
  } = useFinance();
  const [period, setPeriod] = useState<Period>('month');
  const [productSearch, setProductSearch] = useState<string>('');
  const [confirmResetAll, setConfirmResetAll] = useState<boolean>(false);

  const toUzs = (amount: number, currency: 'UZS' | 'USD') => {
    return currency === 'USD' ? amount * settings.exchangeRateUsdToUzs : amount;
  };

  // Filter transactions by period
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    return transactions.filter((t) => {
      const d = new Date(t.date);
      if (period === 'today') {
        return (
          d.getDate() === now.getDate() &&
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      }
      if (period === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return d >= weekAgo;
      }
      if (period === 'month') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [transactions, period]);

  const totalExpenseUzs = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + toUzs(t.amount, t.currency), 0);
  }, [filteredTransactions, settings.exchangeRateUsdToUzs]);

  const categoryStats = useMemo(() => {
    const map = new Map<string, number>();

    filteredTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const cur = map.get(t.categoryId) || 0;
        map.set(t.categoryId, cur + toUzs(t.amount, t.currency));
      });

    return Array.from(map.entries())
      .map(([catId, amount]) => {
        const cat = categories.find((c) => c.id === catId);
        const percent = totalExpenseUzs > 0 ? (amount / totalExpenseUzs) * 100 : 0;
        return {
          id: catId,
          name: cat?.name || 'Boshqa',
          icon: cat?.icon || 'help-circle',
          color: cat?.color || '#64748b',
          amount,
          percent,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions, categories, totalExpenseUzs, settings.exchangeRateUsdToUzs]);

  const topProducts = useMemo(() => {
    const itemMap = new Map<string, { total: number; count: number }>();

    filteredTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        if (t.items && t.items.length > 0) {
          t.items.forEach((item) => {
            const key = item.name.trim();
            if (key) {
              const cur = itemMap.get(key) || { total: 0, count: 0 };
              cur.total += toUzs(item.price, t.currency);
              cur.count += 1;
              itemMap.set(key, cur);
            }
          });
        } else if (t.title && t.title.trim()) {
          const key = t.title.trim();
          const cur = itemMap.get(key) || { total: 0, count: 0 };
          cur.total += toUzs(t.amount, t.currency);
          cur.count += 1;
          itemMap.set(key, cur);
        }
      });

    return Array.from(itemMap.entries())
      .map(([name, data]) => ({
        name,
        total: data.total,
        count: data.count,
      }))
      .sort((a, b) => b.total - a.total);
  }, [filteredTransactions, settings.exchangeRateUsdToUzs]);

  const searchedProducts = topProducts.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="space-y-5 pb-28">
      {/* Header & Period tabs */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
          Xarajatlar Tahlili
        </h1>

        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-200/70 dark:bg-slate-800/80 rounded-2xl">
          {[
            { id: 'today', label: 'Bugun' },
            { id: 'week', label: 'Hafta' },
            { id: 'month', label: 'Shu oy' },
            { id: 'all', label: 'Barchasi' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPeriod(tab.id as Period)}
              className={`py-1.5 rounded-xl text-xs font-semibold transition-all ${
                period === tab.id
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Period Total Expense Card */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800/80 shadow-sm text-center">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
          {period === 'today'
            ? 'Bugungi jami xarajat'
            : period === 'week'
            ? 'Oxirgi 7 kunlik xarajat'
            : period === 'month'
            ? 'Shu oydagi jami xarajat'
            : 'Jami xarajat'}
        </span>
        <div className="text-3xl font-black text-rose-500 tracking-tight">
          {totalExpenseUzs > 0 ? `-${formatCurrency(totalExpenseUzs, 'UZS')}` : formatCurrency(0, 'UZS')}
        </div>
      </div>

      {/* Categories Breakdown */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
          <PieChart size={18} className="text-emerald-500" />
          Bo'limlar Bo'yicha Taqsimot
        </h2>

        {categoryStats.length === 0 ? (
          <p className="text-xs text-center py-6 text-slate-400">
            Ushbu davrda hech qanday xarajat yo'q (0 so'm)
          </p>
        ) : (
          <div className="space-y-3">
            {categoryStats.map((cat) => (
              <div key={cat.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-medium">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 rounded-md flex items-center justify-center text-white"
                      style={{ backgroundColor: cat.color }}
                    >
                      <CategoryIcon name={cat.icon} size={12} />
                    </div>
                    <span className="text-slate-800 dark:text-slate-200">{cat.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 dark:text-white mr-2">
                      {formatCurrency(cat.amount, 'UZS')}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      ({cat.percent.toFixed(1)}%)
                    </span>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${cat.percent}%`,
                      backgroundColor: cat.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top Products / Purchases */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Tag size={18} className="text-teal-500" />
              Eng Ko'p Nima Oldim?
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Xaridlar va mahsulotlar reytingi
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-xl">
            {topProducts.length} xil
          </span>
        </div>

        <div className="relative mb-3">
          <Search size={15} className="absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Mahsulot nomini qidirish..."
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {searchedProducts.length === 0 ? (
          <p className="text-xs text-center py-4 text-slate-400">
            Hali xaridlar yo'q
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {searchedProducts.slice(0, 10).map((prod, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-500 flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                      {prod.name}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {prod.count} marta sotib olingan
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-rose-500 block">
                    {formatCurrency(prod.total, 'UZS')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* BOTTOM OF ANALYTICS PAGE: Clear / Reset Expenses Block */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#111827] border border-rose-500/30 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-rose-500">
          <Trash2 size={18} />
          <h2 className="text-sm font-bold">
            Xarajatlarni Tozalash (0 ga tushirish)
          </h2>
        </div>
        <p className="text-xs text-slate-400">
          Tahlil va tarixdagi barcha xarajatlarni o'chirib, hisobni 0 dan boshlash:
        </p>

        {confirmResetAll ? (
          <div className="flex items-center justify-between p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30">
            <span className="text-xs font-bold text-rose-600 dark:text-rose-300">
              Rostdan ham barcha xarajatlarni o'chirasizmi?
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setConfirmResetAll(false)}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold"
              >
                Yo'q
              </button>
              <button
                type="button"
                onClick={() => {
                  resetAllToZero();
                  setConfirmResetAll(false);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-1 shadow-sm"
              >
                <Check size={14} /> Ha, o'chirilsin!
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={clearTodayTransactions}
              disabled={transactions.length === 0}
              className="py-2.5 px-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-500/15 hover:text-rose-500 disabled:opacity-40 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <RotateCcw size={14} /> Bugungini tozalash
            </button>

            <button
              type="button"
              onClick={() => setConfirmResetAll(true)}
              disabled={transactions.length === 0}
              className="py-2.5 px-3 rounded-2xl bg-rose-500 hover:bg-rose-600 disabled:opacity-40 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm shadow-rose-500/20 transition-all active:scale-95"
            >
              <Trash2 size={14} /> Hammasini 0 qilish
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
