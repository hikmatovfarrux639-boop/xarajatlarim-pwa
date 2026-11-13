import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { CategoryIcon } from '../components/CategoryIcon';
import { SmartQuickAdd } from '../components/SmartQuickAdd';
import { formatCurrency, formatUzbekDate } from '../utils/formatters';
import {
  ChevronRight,
  Trash2,
  Pencil,
  ShoppingBag,
  CalendarClock,
  BellRing,
  Check,
  Flame,
  Calendar,
} from 'lucide-react';
import { Transaction } from '../types/finance';

interface HomePageProps {
  onOpenAddModal: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onNavigateTab: (tab: any) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onOpenAddModal,
  onEditTransaction,
  onNavigateTab,
}) => {
  const {
    wallets,
    categories,
    transactions,
    urgentPayments,
    plannedPayments,
    todaySpentUzs,
    yesterdaySpentUzs,
    thisWeekSpentUzs,
    thisMonthSpentUzs,
    deleteTransaction,
    markPlannedPaymentAsPaid,
  } = useFinance();

  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const catMap = new Map(categories.map((c) => [c.id, c]));
  const walMap = new Map(wallets.map((w) => [w.id, w]));

  const recentTransactions = transactions.slice(0, 10);

  // Format today's date in Uzbek
  const now = new Date();
  const uzbekMonths = [
    'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
    'iyul', 'avgust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr',
  ];
  const todayLabel = `${now.getDate()}-${uzbekMonths[now.getMonth()]}`;

  return (
    <div className="space-y-4 pb-24">
      {/* TOP DAILY EXPENSE SUMMARY CARD (Replacing fake Wallet Balance) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white p-5 shadow-xl border border-slate-700/60">
        <div className="relative z-10">
          <div className="flex items-center justify-between text-emerald-300 mb-1.5">
            <span className="text-xs font-bold tracking-wider uppercase flex items-center gap-1.5">
              <Flame size={15} className="text-rose-400 fill-rose-400" /> Bugungi Xarajat ({todayLabel})
            </span>
            <button
              onClick={() => onNavigateTab('analytics')}
              className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 text-emerald-200 font-bold flex items-center gap-0.5 transition-colors"
            >
              Grafik & Tahlil <ChevronRight size={12} />
            </button>
          </div>

          <div className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-4">
            {formatCurrency(todaySpentUzs, 'UZS')}
          </div>

          {/* Yesterday, Week, Month comparison pills */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => onNavigateTab('analytics')}
              className="bg-white/5 hover:bg-white/10 rounded-2xl p-2.5 text-left transition-colors"
            >
              <span className="text-[10px] text-slate-400 block">Kecha</span>
              <span className="text-xs font-bold text-slate-100 truncate block mt-0.5">
                {formatCurrency(yesterdaySpentUzs, 'UZS')}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('analytics')}
              className="bg-white/5 hover:bg-white/10 rounded-2xl p-2.5 text-left transition-colors"
            >
              <span className="text-[10px] text-slate-400 block">Oxirgi 7 kun</span>
              <span className="text-xs font-bold text-slate-100 truncate block mt-0.5">
                {formatCurrency(thisWeekSpentUzs, 'UZS')}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('analytics')}
              className="bg-white/5 hover:bg-white/10 rounded-2xl p-2.5 text-left transition-colors"
            >
              <span className="text-[10px] text-slate-400 block">Shu oy jami</span>
              <span className="text-xs font-bold text-emerald-300 truncate block mt-0.5">
                {formatCurrency(thisMonthSpentUzs, 'UZS')}
              </span>
            </button>
          </div>
        </div>

        <div className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-emerald-500/15 blur-2xl pointer-events-none" />
      </div>

      {/* UPCOMING PAYMENT REMINDERS BANNER (Shows 1-2 days before or when due!) */}
      {urgentPayments.length > 0 ? (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-amber-500/15 border-2 border-amber-500/40 dark:border-amber-500/30 space-y-2.5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BellRing size={16} className="text-amber-500 animate-bounce" />
              <span className="text-xs font-extrabold text-amber-800 dark:text-amber-300 uppercase tracking-wide">
                Yaqinlashgan To'lov Eslatmasi ({urgentPayments.length})
              </span>
            </div>
            <button
              onClick={() => onNavigateTab('reminders')}
              className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center"
            >
              Barchasi <ChevronRight size={13} />
            </button>
          </div>

          <div className="space-y-2">
            {urgentPayments.map((plan) => (
              <div
                key={plan.id}
                className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-amber-500/20 shadow-sm"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md text-white ${
                        plan.daysLeft <= 0 ? 'bg-rose-500' : 'bg-amber-500'
                      }`}
                    >
                      {plan.daysLeft < 0
                        ? `${Math.abs(plan.daysLeft)} kun kechikdi`
                        : plan.daysLeft === 0
                        ? 'BUGUN'
                        : plan.daysLeft === 1
                        ? 'ERTAGA'
                        : `${plan.daysLeft} kun qoldi`}
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {plan.title}
                    </span>
                  </div>
                  <span className="text-xs font-extrabold text-rose-500 block mt-1">
                    {formatCurrency(plan.amount, plan.currency)}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => markPlannedPaymentAsPaid(plan.id)}
                  className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 flex-shrink-0 shadow-sm active:scale-95 transition-all"
                >
                  <Check size={14} className="stroke-[3]" />
                  <span>To'ladim</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Subtle shortcut to add scheduled payments if none are urgent right now */
        <div
          onClick={() => onNavigateTab('reminders')}
          className="px-4 py-3 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between cursor-pointer hover:border-amber-500/40 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <CalendarClock size={16} />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Rejali to'lovlar va eslatmalar
              </span>
              <span className="text-[11px] text-slate-400">
                {plannedPayments.length > 0
                  ? `${plannedPayments.length} ta to'lov rejalashtirilgan`
                  : "Oylik to'lov vaqtlarini kiritib qo'ying"}
              </span>
            </div>
          </div>
          <ChevronRight size={16} className="text-slate-400" />
        </div>
      )}

      {/* 1-STEP SMART QUICK INPUT BAR ("Tezkor Xarajat") */}
      <SmartQuickAdd onOpenFullModal={onOpenAddModal} />

      {/* Recent Daily Expenses List */}
      <div>
        <div className="flex items-center justify-between mb-2.5 px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Kunlik Xarajatlar Ro'yxati
          </h2>
          <button
            onClick={() => onNavigateTab('history')}
            className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center"
          >
            Barchasi ({transactions.length}) <ChevronRight size={14} />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-slate-800">
            <ShoppingBag className="mx-auto mb-2 text-slate-300 dark:text-slate-600" size={36} />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Hali xarajatlar kiritilmadi
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentTransactions.map((tx) => {
              const cat = catMap.get(tx.categoryId);
              const wal = walMap.get(tx.walletId);
              const hasChecklist = tx.items && tx.items.length > 0;
              const isSelected = selectedTx?.id === tx.id;

              return (
                <div
                  key={tx.id}
                  onClick={() => {
                    setSelectedTx(isSelected ? null : tx);
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
                        <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 truncate">
                          <span className="truncate">{tx.title}</span>
                          {hasChecklist && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-medium flex-shrink-0">
                              {tx.items?.length} ta
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                          <span>{cat?.name || 'Xarajat'}</span>
                          <span>•</span>
                          <span>{wal?.name?.split(' ')[0] || 'Karta'}</span>
                          <span>•</span>
                          <span>{formatUzbekDate(tx.date)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right pl-2 flex-shrink-0">
                      <span className="text-sm font-bold block text-rose-500">
                        -{formatCurrency(tx.amount, tx.currency)}
                      </span>
                    </div>
                  </div>

                  {/* Expanded details + Edit / Delete actions */}
                  {isSelected && (
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs animate-in fade-in duration-150">
                      {tx.note && (
                        <p className="text-slate-500 dark:text-slate-400 mb-2 italic">
                          "{tx.note}"
                        </p>
                      )}

                      {hasChecklist && (
                        <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-2.5 mb-2.5 space-y-1">
                          <span className="font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                            Bozorlik tarkibi:
                          </span>
                          {tx.items?.map((item, i) => (
                            <div key={i} className="flex justify-between text-slate-600 dark:text-slate-400">
                              <span>• {item.name}</span>
                              <span className="font-medium text-slate-800 dark:text-slate-200">
                                {formatCurrency(item.price, tx.currency)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-2">
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
                                  setSelectedTx(null);
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
        )}
      </div>
    </div>
  );
};
