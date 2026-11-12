import React, { ReactNode, useState } from 'react';
import { Moon, Sun, Settings, Receipt, Download, ShieldCheck, X, Smartphone } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { NavTab } from './BottomNav';

interface LayoutProps {
  children: ReactNode;
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  const { settings, toggleTheme, canInstallPwa, installPwa } = useFinance();
  const [showInstallHelp, setShowInstallHelp] = useState<boolean>(false);

  const handleInstallClick = () => {
    if (canInstallPwa) {
      installPwa();
    } else {
      setShowInstallHelp(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#070b13] flex justify-center selection:bg-emerald-500 selection:text-white">
      <div className="w-full max-w-md min-h-screen bg-slate-50 dark:bg-[#0b0f19] flex flex-col relative sm:shadow-2xl sm:border-x sm:border-slate-200 dark:sm:border-slate-800">
        {/* Top Sticky Header */}
        <header className="sticky top-0 z-30 bg-slate-50/90 dark:bg-[#0b0f19]/90 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60">
          <div
            onClick={() => onTabChange('home')}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-sm shadow-emerald-500/30">
              <Receipt size={17} />
            </div>
            <div>
              <span className="text-sm font-black tracking-tight text-slate-900 dark:text-white block leading-none">
                Xarajatlarim
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                <ShieldCheck size={11} /> Doimiy xotira yoqilgan
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* 1-Click Install App Button */}
            <button
              onClick={handleInstallClick}
              title="Ilova sifatida bittada yuklab olish / o'rnatish"
              className="px-2.5 h-8 rounded-xl bg-emerald-500/15 hover:bg-emerald-500 hover:text-white text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1 transition-all active:scale-95"
            >
              <Download size={13} />
              <span>O'rnatish</span>
            </button>

            <button
              onClick={toggleTheme}
              title="Tungi / Kunduzgi rejim"
              className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-emerald-500 transition-colors"
            >
              {settings.theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            <button
              onClick={() => onTabChange(activeTab === 'settings' ? 'home' : 'settings')}
              title="Sozlamalar va Zaxira"
              className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-colors ${
                activeTab === 'settings'
                  ? 'bg-emerald-500 text-white border-emerald-500'
                  : 'bg-white dark:bg-slate-800/90 border-slate-200/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 hover:text-emerald-500'
              }`}
            >
              <Settings size={15} />
            </button>
          </div>
        </header>

        {/* Quick Install Modal if native prompt wasn't triggered automatically */}
        {showInstallHelp && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in"
            onClick={() => setShowInstallHelp(false)}
          >
            <div
              className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 p-5 space-y-3 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm">
                  <Smartphone size={18} />
                  <span>Ilova sifatida o'rnatish</span>
                </div>
                <button
                  onClick={() => setShowInstallHelp(false)}
                  className="p-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
                <p>
                  <strong>💻 Kompyuterda (Chrome / Edge):</strong> Brauzerning manzil qatori (URL) o'ng tomonidagi <strong>"O'rnatish" (📥 kompyuter belgisi)</strong> tugmasini bosing.
                </p>
                <p>
                  <strong>📱 Telefonda (Android / iPhone):</strong> Brauzer menyusidan (3 ta nuqta yoki Ulashish) <strong>"Bosh ekranga qo'shish" (Add to Home Screen / Установить приложение)</strong> tugmasini bosing.
                </p>
                <p className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-medium">
                  🛡️ Barcha kiritgan xarajatlaringiz qurilmaning doimiy xotirasida avto-saqlanadi — brauzerdan chiqib ketsangiz ham hech qachon o'chib ketmaydi!
                </p>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 px-4 pt-3">
          {children}
        </main>
      </div>
    </div>
  );
};
