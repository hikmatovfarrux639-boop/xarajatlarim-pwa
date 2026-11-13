import React, { useState, useEffect, useMemo } from 'react';
import { formatCurrency } from '../utils/formatters';
import { Activity, BarChart3, X } from 'lucide-react';

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
  const [chartMode, setChartMode] = useState<'wave' | 'bar'>('wave');

  useEffect(() => {
    setSelectedKey(null);
  }, [buckets.length, title]);

  const maxAmount = Math.max(...buckets.map((b) => b.amount), 1);
  const nonZeroBuckets = buckets.filter((b) => b.amount > 0);
  const averageAmount = buckets.length > 0 ? totalAmount / buckets.length : 0;

  const selectedBucket = selectedKey
    ? buckets.find((b) => b.key === selectedKey) || null
    : null;

  const formatCompact = (val: number): string => {
    if (val === 0) return '';
    if (val >= 1000000) return `${(val / 1000000).toFixed(1).replace('.0', '')}m`;
    if (val >= 1000) return `${Math.round(val / 1000)}k`;
    return `${Math.round(val)}`;
  };

  const averageLinePercent = maxAmount > 0 ? Math.min(100, (averageAmount / maxAmount) * 100) : 0;
  const needsScroll = buckets.length > 12;

  // Compute SVG geometry for Smooth Wave Area Chart
  const svgWidth = Math.max(320, buckets.length * 42);
  const svgHeight = 152;
  const padX = 20;
  const padTop = 22;
  const padBottom = 16;
  const baseY = svgHeight - padBottom;
  const usableH = baseY - padTop;

  const waveGeometry = useMemo(() => {
    if (buckets.length === 0) return { points: [], linePath: '', areaPath: '' };

    const stepX = buckets.length > 1 ? (svgWidth - padX * 2) / (buckets.length - 1) : 0;
    const points = buckets.map((b, idx) => {
      const x = buckets.length === 1 ? svgWidth / 2 : padX + idx * stepX;
      const ratio = totalAmount > 0 ? b.amount / maxAmount : 0;
      const y = baseY - ratio * usableH;
      return { x, y, bucket: b };
    });

    if (points.length === 1) {
      return { points, linePath: '', areaPath: '' };
    }

    let linePath = `M ${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const dx = (p1.x - p0.x) * 0.45;
      const cp1x = p0.x + dx;
      const cp1y = p0.y;
      const cp2x = p1.x - dx;
      const cp2y = p1.y;
      linePath += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p1.x.toFixed(1)},${p1.y.toFixed(1)}`;
    }

    const areaPath = `${linePath} L ${points[points.length - 1].x},${baseY} L ${points[0].x},${baseY} Z`;
    return { points, linePath, areaPath };
  }, [buckets, svgWidth, totalAmount, maxAmount, baseY, usableH]);

  const avgY = totalAmount > 0 ? baseY - (averageAmount / maxAmount) * usableH : baseY;

  return (
    <div className="p-5 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-3.5">
      {/* Header with Wave / Bar Mode Switcher */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            {chartMode === 'wave' ? (
              <Activity size={18} className="text-emerald-500" />
            ) : (
              <BarChart3 size={18} className="text-sky-500" />
            )}
            {title}
          </h2>
          {subtitle && (
            <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl flex-shrink-0">
          <button
            type="button"
            onClick={() => setChartMode('wave')}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
              chartMode === 'wave'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            To'lqin
          </button>
          <button
            type="button"
            onClick={() => setChartMode('bar')}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
              chartMode === 'bar'
                ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Ustun
          </button>
        </div>
      </div>

      {/* Selected Bucket Live Detail HUD */}
      {selectedBucket ? (
        <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-sky-500/10 border border-emerald-500/25 flex items-center justify-between gap-2 animate-in fade-in duration-150">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-emerald-700 dark:text-emerald-300">
                {selectedBucket.fullLabel}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
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
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400 italic">
            {nonZeroBuckets.length > 0
              ? "💡 Batafsil ko'rish uchun istalgan nuqta yoki ustunni bosing"
              : "Hozircha xarajat 0 so'm — qo'shganingizda grafik jonlanadi"}
          </span>
          {buckets.length > 1 && totalAmount > 0 && (
            <span className="font-extrabold text-emerald-500 flex-shrink-0 ml-2">
              O'rtacha: {formatCurrency(averageAmount, 'UZS')}
            </span>
          )}
        </div>
      )}

      {/* CHART VIEWPORT */}
      {chartMode === 'wave' ? (
        <div className={needsScroll ? 'overflow-x-auto pb-1 no-scrollbar' : ''}>
          <div style={{ minWidth: needsScroll ? `${svgWidth}px` : '100%' }}>
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-40 overflow-visible select-none"
            >
              <defs>
                <linearGradient id="waveAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.42" />
                  <stop offset="55%" stopColor="#06b6d4" stopOpacity="0.16" />
                  <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.01" />
                </linearGradient>
                <linearGradient id="waveStrokeGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="50%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
                <filter id="waveGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#10b981" floodOpacity="0.35" />
                </filter>
              </defs>

              {/* Baseline */}
              <line
                x1={padX}
                y1={baseY}
                x2={svgWidth - padX}
                y2={baseY}
                stroke="currentColor"
                strokeWidth="1"
                className="text-slate-200 dark:text-slate-800"
              />

              {/* Average Horizontal Dashed Line */}
              {totalAmount > 0 && avgY > padTop + 8 && avgY < baseY - 8 && (
                <g>
                  <line
                    x1={padX}
                    y1={avgY}
                    x2={svgWidth - padX}
                    y2={avgY}
                    stroke="#10b981"
                    strokeWidth="1.2"
                    strokeDasharray="4 4"
                    opacity="0.55"
                  />
                  <text
                    x={svgWidth - padX}
                    y={avgY - 4}
                    textAnchor="end"
                    className="text-[9px] font-bold fill-emerald-500"
                  >
                    o'rtacha
                  </text>
                </g>
              )}

              {/* Smooth Area + Line */}
              {waveGeometry.areaPath && (
                <path d={waveGeometry.areaPath} fill="url(#waveAreaGrad)" />
              )}
              {waveGeometry.linePath && (
                <path
                  d={waveGeometry.linePath}
                  fill="none"
                  stroke="url(#waveStrokeGrad)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  filter="url(#waveGlow)"
                />
              )}

              {/* Interactive Nodes & Vertical Tap Guides */}
              {waveGeometry.points.map(({ x, y, bucket }) => {
                const isSelected = selectedKey === bucket.key;
                const isPeak = bucket.amount > 0 && bucket.amount === maxAmount;

                return (
                  <g
                    key={bucket.key}
                    onClick={() => setSelectedKey(isSelected ? null : bucket.key)}
                    className="cursor-pointer group"
                  >
                    {/* Wide invisible touch target column */}
                    <rect
                      x={x - 16}
                      y={0}
                      width={32}
                      height={svgHeight}
                      fill="transparent"
                    />

                    {/* Vertical hairline guide when selected */}
                    {isSelected && (
                      <line
                        x1={x}
                        y1={padTop - 8}
                        x2={x}
                        y2={baseY}
                        stroke="#06b6d4"
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                      />
                    )}

                    {/* Outer Halo for selected or peak */}
                    {(isSelected || isPeak) && bucket.amount > 0 && (
                      <circle
                        cx={x}
                        cy={y}
                        r={isSelected ? 10 : 7}
                        fill={isSelected ? '#06b6d4' : '#10b981'}
                        opacity={isSelected ? 0.28 : 0.18}
                      />
                    )}

                    {/* Data dot */}
                    <circle
                      cx={x}
                      cy={y}
                      r={isSelected ? 5.5 : bucket.amount > 0 ? 4 : 2.5}
                      fill={
                        isSelected
                          ? '#06b6d4'
                          : bucket.amount > 0
                          ? '#10b981'
                          : '#94a3b8'
                      }
                      stroke="#ffffff"
                      strokeWidth={isSelected || bucket.amount > 0 ? 2 : 0}
                    />

                    {/* Value tag above selected or peak points */}
                    {(isSelected || isPeak) && bucket.amount > 0 && (
                      <text
                        x={x}
                        y={y - 10}
                        textAnchor="middle"
                        className={`text-[10px] font-black ${
                          isSelected ? 'fill-cyan-500' : 'fill-emerald-500'
                        }`}
                      >
                        {formatCompact(bucket.amount)}
                      </text>
                    )}

                    {/* X-axis label */}
                    <text
                      x={x}
                      y={svgHeight - 2}
                      textAnchor="middle"
                      className={`text-[10px] font-bold ${
                        isSelected
                          ? 'fill-cyan-500'
                          : 'fill-slate-400'
                      }`}
                    >
                      {bucket.shortLabel}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      ) : (
        /* Gradient Bar Mode (Calming Emerald/Sky/Indigo palette — NO harsh red!) */
        <div className={needsScroll ? 'overflow-x-auto pb-2 no-scrollbar' : ''}>
          <div
            className="relative pt-6 pb-1"
            style={{
              minWidth: needsScroll ? `${buckets.length * 36}px` : '100%',
            }}
          >
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
                    <span
                      className={`text-[9px] font-extrabold mb-1 transition-colors ${
                        isSelected
                          ? 'text-cyan-500 scale-110'
                          : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                      }`}
                    >
                      {formatCompact(b.amount)}
                    </span>

                    <div
                      className={`w-full max-w-[28px] rounded-t-xl transition-all duration-300 ${
                        b.amount === 0
                          ? 'bg-slate-100 dark:bg-slate-800/70'
                          : isSelected
                          ? 'bg-gradient-to-t from-cyan-600 to-sky-400 shadow-md shadow-cyan-500/30 ring-2 ring-cyan-400/50'
                          : isAboveAvg
                          ? 'bg-gradient-to-t from-indigo-500 to-sky-400 group-hover:opacity-90'
                          : 'bg-gradient-to-t from-emerald-500 to-teal-400 group-hover:opacity-90'
                      }`}
                      style={{ height: `${barHeightPx}px` }}
                    />

                    <span
                      className={`text-[10px] mt-1.5 font-semibold truncate max-w-full ${
                        isSelected
                          ? 'text-cyan-600 dark:text-cyan-400 font-black'
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
      )}
    </div>
  );
};
