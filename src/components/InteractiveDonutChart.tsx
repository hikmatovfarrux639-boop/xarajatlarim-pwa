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
  const size = 220;
  const center = size / 2;
  const radius = 78;
  const circumference = 2 * Math.PI * radius;

  const activeSlice = selectedCategoryId
    ? slices.find((s) => s.id === selectedCategoryId) || null
    : null;

  let cumulativeLength = 0;

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="overflow-visible select-none"
        >
          {/* Background track ring */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={24}
            className="text-slate-100 dark:text-slate-800/80"
          />

          {/* Donut Slices */}
          {slices.map((slice) => {
            const segmentLen = (slice.percent / 100) * circumference;
            const gap = slices.length > 1 ? Math.min(3.5, segmentLen * 0.25) : 0;
            const dashLen = Math.max(0.8, segmentLen - gap);
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
                strokeWidth={isSelected ? 32 : 24}
                strokeDasharray={`${dashLen} ${circumference}`}
                strokeDashoffset={dashOffset}
                strokeLinecap="butt"
                transform={`rotate(-90 ${center} ${center})`}
                onClick={() => onSelectCategory(isSelected ? null : slice.id)}
                className="cursor-pointer transition-all duration-300 ease-out"
                style={{
                  opacity: isDimmed ? 0.3 : 1,
                  filter: isSelected ? `drop-shadow(0 4px 12px ${slice.color}66)` : 'none',
                }}
              />
            );
          })}
        </svg>

        {/* Center Interactive Info Hub */}
        <button
          type="button"
          onClick={() => onSelectCategory(null)}
          className="absolute inset-0 m-auto w-[124px] h-[124px] rounded-full flex flex-col items-center justify-center text-center px-2 transition-transform active:scale-95 focus:outline-none"
          title={activeSlice ? "Umumiy ko'rinishga qaytish" : undefined}
        >
          {activeSlice ? (
            <div className="animate-in fade-in zoom-in-95 duration-150 flex flex-col items-center">
              <div
                className="w-7 h-7 rounded-xl flex items-center justify-center text-white mb-1 shadow-sm"
                style={{ backgroundColor: activeSlice.color }}
              >
                <CategoryIcon name={activeSlice.icon} size={14} />
              </div>
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 line-clamp-1 max-w-[110px]">
                {activeSlice.name}
              </span>
              <span
                className="text-base font-black leading-tight mt-0.5"
                style={{ color: activeSlice.color }}
              >
                {activeSlice.percent.toFixed(1)}%
              </span>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[115px]">
                {formatCurrency(activeSlice.amount, 'UZS')}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Jami xarajat
              </span>
              <span className="text-sm font-black text-slate-900 dark:text-white mt-0.5 leading-tight px-1">
                {formatCurrency(totalAmount, 'UZS')}
              </span>
              <span className="text-[10px] font-semibold text-emerald-500 mt-1">
                {slices.length} ta bo'lim
              </span>
            </div>
          )}
        </button>
      </div>

      {/* Quick Interactive Percentage Pills under Donut */}
      {slices.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1.5 mt-3 w-full">
          {slices.map((slice) => {
            const isSelected = selectedCategoryId === slice.id;
            return (
              <button
                key={slice.id}
                type="button"
                onClick={() => onSelectCategory(isSelected ? null : slice.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all active:scale-95 border ${
                  isSelected
                    ? 'text-white shadow-sm scale-105'
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
                <span className="truncate max-w-[90px]">{slice.name}</span>
                <span className={isSelected ? 'text-white/90' : 'text-slate-400'}>
                  {slice.percent.toFixed(0)}%
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
