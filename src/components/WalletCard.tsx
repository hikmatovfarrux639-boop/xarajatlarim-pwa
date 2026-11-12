import React from 'react';
import { Wallet } from '../types/finance';
import { formatCurrency } from '../utils/formatters';
import { CategoryIcon } from './CategoryIcon';

interface WalletCardProps {
  wallet: Wallet;
  isSelected?: boolean;
  onClick?: () => void;
}

export const WalletCard: React.FC<WalletCardProps> = ({
  wallet,
  isSelected,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl p-4 transition-all cursor-pointer min-w-[170px] flex-1 ${
        isSelected
          ? 'ring-2 ring-emerald-500 shadow-md shadow-emerald-500/20'
          : 'hover:opacity-95'
      } bg-gradient-to-br from-slate-900 to-slate-800 text-white border border-slate-700/50`}
      style={{
        boxShadow: isSelected ? `0 8px 20px -4px ${wallet.color}40` : undefined,
      }}
    >
      {/* Glow decorative blur circle */}
      <div
        className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full blur-2xl opacity-30 pointer-events-none"
        style={{ backgroundColor: wallet.color }}
      />

      <div className="flex items-center justify-between mb-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
          style={{ backgroundColor: wallet.color }}
        >
          <CategoryIcon name={wallet.icon} size={18} />
        </div>
        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-slate-200">
          {wallet.currency}
        </span>
      </div>

      <div className="text-xs text-slate-300 font-medium truncate mb-1">
        {wallet.name}
      </div>

      <div className="text-lg font-bold tracking-tight text-white truncate">
        {formatCurrency(wallet.balance, wallet.currency)}
      </div>
    </div>
  );
};
