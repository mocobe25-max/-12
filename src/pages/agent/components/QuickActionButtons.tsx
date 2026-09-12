import React from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface QuickActionButtonsProps {
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  isDark: boolean;
}

export const QuickActionButtons: React.FC<QuickActionButtonsProps> = ({
  onOpenDeposit,
  onOpenWithdraw,
  isDark,
}) => {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 gap-3.5 sm:gap-4 w-full">
      {/* Deposit Button (Dépôt) */}
      <button
        type="button"
        onClick={onOpenDeposit}
        className={`rounded-3xl p-4 sm:p-5 flex flex-col items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-95 border ${
          isDark
            ? 'bg-slate-900/95 hover:bg-slate-800/90 border-slate-800 text-white shadow-sm'
            : 'bg-white hover:bg-slate-50 border-slate-200/80 text-slate-800 shadow-sm'
        }`}
      >
        <div className="w-12 h-12 rounded-full bg-[#EBF9F1] flex items-center justify-center text-[#10B981] shadow-xs">
          <ArrowDown className="w-6 h-6 stroke-[2.5]" />
        </div>
        <span className="font-bold text-sm sm:text-base text-[#10B981] tracking-wide">
          {t('deposit_btn_label', 'Dépôt')}
        </span>
      </button>

      {/* Withdraw Button (Retirer) */}
      <button
        type="button"
        onClick={onOpenWithdraw}
        className={`rounded-3xl p-4 sm:p-5 flex flex-col items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-95 border ${
          isDark
            ? 'bg-slate-900/95 hover:bg-slate-800/90 border-slate-800 text-white shadow-sm'
            : 'bg-white hover:bg-slate-50 border-slate-200/80 text-slate-800 shadow-sm'
        }`}
      >
        <div className="w-12 h-12 rounded-full bg-[#FEF2F2] flex items-center justify-center text-[#EF4444] shadow-xs">
          <ArrowUp className="w-6 h-6 stroke-[2.5]" />
        </div>
        <span className="font-bold text-sm sm:text-base text-[#EF4444] tracking-wide">
          {t('withdraw_btn_label', 'Retirer')}
        </span>
      </button>
    </div>
  );
};
