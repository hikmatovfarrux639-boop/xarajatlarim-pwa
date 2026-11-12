import React from 'react';
import { Home, History, PieChart, CalendarClock, Plus } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

export type NavTab = 'home' | 'reminders' | 'history' | 'analytics' | 'settings';

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenAddModal: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  onOpenAddModal,
}) => {
  const { urgentPayments } = useFinance();
  const urgentCount = urgentPayments.length;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto">
      <div className="relative bg-white/95 dark:bg-[#111827]/95 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800/80 px-3 py-2 flex items-center justify-between pb-safe shadow-lg">
        {/* 1. Kunlik (Home) */}
        <button
          onClick={() => onTabChange('home')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'home'
              ? 'text-emerald-500 font-bold'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          <Home size={21} className={activeTab === 'home' ? 'stroke-[2.5]' : 'stroke-2'} />
          <span className="text-[11px] mt-1">Kunlik</span>
        </button>

        {/* 2. To'lovlar va Eslatmalar (Reminders) */}
        <button
          onClick={() => onTabChange('reminders')}
          className={`relative flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'reminders'
              ? 'text-amber-500 font-bold'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <CalendarClock size={21} className={activeTab === 'reminders' ? 'stroke-[2.5]' : 'stroke-2'} />
            {urgentCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center shadow">
                {urgentCount}
              </span>
            )}
          </div>
          <span className="text-[11px] mt-1">To'lovlar</span>
        </button>

        {/* Central Add Expense Button (+) */}
        <div className="flex-1 flex justify-center -mt-6">
          <button
            onClick={onOpenAddModal}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-lg shadow-emerald-500/40 flex items-center justify-center active:scale-95 transition-transform hover:shadow-emerald-500/60 ring-4 ring-white dark:ring-[#111827]"
            title="Xarajat qo'shish"
          >
            <Plus size={28} className="stroke-[2.5]" />
          </button>
        </div>

        {/* 3. Tarix & Qidiruv */}
        <button
          onClick={() => onTabChange('history')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'history'
              ? 'text-emerald-500 font-bold'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          <History size={21} className={activeTab === 'history' ? 'stroke-[2.5]' : 'stroke-2'} />
          <span className="text-[11px] mt-1">Tarix</span>
        </button>

        {/* 4. Tahlil (Analytics) */}
        <button
          onClick={() => onTabChange('analytics')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'analytics'
              ? 'text-emerald-500 font-bold'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          <PieChart size={21} className={activeTab === 'analytics' ? 'stroke-[2.5]' : 'stroke-2'} />
          <span className="text-[11px] mt-1">Tahlil</span>
        </button>
      </div>
    </div>
  );
};
