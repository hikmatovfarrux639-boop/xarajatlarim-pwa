import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/formatters';
import { BarChart3, X } from 'lucide-react';

export interface TrendBucket {
  key: string;
  shortLabel: string;
  fullLabel: string;
  amount: number;
  count: number;
  topItems: string[];
}

interface InteractiveTrendChartProps {
  buckets: TrendBucket[];
  totalAmount: number;
  title: string;
  subtitle?: string;
}

export const InteractiveTrendChart: React.FC<InteractiveTrendChartProps> = ({
  buckets,
  totalAmount,
  title,
  subtitle,
}) => {
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  // Reset selection when buckets change significantly
  useEffect(() => {
    setSelectedKey(null);
  }, [buckets.length, title]);

  const maxAmount = Math.max(...buckets.map((b) => b.amount), 1);
  const nonZeroBuckets = buckets.filter((b) => b.amount > 0);
  const averageAmount =
    buckets.length > 0 ? totalAmount / buckets.length : 0;

  const selectedBucket = selectedKey
    ? buckets.find((b) => b.key === selectedKey) || null
    : null;

  const formatCompact = (val: number): string => {
    if (val === 0) return '';
    if (val >= 1000000) return `${(val / 1000000).toFixed(1).replace('.0', '')}m`;
    if (val >= 1000) return `${Math.round(val / 1000)}k`;
    return `${Math.round(val)}`;
  };

  const averageLinePercent =
    maxAmount > 0 ? Math.min(100, (averageAmount / maxAmount) * 100) : 0;

  const needsScroll = buckets.length > 12;

  return (
    <div className="p-5 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-3.5">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BarChart3 size={18} className="text-blue-500" />
            {title}
          </h2>
          {subtitle && (
            <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>
          )}
        </div>
        {buckets.length > 1 && totalAmount > 0 && (
          <div className="text-right flex-shrink-0">
            <span className="text-[10px] text-slate-400 block">O'rtacha</span>
            <span className="text-xs font-extrabold text-emerald-500">
              {formatCurrency(averageAmount, 'UZS')}
            </span>
          </div>
        )}
      </div>

      {/* Interactive Selected Bar Info Box */}
      {selectedBucket ? (
        <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-between gap-2 animate-in fade-in duration-150">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-blue-700 dark:text-blue-300">
                {selectedBucket.fullLabel}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-500/20 text-blue-700 dark:text-blue-300">
                {totalAmount > 0
                  ? `${((selectedBucket.amount / totalAmount) * 100).toFixed(1)}%`
                  : '0%'}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm font-black text-slate-900 dark:text-white">
                {formatCurrency(selectedBucket.amount, 'UZS')}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                • {selectedBucket.count} ta xarajat
                {selectedBucket.topItems.length > 0
                  ? ` (${selectedBucket.topItems.slice(0, 2).join(', ')})`
                  : ''}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSelectedKey(null)}
            className="p-1 rounded-full bg-white/80 dark:bg-slate-800 text-slate-400 hover:text-slate-600 flex-shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        nonZeroBuckets.length > 0 && (
          <p className="text-[11px] text-slate-400 italic">
            💡 Batafsil ko'rish uchun istalgan ustunni bosing
          </p>
        )
      )}

      {/* Bars Area - Always visible so user sees the timeline */}
      <div className={needsScroll ? 'overflow-x-auto pb-2 no-scrollbar' : ''}>
        <div
          className="relative pt-6 pb-1"
          style={{
            minWidth: needsScroll ? `${buckets.length * 36}px` : '100%',
          }}
        >
          {/* Average Reference Line */}
          {totalAmount > 0 && averageLinePercent > 5 && averageLinePercent < 95 && (
            <div
              className="absolute left-0 right-0 border-t border-dashed border-emerald-500/50 pointer-events-none z-0 flex justify-end"
              style={{
                bottom: `calc(${averageLinePercent * 1.25}px + 24px)`,
              }}
            >
              <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-white/90 dark:bg-[#111827]/90 px-1 -mt-2 rounded">
                o'rtacha
              </span>
            </div>
          )}

          <div className="flex items-end justify-between gap-1.5 h-[135px] relative z-10">
            {buckets.map((b) => {
              const heightPct = totalAmount > 0 && maxAmount > 0 ? (b.amount / maxAmount) * 100 : 0;
              const barHeightPx = b.amount > 0 ? Math.max(8, Math.round((heightPct / 100) * 125)) : 4;
              const isSelected = selectedKey === b.key;
              const isAboveAvg = b.amount > averageAmount && averageAmount > 0;

              return (
                <button
                  key={b.key}
                  type="button"
                  onClick={() => setSelectedKey(isSelected ? null : b.key)}
                  className="flex-1 min-w-[26px] flex flex-col items-center justify-end h-full group focus:outline-none"
                >
                  {/* Value above bar */}
                  <span
                    className={`text-[9px] font-extrabold mb-1 transition-colors ${
                      isSelected
                        ? 'text-blue-500 scale-110'
                        : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                    }`}
                  >
                    {formatCompact(b.amount)}
                  </span>

                  {/* Bar */}
                  <div
                    className={`w-full max-w-[28px] rounded-t-xl transition-all duration-300 ${
                      b.amount === 0
                        ? 'bg-slate-100 dark:bg-slate-800/70'
                        : isSelected
                        ? 'bg-gradient-to-t from-blue-600 to-cyan-400 shadow-md shadow-blue-500/30 ring-2 ring-blue-400/50'
                        : isAboveAvg
                        ? 'bg-gradient-to-t from-rose-500 to-amber-400 group-hover:opacity-90'
                        : 'bg-gradient-to-t from-emerald-500 to-teal-400 group-hover:opacity-90'
                    }`}
                    style={{ height: `${barHeightPx}px` }}
                  />

                  {/* X-axis label */}
                  <span
                    className={`text-[10px] mt-1.5 font-semibold truncate max-w-full ${
                      isSelected
                        ? 'text-blue-600 dark:text-blue-400 font-black'
                        : 'text-slate-400'
                    }`}
                  >
                    {b.shortLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      {totalAmount === 0 && (
        <p className="text-[11px] text-center text-slate-400 pt-1">
          Hozircha xarajat kiritilmagan (0 so'm) — ustunlar avtomatik to'ladi
        </p>
      )}
    </div>
  );
};
