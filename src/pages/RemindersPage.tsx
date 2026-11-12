import React, { useState } from 'react';
import { useFinance, PlannedPaymentWithStatus } from '../context/FinanceContext';
import { formatCurrency, formatNumber, toInputDate } from '../utils/formatters';
import { CategoryIcon } from '../components/CategoryIcon';
import {
  Bell,
  BellRing,
  CalendarClock,
  Check,
  Plus,
  Repeat,
  Trash2,
  AlertTriangle,
  Clock,
  CheckCircle2,
  X,
} from 'lucide-react';

const PAYMENT_TEMPLATES = [
  { title: 'Uy interneti (Wi-Fi)', categoryId: 'cat_phone', amount: 90000 },
  { title: 'Telefon oylik tarifi', categoryId: 'cat_phone', amount: 50000 },
  { title: 'Elektr va Gaz (Kommunal)', categoryId: 'cat_home', amount: 150000 },
  { title: "Kredit / Bo'lib to'lash", categoryId: 'cat_home', amount: 1000000 },
  { title: 'Ijara (Kvartira) to\'lovi', categoryId: 'cat_home', amount: 2500000 },
  { title: "Kurs / O'qish to'lovi", categoryId: 'cat_other_exp', amount: 500000 },
];

export const RemindersPage: React.FC = () => {
  const {
    plannedPayments,
    categories,
    addPlannedPayment,
    deletePlannedPayment,
    markPlannedPaymentAsPaid,
  } = useFinance();

  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [amountStr, setAmountStr] = useState<string>('');
  const [currency, setCurrency] = useState<'UZS' | 'USD'>('UZS');
  const [categoryId, setCategoryId] = useState<string>('cat_phone');
  const [dueDate, setDueDate] = useState<string>(() => {
    const tomorrow = new Date(Date.now() + 86400000);
    return toInputDate(tomorrow);
  });
  const [isRecurringMonthly, setIsRecurringMonthly] = useState<boolean>(true);
  const [notifyDaysBefore, setNotifyDaysBefore] = useState<number>(1);
  const [paidFeedback, setPaidFeedback] = useState<string | null>(null);
  const [notifPermission, setNotifPermission] = useState<string>(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );

  const catMap = new Map(categories.map(c => [c.id, c]));
  const rawAmount = parseFloat(amountStr.replace(/\s/g, '')) || 0;
  const formattedDisplayAmount = amountStr ? formatNumber(rawAmount) : '';

  // Total monthly planned payments in UZS
  const totalPlannedUzs = plannedPayments.reduce(
    (sum, p) => sum + (p.currency === 'USD' ? p.amount * 12850 : p.amount),
    0
  );

  const handleRequestNotification = async () => {
    if (typeof Notification === 'undefined') return;
    const res = await Notification.requestPermission();
    setNotifPermission(res);
    if (res === 'granted') {
      new Notification('Spendo — Eslatmalar yoqildi! 🔔', {
        body: "To'lov vaqti yaqinlashganda sizga eslatma yuboramiz.",
      });
    }
  };

  const handleSelectTemplate = (tpl: typeof PAYMENT_TEMPLATES[0]) => {
    setTitle(tpl.title);
    setCategoryId(tpl.categoryId);
    setAmountStr(tpl.amount.toString());
  };

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || rawAmount <= 0 || !dueDate) return;

    addPlannedPayment({
      title: title.trim(),
      amount: rawAmount,
      currency,
      categoryId,
      dueDate,
      isRecurringMonthly,
      notifyDaysBefore,
    });

    setTitle('');
    setAmountStr('');
    setShowAddForm(false);
  };

  const handlePayNow = (plan: PlannedPaymentWithStatus) => {
    markPlannedPaymentAsPaid(plan.id);
    setPaidFeedback(
      `"${plan.title}" (${formatCurrency(plan.amount, plan.currency)}) bugungi xarajatlarga qo'shildi!`
    );
    setTimeout(() => setPaidFeedback(null), 4000);
  };

  const renderDaysBadge = (plan: PlannedPaymentWithStatus) => {
    if (plan.daysLeft < 0) {
      return (
        <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-xl bg-rose-500 text-white flex items-center gap-1">
          <AlertTriangle size={12} /> {Math.abs(plan.daysLeft)} kun kechikdi!
        </span>
      );
    }
    if (plan.daysLeft === 0) {
      return (
        <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-xl bg-rose-500 text-white animate-pulse flex items-center gap-1">
          <BellRing size={12} /> Bugun to'lov kuni!
        </span>
      );
    }
    if (plan.daysLeft === 1) {
      return (
        <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-xl bg-amber-500 text-white flex items-center gap-1">
          <Clock size={12} /> Ertaga (1 kun qoldi)
        </span>
      );
    }
    if (plan.daysLeft <= plan.notifyDaysBefore) {
      return (
        <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
          ⏰ {plan.daysLeft} kun qoldi
        </span>
      );
    }
    return (
      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
        {plan.daysLeft} kun bor
      </span>
    );
  };

  const formatUzbekShortDate = (yyyyMmDd: string) => {
    const [y, m, d] = yyyyMmDd.split('-').map(Number);
    const months = [
      'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
      'iyul', 'avgust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr',
    ];
    return `${d}-${months[(m || 1) - 1]}`;
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarClock size={22} className="text-amber-500" />
            To'lovlar va Eslatmalar
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Aniq vaqtli to'lovlarni kiriting — 1 kun oldin eslatib turadi
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3.5 py-2 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-500/25 flex items-center gap-1.5 active:scale-95 transition-all"
        >
          {showAddForm ? <X size={15} /> : <Plus size={15} />}
          <span>{showAddForm ? 'Yopish' : "Yangi to'lov"}</span>
        </button>
      </div>

      {/* Paid Feedback Toast */}
      {paidFeedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
          <span>{paidFeedback}</span>
        </div>
      )}

      {/* Browser Notification Permission Banner */}
      {notifPermission === 'default' && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs text-amber-700 dark:text-amber-300">
            <Bell size={18} className="text-amber-500 flex-shrink-0" />
            <span>To'lov sanasi kelganda telefoningizga bildirishnoma (Push) yuborilsinmi?</span>
          </div>
          <button
            onClick={handleRequestNotification}
            className="px-3 py-1.5 rounded-xl bg-amber-500 text-white text-xs font-bold whitespace-nowrap shadow-sm"
          >
            Yoqish
          </button>
        </div>
      )}

      {/* ADD NEW PLANNED PAYMENT FORM */}
      {showAddForm && (
        <form
          onSubmit={handleCreatePlan}
          className="p-5 rounded-3xl bg-white dark:bg-[#111827] border-2 border-emerald-500/40 shadow-xl space-y-4 animate-in fade-in duration-150"
        >
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Yangi to'lov eslatmasini qo'shish
          </h2>

          {/* Quick Templates */}
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
              Tayyor shablonlardan tanlang:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PAYMENT_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.title}
                  type="button"
                  onClick={() => handleSelectTemplate(tpl)}
                  className={`text-xs px-2.5 py-1.5 rounded-xl font-semibold border transition-all ${
                    title === tpl.title
                      ? 'bg-emerald-500 text-white border-emerald-500'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-500'
                  }`}
                >
                  {tpl.title}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Name */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
              To'lov nomi
            </label>
            <input
              type="text"
              required
              placeholder="Masalan: Uy interneti, Kredit, Ijara..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-sm px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Amount + Quick buttons */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
              To'lov summasi
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                inputMode="decimal"
                required
                placeholder="0"
                value={formattedDisplayAmount}
                onChange={(e) => setAmountStr(e.target.value.replace(/[^0-9.]/g, ''))}
                className="flex-1 text-lg font-extrabold px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as any)}
                className="text-xs font-bold px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
              >
                <option value="UZS">UZS (so'm)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {[50000, 75000, 100000, 150000, 300000, 500000, 1000000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmountStr(amt.toString())}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-emerald-500 hover:text-white transition-colors"
                >
                  {amt >= 1000000 ? `${amt / 1000000} mln` : `${amt / 1000} ming`}
                </button>
              ))}
            </div>
          </div>

          {/* Due Date & Notify Days Before */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                To'lov sanasi (Qachon?)
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                Qachon eslatsin?
              </label>
              <select
                value={notifyDaysBefore}
                onChange={(e) => setNotifyDaysBefore(Number(e.target.value))}
                className="w-full text-xs px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-semibold"
              >
                <option value={1}>1 kun oldin va o'sha kuni</option>
                <option value={2}>2 kun oldin</option>
                <option value={3}>3 kun oldin</option>
                <option value={5}>5 kun oldin</option>
              </select>
            </div>
          </div>

          {/* Recurring monthly toggle */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Repeat size={16} className="text-emerald-500" />
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Har oy takrorlansinmi?
                </span>
                <span className="text-[10px] text-slate-400">
                  "To'ladim" bosilganda avtomatik keyingi oyga o'tadi
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isRecurringMonthly}
              onChange={(e) => setIsRecurringMonthly(e.target.checked)}
              className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
            />
          </div>

          <button
            type="submit"
            disabled={!title.trim() || rawAmount <= 0}
            className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
          >
            <Check size={16} className="stroke-[3]" /> Eslatmani saqlash
          </button>
        </form>
      )}

      {/* Summary Banner */}
      <div className="p-4 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-400 font-medium block">
            Rejadagi oylik doimiy to'lovlar
          </span>
          <span className="text-lg font-black text-slate-900 dark:text-white">
            {formatCurrency(totalPlannedUzs, 'UZS')}
          </span>
        </div>
        <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
          {plannedPayments.length} ta to'lov
        </span>
      </div>

      {/* Planned Payments List */}
      {plannedPayments.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-[#111827] rounded-3xl border border-slate-200 dark:border-slate-800">
          <CalendarClock className="mx-auto mb-2 text-slate-300 dark:text-slate-600" size={40} />
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            Hali rejali to'lovlar kiritilmagan
          </p>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            Internet, kommunal, ijara yoki kredit to'lov vaqtlarini qo'shib qo'ying — ilova 1 kun oldin eslatib turadi!
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-xs font-bold shadow"
          >
            + Birinchi to'lov vaqtini qo'shish
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {plannedPayments.map((plan) => {
            const cat = catMap.get(plan.categoryId);
            return (
              <div
                key={plan.id}
                className={`p-4 rounded-3xl bg-white dark:bg-[#111827] border transition-all shadow-sm ${
                  plan.daysLeft <= 1
                    ? 'border-rose-500/50 ring-1 ring-rose-500/20'
                    : plan.isUrgent
                    ? 'border-amber-500/50'
                    : 'border-slate-200/80 dark:border-slate-800/80'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-white flex-shrink-0"
                      style={{ backgroundColor: cat?.color || '#06b6d4' }}
                    >
                      <CategoryIcon name={cat?.icon || 'smartphone'} size={18} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {plan.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                        <span>Sana: <strong className="text-slate-600 dark:text-slate-300">{formatUzbekShortDate(plan.dueDate)}</strong></span>
                        {plan.isRecurringMonthly && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-0.5 text-emerald-500 font-medium">
                              <Repeat size={11} /> Har oy
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {renderDaysBadge(plan)}
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
                  <div>
                    <span className="text-[10px] text-slate-400 block">To'lov summasi:</span>
                    <span className="text-base font-black text-slate-900 dark:text-white">
                      {formatCurrency(plan.amount, plan.currency)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => deletePlannedPayment(plan.id)}
                      title="O'chirish"
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePayNow(plan)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-sm shadow-emerald-500/20 flex items-center gap-1.5 active:scale-95 transition-all"
                    >
                      <Check size={14} className="stroke-[3]" />
                      <span>To'ladim</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
