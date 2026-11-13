import React, { useState, useMemo } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatUzbekDate, toInputDate } from '../utils/formatters';
import { CategoryIcon } from '../components/CategoryIcon';
import { InteractiveDonutChart, DonutSlice } from '../components/InteractiveDonutChart';
import { InteractiveTrendChart, TrendBucket } from '../components/InteractiveTrendChart';
import {
  PieChart,
  Search,
  Tag,
  Trash2,
  RotateCcw,
  Check,
  Calendar,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import { Transaction } from '../types/finance';

type Period = 'today' | 'week' | 'ten_days' | 'month' | 'custom' | 'all';

const UZBEK_MONTHS_SHORT = [
  'yan', 'fev', 'mar', 'apr', 'may', 'iyn',
  'iyl', 'avg', 'sen', 'okt', 'noy', 'dek',
];

const UZBEK_MONTHS_FULL = [
  'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
  'iyul', 'avgust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr',
];

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function parseInputDateLocal(str: string): Date {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export const AnalyticsPage: React.FC = () => {
  const {
    transactions,
    categories,
    settings,
    resetAllToZero,
    clearTodayTransactions,
  } = useFinance();

  const [period, setPeriod] = useState<Period>('week');
  const [customStart, setCustomStart] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 13);
    return toInputDate(d);
  });
  const [customEnd, setCustomEnd] = useState<string>(() => toInputDate(new Date()));

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState<string>('');
  const [confirmResetAll, setConfirmResetAll] = useState<boolean>(false);

  const toUzs = (amount: number, currency: 'UZS' | 'USD') => {
    return currency === 'USD' ? amount * settings.exchangeRateUsdToUzs : amount;
  };

  // Determine active [rangeStart, rangeEnd] and previous comparison range
  const dateRange = useMemo(() => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);

    if (period === 'today') {
      const yestStart = new Date(todayStart);
      yestStart.setDate(yestStart.getDate() - 1);
      const yestEnd = endOfDay(yestStart);
      return {
        start: todayStart,
        end: todayEnd,
        prevStart: yestStart,
        prevEnd: yestEnd,
        daysCount: 1,
        label: 'Bugungi xarajatlar',
      };
    }

    if (period === 'week') {
      const start = new Date(todayStart);
      start.setDate(start.getDate() - 6); // 7 days inclusive
      const prevEnd = new Date(start.getTime() - 1);
      const prevStart = startOfDay(new Date(start));
      prevStart.setDate(prevStart.getDate() - 7);
      return {
        start,
        end: todayEnd,
        prevStart,
        prevEnd,
        daysCount: 7,
        label: 'Haftalik (oxirgi 7 kun)',
      };
    }

    if (period === 'ten_days') {
      const start = new Date(todayStart);
      start.setDate(start.getDate() - 9); // 10 days inclusive
      const prevEnd = new Date(start.getTime() - 1);
      const prevStart = startOfDay(new Date(start));
      prevStart.setDate(prevStart.getDate() - 10);
      return {
        start,
        end: todayEnd,
        prevStart,
        prevEnd,
        daysCount: 10,
        label: '10 kunlik tahlil',
      };
    }

    if (period === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const daysCount = Math.max(1, Math.ceil((todayEnd.getTime() - start.getTime()) / 86400000));
      const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      const prevEnd = endOfDay(new Date(now.getFullYear(), now.getMonth(), 0));
      return {
        start,
        end: todayEnd,
        prevStart,
        prevEnd,
        daysCount,
        label: `${UZBEK_MONTHS_FULL[now.getMonth()].charAt(0).toUpperCase() + UZBEK_MONTHS_FULL[now.getMonth()].slice(1)} oyi`,
      };
    }

    if (period === 'custom') {
      let sDate = parseInputDateLocal(customStart);
      let eDate = parseInputDateLocal(customEnd);
      if (sDate > eDate) {
        const tmp = sDate;
        sDate = eDate;
        eDate = tmp;
      }
      const start = startOfDay(sDate);
      const end = endOfDay(eDate);
      const daysCount = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));
      const prevEnd = new Date(start.getTime() - 1);
      const prevStart = startOfDay(new Date(start.getTime() - daysCount * 86400000));
      const sLabel = `${start.getDate()}-${UZBEK_MONTHS_SHORT[start.getMonth()]}`;
      const eLabel = `${end.getDate()}-${UZBEK_MONTHS_SHORT[end.getMonth()]}`;
      return {
        start,
        end,
        prevStart,
        prevEnd,
        daysCount,
        label: `${sLabel} — ${eLabel} (${daysCount} kun)`,
      };
    }

    // 'all'
    const allExpenses = transactions.filter((t) => t.type === 'expense');
    const minTs = allExpenses.length > 0
      ? Math.min(...allExpenses.map((t) => new Date(t.date).getTime()))
      : todayStart.getTime();
    const start = startOfDay(new Date(minTs));
    const daysCount = Math.max(1, Math.ceil((todayEnd.getTime() - start.getTime()) / 86400000));
    return {
      start,
      end: todayEnd,
      prevStart: null,
      prevEnd: null,
      daysCount,
      label: 'Barcha davrlar',
    };
  }, [period, customStart, customEnd, transactions]);

  // Filter expense transactions in active range
  const expenseTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (t.type !== 'expense') return false;
      const d = new Date(t.date);
      return d >= dateRange.start && d <= dateRange.end;
    });
  }, [transactions, dateRange]);

  // Previous range total for comparison
  const prevTotalUzs = useMemo(() => {
    if (!dateRange.prevStart || !dateRange.prevEnd) return 0;
    return transactions
      .filter((t) => {
        if (t.type !== 'expense') return false;
        const d = new Date(t.date);
        return d >= dateRange.prevStart! && d <= dateRange.prevEnd!;
      })
      .reduce((sum, t) => sum + toUzs(t.amount, t.currency), 0);
  }, [transactions, dateRange, settings.exchangeRateUsdToUzs]);

  const totalExpenseUzs = useMemo(() => {
    return expenseTransactions.reduce((sum, t) => sum + toUzs(t.amount, t.currency), 0);
  }, [expenseTransactions, settings.exchangeRateUsdToUzs]);

  const dailyAverageUzs = dateRange.daysCount > 0 ? totalExpenseUzs / dateRange.daysCount : 0;

  const comparisonPercent = useMemo(() => {
    if (prevTotalUzs <= 0) return null;
    return ((totalExpenseUzs - prevTotalUzs) / prevTotalUzs) * 100;
  }, [totalExpenseUzs, prevTotalUzs]);

  // Build Trend Chart buckets
  const trendBuckets: TrendBucket[] = useMemo(() => {
    if (period === 'today') {
      // 6 four-hour blocks for today
      const blocks = [
        { key: '0', shortLabel: '00-04', fullLabel: 'Tungi (00:00 - 04:00)', minH: 0, maxH: 3 },
        { key: '1', shortLabel: '04-08', fullLabel: 'Tong (04:00 - 08:00)', minH: 4, maxH: 7 },
        { key: '2', shortLabel: '08-12', fullLabel: 'Ertalab (08:00 - 12:00)', minH: 8, maxH: 11 },
        { key: '3', shortLabel: '12-16', fullLabel: 'Kunduzi (12:00 - 16:00)', minH: 12, maxH: 15 },
        { key: '4', shortLabel: '16-20', fullLabel: 'Kechqurun (16:00 - 20:00)', minH: 16, maxH: 19 },
        { key: '5', shortLabel: '20-24', fullLabel: 'Kechasi (20:00 - 24:00)', minH: 20, maxH: 23 },
      ];

      return blocks.map((b) => {
        const txs = expenseTransactions.filter((t) => {
          const h = new Date(t.date).getHours();
          return h >= b.minH && h <= b.maxH;
        });
        return {
          key: b.key,
          shortLabel: b.shortLabel,
          fullLabel: b.fullLabel,
          amount: txs.reduce((s, t) => s + toUzs(t.amount, t.currency), 0),
          count: txs.length,
          topItems: txs.map((t) => t.title),
        };
      });
    }

    // Group by month if 'all' or custom range > 45 days
    if (period === 'all' || dateRange.daysCount > 45) {
      const monthMap = new Map<string, { amount: number; count: number; items: string[]; date: Date }>();
      expenseTransactions.forEach((t) => {
        const d = new Date(t.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const cur = monthMap.get(key) || { amount: 0, count: 0, items: [], date: new Date(d.getFullYear(), d.getMonth(), 1) };
        cur.amount += toUzs(t.amount, t.currency);
        cur.count += 1;
        if (t.title) cur.items.push(t.title);
        monthMap.set(key, cur);
      });

      return Array.from(monthMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, val]) => ({
          key,
          shortLabel: `${UZBEK_MONTHS_SHORT[val.date.getMonth()]}`,
          fullLabel: `${UZBEK_MONTHS_FULL[val.date.getMonth()].charAt(0).toUpperCase() + UZBEK_MONTHS_FULL[val.date.getMonth()].slice(1)} ${val.date.getFullYear()}`,
          amount: val.amount,
          count: val.count,
          topItems: val.items,
        }));
    }

    // Day-by-day buckets across [dateRange.start .. dateRange.end]
    const dayMap = new Map<string, { amount: number; count: number; items: string[] }>();
    expenseTransactions.forEach((t) => {
      const d = new Date(t.date);
      const key = toInputDate(d);
      const cur = dayMap.get(key) || { amount: 0, count: 0, items: [] };
      cur.amount += toUzs(t.amount, t.currency);
      cur.count += 1;
      if (t.title) cur.items.push(t.title);
      dayMap.set(key, cur);
    });

    const result: TrendBucket[] = [];
    const cursor = new Date(dateRange.start);
    while (cursor <= dateRange.end) {
      const key = toInputDate(cursor);
      const data = dayMap.get(key) || { amount: 0, count: 0, items: [] };
      result.push({
        key,
        shortLabel: `${cursor.getDate()}`,
        fullLabel: `${cursor.getDate()}-${UZBEK_MONTHS_FULL[cursor.getMonth()]}`,
        amount: data.amount,
        count: data.count,
        topItems: data.items,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    return result;
  }, [period, expenseTransactions, dateRange, settings.exchangeRateUsdToUzs]);

  const peakBucket = useMemo(() => {
    const nonZero = trendBuckets.filter((b) => b.amount > 0);
    if (nonZero.length === 0) return null;
    return nonZero.reduce((max, cur) => (cur.amount > max.amount ? cur : max), nonZero[0]);
  }, [trendBuckets]);

  // Build Donut slices & Category Breakdown with transaction lists
  const categoryStats: (DonutSlice & { txs: Transaction[] })[] = useMemo(() => {
    const map = new Map<string, { amount: number; count: number; txs: Transaction[] }>();

    expenseTransactions.forEach((t) => {
      const cur = map.get(t.categoryId) || { amount: 0, count: 0, txs: [] };
      cur.amount += toUzs(t.amount, t.currency);
      cur.count += 1;
      cur.txs.push(t);
      map.set(t.categoryId, cur);
    });

    return Array.from(map.entries())
      .map(([catId, data]) => {
        const cat = categories.find((c) => c.id === catId);
        const percent = totalExpenseUzs > 0 ? (data.amount / totalExpenseUzs) * 100 : 0;
        return {
          id: catId,
          name: cat?.name || 'Boshqa',
          icon: cat?.icon || 'help-circle',
          color: cat?.color || '#64748b',
          amount: data.amount,
          percent,
          count: data.count,
          txs: data.txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [expenseTransactions, categories, totalExpenseUzs, settings.exchangeRateUsdToUzs]);

  // Top Products / Items with % share
  const topProducts = useMemo(() => {
    const itemMap = new Map<string, { total: number; count: number }>();

    expenseTransactions.forEach((t) => {
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
        percent: totalExpenseUzs > 0 ? (data.total / totalExpenseUzs) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [expenseTransactions, totalExpenseUzs, settings.exchangeRateUsdToUzs]);

  const searchedProducts = topProducts.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  // Quick range helper for Custom Date Range mode
  const applyQuickCustomRange = (daysBack: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (daysBack - 1));
    setCustomStart(toInputDate(start));
    setCustomEnd(toInputDate(end));
  };

  const applyPreviousMonthRange = () => {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const last = new Date(now.getFullYear(), now.getMonth(), 0);
    setCustomStart(toInputDate(first));
    setCustomEnd(toInputDate(last));
  };

  const handlePeriodChange = (nextPeriod: Period) => {
    setPeriod(nextPeriod);
    setSelectedCategoryId(null);
  };

  return (
    <div className="space-y-4 pb-28">
      {/* Header & Rich Period Tabs */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Xarajatlar Tahlili
          </h1>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            {dateRange.label}
          </span>
        </div>

        {/* 6 Interactive Period Tabs (2 neat rows of 3) */}
        <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-slate-200/70 dark:bg-slate-800/80 rounded-2xl">
          {[
            { id: 'today', label: 'Bugun' },
            { id: 'week', label: 'Hafta (7k)' },
            { id: 'ten_days', label: '10 kun' },
            { id: 'month', label: 'Shu oy' },
            { id: 'custom', label: '📅 Sanadan-gacha' },
            { id: 'all', label: 'Barchasi' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handlePeriodChange(tab.id as Period)}
              className={`py-2 px-1.5 rounded-xl text-[11px] font-bold transition-all active:scale-95 truncate ${
                period === tab.id
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm ring-1 ring-emerald-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Custom Date-to-Date Picker Panel ("Sanadan sanagacha") */}
        {period === 'custom' && (
          <div className="mt-2.5 p-3.5 rounded-2xl bg-white dark:bg-[#111827] border-2 border-emerald-500/30 shadow-sm space-y-2.5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Calendar size={14} className="text-emerald-500" /> Oraliqni tanlang:
              </span>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                {dateRange.daysCount} kun
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Dan (Boshlanish):
                </label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full text-xs px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Gacha (Tugash):
                </label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full text-xs px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
              <span className="text-[10px] text-slate-400 font-semibold flex-shrink-0">Tez:</span>
              <button
                type="button"
                onClick={() => applyQuickCustomRange(14)}
                className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-500 hover:text-white font-bold whitespace-nowrap transition-colors"
              >
                Oxirgi 14 kun
              </button>
              <button
                type="button"
                onClick={() => applyQuickCustomRange(30)}
                className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-500 hover:text-white font-bold whitespace-nowrap transition-colors"
              >
                Oxirgi 30 kun
              </button>
              <button
                type="button"
                onClick={applyPreviousMonthRange}
                className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-500 hover:text-white font-bold whitespace-nowrap transition-colors"
              >
                O'tgan oy
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Hero Summary Card with Metrics & Comparison */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-xl border border-slate-700/60 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {dateRange.label} jami
            </span>
            <div className="text-3xl font-black text-white tracking-tight mt-0.5">
              {totalExpenseUzs > 0 ? `-${formatCurrency(totalExpenseUzs, 'UZS')}` : formatCurrency(0, 'UZS')}
            </div>
          </div>

          {comparisonPercent !== null && (
            <div
              className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold flex items-center gap-1 flex-shrink-0 ${
                comparisonPercent > 0
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              {comparisonPercent > 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              <span>
                {comparisonPercent > 0 ? '+' : ''}
                {comparisonPercent.toFixed(0)}%
              </span>
            </div>
          )}
        </div>

        {/* 3 Mini KPI Tiles */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10">
          <div className="bg-white/5 rounded-2xl p-2.5">
            <span className="text-[10px] text-slate-400 block">Kunlik o'rtacha</span>
            <span className="text-xs font-extrabold text-emerald-300 truncate block mt-0.5">
              {formatCurrency(dailyAverageUzs, 'UZS')}
            </span>
          </div>

          <div className="bg-white/5 rounded-2xl p-2.5">
            <span className="text-[10px] text-slate-400 block">Xarajatlar soni</span>
            <span className="text-xs font-extrabold text-white block mt-0.5">
              {expenseTransactions.length} ta yozuv
            </span>
          </div>

          <div className="bg-white/5 rounded-2xl p-2.5">
            <span className="text-[10px] text-slate-400 block">Eng ko'p kun</span>
            <span className="text-xs font-extrabold text-amber-300 truncate block mt-0.5">
              {peakBucket ? `${peakBucket.fullLabel}` : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* INTERACTIVE TREND BAR CHART (Daily / Hourly / Monthly) */}
      <InteractiveTrendChart
        buckets={trendBuckets}
        totalAmount={totalExpenseUzs}
        title={
          period === 'today'
            ? 'Soatlar bo‘yicha xarajat grafigi'
            : period === 'all' || dateRange.daysCount > 45
            ? 'Oylar bo‘yicha xarajat grafigi'
            : 'Kunlik xarajatlar grafigi'
        }
        subtitle={
          period === 'today'
            ? 'Bugun qaysi vaqtda ko‘proq sarfladingiz'
            : `${dateRange.label} ichidagi kunma-kun dinamika`
        }
      />

      {/* INTERACTIVE DONUT CHART ("Aylanalar va Foizlar") + DRILLDOWN BREAKDOWN */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <PieChart size={18} className="text-emerald-500" />
              Bo'limlar Ulushi (Aylana va Foizlar)
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Aylana bo'lagini yoki bo'limni bosib ichidagi xarajatlarni ko'ring
            </p>
          </div>
        </div>

        {categoryStats.length === 0 ? (
          <p className="text-xs text-center py-6 text-slate-400">
            Ushbu davrda hech qanday xarajat yo'q (0 so'm)
          </p>
        ) : (
          <>
            {/* Interactive SVG Donut Chart */}
            <InteractiveDonutChart
              slices={categoryStats}
              totalAmount={totalExpenseUzs}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={setSelectedCategoryId}
            />

            {/* Interactive Expandable Category List */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              {categoryStats.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <div
                    key={cat.id}
                    className={`rounded-2xl border transition-all ${
                      isSelected
                        ? 'border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-500/10 p-3'
                        : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/40 p-2'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedCategoryId(isSelected ? null : cat.id)}
                      className="w-full text-left space-y-1.5 focus:outline-none"
                    >
                      <div className="flex items-center justify-between text-xs font-medium">
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-white flex-shrink-0 shadow-sm"
                            style={{ backgroundColor: cat.color }}
                          >
                            <CategoryIcon name={cat.icon} size={13} />
                          </div>
                          <div className="min-w-0">
                            <span className="text-slate-800 dark:text-slate-100 font-bold block truncate">
                              {cat.name}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {cat.count} ta xarajat
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="text-right">
                            <span className="font-extrabold text-slate-900 dark:text-white block">
                              {formatCurrency(cat.amount, 'UZS')}
                            </span>
                            <span
                              className="text-[11px] font-black"
                              style={{ color: cat.color }}
                            >
                              {cat.percent.toFixed(1)}%
                            </span>
                          </div>
                          {isSelected ? (
                            <ChevronUp size={15} className="text-slate-400" />
                          ) : (
                            <ChevronDown size={15} className="text-slate-400" />
                          )}
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
                    </button>

                    {/* Drill-down transactions inside selected category */}
                    {isSelected && (
                      <div className="mt-2.5 pt-2 border-t border-slate-200/70 dark:border-slate-700/70 space-y-1.5 animate-in fade-in duration-150">
                        {cat.txs.slice(0, 8).map((tx) => (
                          <div
                            key={tx.id}
                            className="flex items-center justify-between text-[11px] py-1 px-2 rounded-xl bg-white/80 dark:bg-slate-900/80"
                          >
                            <div className="min-w-0">
                              <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">
                                {tx.title}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {formatUzbekDate(tx.date)}
                              </span>
                            </div>
                            <span className="font-extrabold text-rose-500 ml-2 flex-shrink-0">
                              -{formatCurrency(tx.amount, tx.currency)}
                            </span>
                          </div>
                        ))}
                        {cat.txs.length > 8 && (
                          <p className="text-[10px] text-center text-slate-400 pt-0.5">
                            + yana {cat.txs.length - 8} ta xarajat (Tarix bo'limida)
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Top Products / Purchases with % share */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Tag size={18} className="text-teal-500" />
              Eng Ko'p Nima Oldim?
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Xaridlar ulushi va reytingi
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-xl flex items-center gap-1">
            <Sparkles size={12} /> {topProducts.length} xil
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
              <div key={idx} className="py-2.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-500 flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block truncate">
                        {prod.name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {prod.count} marta • jami xarajatning{' '}
                        <strong className="text-teal-500">{prod.percent.toFixed(1)}%</strong>
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 ml-2">
                    <span className="text-xs font-bold text-rose-500 block">
                      {formatCurrency(prod.total, 'UZS')}
                    </span>
                  </div>
                </div>
                <div className="w-full h-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-400"
                    style={{ width: `${Math.min(100, prod.percent)}%` }}
                  />
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
