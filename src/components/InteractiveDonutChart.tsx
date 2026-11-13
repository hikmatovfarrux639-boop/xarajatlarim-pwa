import React from 'react';
import { formatCurrency } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';

export interface DonutSlice {
  id: string;
  name: string;
  icon: string;
  color: string;
  amount: number;
  percent: number;
  count: number;
}

interface InteractiveDonutChartProps {
  slices: DonutSlice[];
  totalAmount: number;
  selectedCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
}

export const InteractiveDonutChart: React.FC<InteractiveDonutChartProps> = ({
  slices,
  totalAmount,
  selectedCategoryId,
  onSelectCategory,
}) => {
  const size = 248;
  const center = size / 2;
  const radius = 84;
  const outerRingRadius = 110;
  const circumference = 2 * Math.PI * radius;

  const activeSlice = selectedCategoryId
    ? slices.find((s) => s.id === selectedCategoryId) || null
    : null;

  const topSlice = slices.length > 0 ? slices[0] : null;
  let cumulativeLength = 0;

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Orbital SVG Donut */}
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        {/* Ambient background glow matching active or top category */}
        {(activeSlice || topSlice) && (
          <div
            className="absolute w-36 h-36 rounded-full blur-2xl opacity-20 pointer-events-none transition-colors duration-500"
            style={{ backgroundColor: (activeSlice || topSlice)?.color }}
          />
        )}

        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="overflow-visible select-none relative z-10"
        >
          <defs>
            <filter id="donut-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.45" />
            </filter>
          </defs>

          {/* Outer Orbital Precision Ticks */}
          <circle
            cx={center}
            cy={center}
            r={outerRingRadius}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeDasharray="2 7"
            className="text-slate-300/70 dark:text-slate-700/70"
          />

          {/* Base Inner Track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={22}
            className="text-slate-100 dark:text-slate-800/70"
          />

          {/* Interactive Donut Segments */}
          {slices.map((slice) => {
            const segmentLen = (slice.percent / 100) * circumference;
            const gap = slices.length > 1 ? Math.min(4, segmentLen * 0.25) : 0;
            const dashLen = Math.max(1, segmentLen - gap);
            const dashOffset = -(cumulativeLength + gap / 2);
            cumulativeLength += segmentLen;

            const isSelected = selectedCategoryId === slice.id;
            const isDimmed = selectedCategoryId !== null && !isSelected;

            return (
              <circle
                key={slice.id}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={slice.color}
                strokeWidth={isSelected ? 34 : 24}
                strokeDasharray={`${dashLen} ${circumference}`}
                strokeDashoffset={dashOffset}
                strokeLinecap="butt"
                transform={`rotate(-90 ${center} ${center})`}
                onClick={() => onSelectCategory(isSelected ? null : slice.id)}
                filter={isSelected ? 'url(#donut-glow)' : undefined}
                className="cursor-pointer transition-all duration-300 ease-out"
                style={{
                  opacity: isDimmed ? 0.28 : 1,
                }}
              />
            );
          })}
        </svg>

        {/* Center Glassmorphic HUD */}
        <button
          type="button"
          onClick={() => onSelectCategory(null)}
          className="absolute inset-0 m-auto z-20 w-[134px] h-[134px] rounded-full bg-white/85 dark:bg-[#0f172a]/85 backdrop-blur-md border border-slate-200/70 dark:border-slate-700/60 shadow-inner flex flex-col items-center justify-center text-center px-2.5 transition-transform active:scale-95 focus:outline-none"
          title={activeSlice ? "Umumiy ko'rinishga qaytish" : undefined}
        >
          {activeSlice ? (
            <div className="animate-in fade-in zoom-in-95 duration-150 flex flex-col items-center">
              <div
                className="w-7 h-7 rounded-xl flex items-center justify-center text-white mb-1 shadow-md"
                style={{ backgroundColor: activeSlice.color }}
              >
                <CategoryIcon name={activeSlice.icon} size={14} />
              </div>
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 line-clamp-1 max-w-[112px]">
                {activeSlice.name}
              </span>
              <span
                className="text-xl font-black leading-none mt-1 tracking-tight"
                style={{ color: activeSlice.color }}
              >
                {activeSlice.percent.toFixed(1)}%
              </span>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1 truncate max-w-[115px]">
                {formatCurrency(activeSlice.amount, 'UZS')}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                Jami xarajat
              </span>
              <span className="text-sm font-black text-slate-900 dark:text-white mt-0.5 leading-tight">
                {formatCurrency(totalAmount, 'UZS')}
              </span>
              {topSlice ? (
                <div className="mt-1.5 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center gap-1 max-w-[118px]">
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: topSlice.color }}
                  />
                  <span className="text-[9px] font-extrabold text-slate-600 dark:text-slate-300 truncate">
                    {topSlice.name.split(' ')[0]} {topSlice.percent.toFixed(0)}%
                  </span>
                </div>
              ) : (
                <span className="text-[10px] font-semibold text-emerald-500 mt-1">
                  0% • Bo'sh
                </span>
              )}
            </div>
          )}
        </button>
      </div>

      {/* Apple-style Multi-Segment Proportional Capsule Strip */}
      {slices.length > 0 && (
        <div className="w-full space-y-2.5">
          <div className="w-full h-3.5 rounded-full bg-slate-100 dark:bg-slate-800/90 p-0.5 flex gap-0.5 overflow-hidden shadow-inner">
            {slices.map((slice) => {
              const isSelected = selectedCategoryId === slice.id;
              const isDimmed = selectedCategoryId !== null && !isSelected;
              return (
                <button
                  key={slice.id}
                  type="button"
                  onClick={() => onSelectCategory(isSelected ? null : slice.id)}
                  title={`${slice.name}: ${slice.percent.toFixed(1)}%`}
                  className="h-full rounded-full transition-all duration-300 cursor-pointer hover:brightness-110"
                  style={{
                    width: `${Math.max(3, slice.percent)}%`,
                    backgroundColor: slice.color,
                    opacity: isDimmed ? 0.3 : 1,
                    transform: isSelected ? 'scaleY(1.15)' : undefined,
                  }}
                />
              );
            })}
          </div>

          {/* Interactive Percentage Pills */}
          <div className="flex flex-wrap justify-center gap-1.5">
            {slices.map((slice) => {
              const isSelected = selectedCategoryId === slice.id;
              return (
                <button
                  key={slice.id}
                  type="button"
                  onClick={() => onSelectCategory(isSelected ? null : slice.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all active:scale-95 border ${
                    isSelected
                      ? 'text-white shadow-md scale-105'
                      : 'bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border-slate-200/80 dark:border-slate-700/80 hover:border-slate-400'
                  }`}
                  style={
                    isSelected
                      ? { backgroundColor: slice.color, borderColor: slice.color }
                      : undefined
                  }
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: isSelected ? '#ffffff' : slice.color }}
                  />
                  <span className="truncate max-w-[92px]">{slice.name}</span>
                  <span className={isSelected ? 'text-white/95 font-black' : 'text-slate-400 font-extrabold'}>
                    {slice.percent.toFixed(1)}%
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
