import React, { useState } from 'react';
import { Eye, EyeOff, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface LimitBalanceCardProps {
  limitAmount: number;
  balanceAmount: number;
  currency?: string;
  isDark: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const LimitBalanceCard: React.FC<LimitBalanceCardProps> = ({
  limitAmount,
  balanceAmount,
  currency = 'USD',
  isDark,
  onRefresh,
  isRefreshing = false,
}) => {
  const { t, i18n } = useTranslation();
  const [showValues, setShowValues] = useState(true);

  // Format numbers with French/international space or comma formatting
  const formatNumber = (val: number) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val) + ' ' + currency;
  };

  // Calculate ratio for blue progress bar
  const total = limitAmount + balanceAmount;
  const percentage = total > 0 ? Math.min(100, Math.max(12, (limitAmount / total) * 100)) : 35;

  const isRtl = ['ar', 'ur', 'fa'].includes(i18n.language?.split('-')[0] || 'en');

  return (
    <div
      className={`w-full rounded-3xl p-5 sm:p-6 transition-all shadow-sm border ${
        isDark
          ? 'bg-slate-900/95 border-slate-800 text-white shadow-slate-950/40'
          : 'bg-white border-slate-200/80 text-slate-900 shadow-sm'
      }`}
    >
      {/* Top row: Label & Eye toggle button */}
      <div className="flex items-center justify-between mb-2">
        <span
          className={`text-xs sm:text-sm font-semibold tracking-wide ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          {t('epos_limit_title', 'Limite du PDV')}
        </span>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className={`p-1.5 rounded-full transition-all cursor-pointer ${
                isDark
                  ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
              } ${isRefreshing ? 'animate-spin' : ''}`}
              title="تحديث الرصيد"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => setShowValues(!showValues)}
            className={`p-1.5 rounded-full transition-all cursor-pointer ${
              isDark
                ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title={showValues ? 'إخفاء الرصيد' : 'إظهار الرصيد'}
            aria-label="Toggle balance visibility"
          >
            {showValues ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5 text-slate-400" />}
          </button>
        </div>
      </div>

      {/* Main Limit display */}
      <div className="my-1">
        <div className="text-3xl sm:text-4xl font-extrabold tracking-tight font-sans">
          {showValues ? (
            <span className="font-mono tracking-tight font-black">
              {formatNumber(limitAmount)}
            </span>
          ) : (
            <span className="tracking-widest font-mono text-2xl text-slate-400">
              •••••••••
            </span>
          )}
        </div>
      </div>

      {/* Solde / Balance row */}
      <div className="mt-2 mb-3 flex items-center justify-between">
        <span
          className={`text-xs sm:text-sm font-medium ${
            isDark ? 'text-slate-400' : 'text-slate-600'
          }`}
        >
          {t('solde_balance', 'Solde')}:{' '}
          <strong className="font-mono font-bold">
            {showValues ? formatNumber(balanceAmount) : '••••••'}
          </strong>
        </span>
      </div>

      {/* Blue Progress Bar (Exact as in Page 9 & 46) */}
      <div
        className={`w-full h-2 rounded-full overflow-hidden ${
          isDark ? 'bg-slate-800' : 'bg-slate-100'
        }`}
      >
        <div
          className="h-full bg-[#3B66F5] rounded-full transition-all duration-500 ease-out shadow-sm shadow-blue-500/20"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
