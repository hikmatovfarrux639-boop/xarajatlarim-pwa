import React, { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { CategoryIcon } from '../components/CategoryIcon';
import {
  Moon,
  Sun,
  Download,
  Upload,
  FileSpreadsheet,
  DollarSign,
  Plus,
  Check,
  X,
  ShieldCheck,
  Smartphone,
  Tag,
  RotateCcw,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const {
    categories,
    settings,
    updateSettings,
    toggleTheme,
    addCategory,
    deleteCategory,
    exportCsv,
    exportJson,
    importJson,
    resetAllToZero,
    canInstallPwa,
    installPwa,
  } = useFinance();

  const [rateInput, setRateInput] = useState<string>(
    settings.exchangeRateUsdToUzs.toString()
  );
  const [rateSaved, setRateSaved] = useState<boolean>(false);

  const [showAddCategory, setShowAddCategory] = useState<boolean>(false);
  const [catName, setCatName] = useState<string>('');
  const [catColor, setCatColor] = useState<string>('#10b981');
  const [confirmReset, setConfirmReset] = useState<boolean>(false);

  const handleSaveRate = (e: React.FormEvent) => {
    e.preventDefault();
    const rate = parseFloat(rateInput);
    if (rate > 0) {
      updateSettings({ exchangeRateUsdToUzs: rate });
      setRateSaved(true);
      setTimeout(() => setRateSaved(false), 2000);
    }
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    addCategory({
      name: catName.trim(),
      type: 'expense',
      color: catColor,
      icon: 'shopping-cart',
    });

    setCatName('');
    setShowAddCategory(false);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importJson(content);
        if (success) {
          alert("Ma'lumotlar muvaffaqiyatli tiklandi!");
        } else {
          alert('Xatolik: Fayl formati mos kelmadi.');
        }
      }
    };
    reader.readAsText(file);
  };

  const expenseCategories = categories.filter(c => c.type === 'expense');

  return (
    <div className="space-y-5 pb-28">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          Sozlamalar va Xotira
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Doimiy xotira himoyasi, Excel hisobot va bo'limlar
        </p>
      </div>

      {/* Data Persistence Explanation & 1-Click Install Card */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-900 text-white border border-emerald-500/30 shadow-lg space-y-3">
        <div className="flex items-center gap-2.5">
          <ShieldCheck size={22} className="text-emerald-400 flex-shrink-0" />
          <div>
            <h2 className="text-sm font-bold text-white">
              Xarajatlaringiz O'chib Ketmaydi (Avto-Saqlash)
            </h2>
            <span className="text-[11px] text-emerald-300">
              Qurilmaning doimiy xotirasi (Persistent Storage) faol
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Siz kiritgan har bir xarajat va to'lov eslatmasi shu zahotiyoq qurilmangizning <strong>doimiy xotirasiga</strong> yoziladi. Brauzerdan chiqib ketsangiz ham, telefon yoki kompyuterni o'chirib-yoqsangiz ham <strong>barcha ma'lumotlar 100% saqlanib turadi</strong>.
        </p>

        {canInstallPwa && (
          <button
            onClick={installPwa}
            className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-extrabold shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Smartphone size={16} />
            <span>Ilovani qurilmaga bittada o'rnatish</span>
          </button>
        )}
      </div>

      {/* Export & Data Backup */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800/80 shadow-sm space-y-3">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1 flex items-center gap-2">
          <Download size={18} className="text-emerald-500" />
          Yuklab Olish va Zaxira Nusxasi
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          <button
            onClick={exportCsv}
            className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-left flex items-center gap-3 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Excel (CSV) yuklab olish
              </span>
              <span className="text-[10px] text-slate-400">
                Jadval ko'rinishida saqlash
              </span>
            </div>
          </button>

          <button
            onClick={exportJson}
            className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-left flex items-center gap-3 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Download size={20} />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                To'liq fayl zaxirasi (.json)
              </span>
              <span className="text-[10px] text-slate-400">
                Boshqa qurilmaga ko'chirish uchun
              </span>
            </div>
          </button>
        </div>

        <div className="pt-1">
          <label className="w-full p-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center justify-center gap-2 cursor-pointer text-xs font-medium hover:border-emerald-500 transition-colors">
            <Upload size={15} /> Zaxira fayldan qayta tiklash (.json)
            <input
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Categories Management */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Tag size={18} className="text-amber-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Xarajat Bo'limlari ({expenseCategories.length})
            </h2>
          </div>
          <button
            onClick={() => setShowAddCategory(!showAddCategory)}
            className="text-xs font-semibold text-emerald-500 flex items-center gap-1 hover:underline"
          >
            <Plus size={14} /> Yangi bo'lim
          </button>
        </div>

        {showAddCategory && (
          <form onSubmit={handleCreateCategory} className="mb-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl space-y-3">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Bo'lim nomi (masalan: Kitoblar)"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                className="flex-1 text-xs px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
              <input
                type="color"
                value={catColor}
                onChange={(e) => setCatColor(e.target.value)}
                className="w-11 h-9 p-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 cursor-pointer"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddCategory(false)}
                className="text-xs px-3 py-1.5 rounded-xl text-slate-500"
              >
                Bekor
              </button>
              <button
                type="submit"
                className="text-xs px-4 py-1.5 rounded-xl bg-emerald-500 text-white font-bold"
              >
                Saqlash
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-2 gap-2">
          {expenseCategories.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                  style={{ backgroundColor: c.color }}
                >
                  <CategoryIcon name={c.icon} size={13} />
                </div>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                  {c.name}
                </span>
              </div>
              {c.isCustom && (
                <button
                  type="button"
                  onClick={() => deleteCategory(c.id)}
                  className="text-slate-400 hover:text-rose-500 flex-shrink-0"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* USD/UZS Exchange Rate */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800/80 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign size={18} className="text-emerald-500" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Dollar Kursi (1 USD = ? UZS)
          </h2>
        </div>
        <form onSubmit={handleSaveRate} className="flex gap-2">
          <input
            type="number"
            value={rateInput}
            onChange={(e) => setRateInput(e.target.value)}
            className="flex-1 text-sm px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-colors flex items-center gap-1.5 shadow"
          >
            {rateSaved ? <Check size={16} /> : null}
            {rateSaved ? 'Saqlandi' : 'Saqlash'}
          </button>
        </form>
      </div>

      {/* Theme Toggle Card */}
      <div className="p-4 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800/80 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
            {settings.theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
          </div>
          <div>
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 block">
              Tungi rejim (Dark Mode)
            </span>
            <span className="text-xs text-slate-400">
              {settings.theme === 'dark' ? 'Hozir yoqilgan' : "Hozir o'chirilgan"}
            </span>
          </div>
        </div>

        <button
          onClick={toggleTheme}
          className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-200 dark:bg-emerald-500 transition-colors focus:outline-none"
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              settings.theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Reset All Data to 0 */}
      <div className="p-4 rounded-3xl bg-white dark:bg-[#111827] border border-rose-500/20 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
            Barcha ma'lumotlarni 0 qilish
          </span>
          <span className="text-[11px] text-slate-400">
            Xarajatlar va eslatmalarni to'liq tozalash
          </span>
        </div>

        {confirmReset ? (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setConfirmReset(false)}
              className="px-2.5 py-1.5 rounded-xl text-xs text-slate-500 bg-slate-100 dark:bg-slate-800"
            >
              Bekor
            </button>
            <button
              onClick={() => {
                resetAllToZero();
                setConfirmReset(false);
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500 text-white"
            >
              Ha, 0 bo'lsin!
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmReset(true)}
            className="px-3 py-2 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw size={14} /> 0 ga tushirish
          </button>
        )}
      </div>
    </div>
  );
};
