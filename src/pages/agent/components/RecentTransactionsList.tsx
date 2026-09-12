import React from 'react';
import { ArrowDown, ArrowUp, ExternalLink, Clock, RefreshCw, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface MobCashTransaction {
  id: string;
  tx_number?: string;
  agent_id: string;
  type: 'deposit' | 'withdraw';
  customer_phone: string; // Used as Player ID
  amount: number;
  commission_rate?: number;
  commission_earned?: number;
  note?: string;
  status: string;
  created_at: string;
}

interface RecentTransactionsListProps {
  transactions: MobCashTransaction[];
  isDark: boolean;
  onSelectTransaction: (tx: MobCashTransaction) => void;
  onRefresh?: () => void;
}

export const RecentTransactionsList: React.FC<RecentTransactionsListProps> = ({
  transactions,
  isDark,
  onSelectTransaction,
  onRefresh,
}) => {
  const { t } = useTranslation();

  // Format date to: DD.MM.YYYY / HH:MM:SS
  const formatDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const pad = (n: number) => n.toString().padStart(2, '0');
      const day = pad(d.getDate());
      const month = pad(d.getMonth() + 1);
      const year = d.getFullYear();
      const hours = pad(d.getHours());
      const mins = pad(d.getMinutes());
      const secs = pad(d.getSeconds());
      return `${day}.${month}.${year} / ${hours}:${mins}:${secs}`;
    } catch {
      return dateStr;
    }
  };

  // Format number
  const formatAmount = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  // Generate a display transaction number like №...113
  const getDisplayTxNumber = (tx: MobCashTransaction, index: number) => {
    if (tx.tx_number) return tx.tx_number;
    const shortId = tx.id.replace(/\D/g, '').slice(-3) || (100 + index).toString();
    return `№...${shortId}`;
  };

  return (
    <div className="w-full">
      {/* Header Row (Page 46: Transactions récentes + external link icon) */}
      <div className="flex items-center justify-between mb-3 px-1">
        <h3
          className={`text-base sm:text-lg font-bold tracking-tight ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}
        >
          {t('recent_transactions_title', 'Transactions récentes')}
        </h3>

        <button
          onClick={onRefresh}
          className={`p-1.5 rounded-xl transition-all cursor-pointer ${
            isDark
              ? 'text-slate-400 hover:text-white hover:bg-slate-800'
              : 'text-[#3B66F5] hover:bg-blue-50'
          }`}
          title="تحديث المعاملات"
        >
          <ExternalLink className="w-4 h-4" />
        </button>
      </div>

      {/* Transactions List */}
      <div className="space-y-2.5">
        {transactions.length > 0 ? (
          transactions.map((tx, idx) => {
            const isDeposit = tx.type === 'deposit';
            const txNum = getDisplayTxNumber(tx, idx);

            return (
              <div
                key={tx.id || idx}
                onClick={() => onSelectTransaction(tx)}
                className={`rounded-2xl p-3.5 sm:p-4 flex items-center justify-between transition-all cursor-pointer active:scale-[0.99] border shadow-2xs ${
                  isDark
                    ? 'bg-slate-900/95 hover:bg-slate-800/90 border-slate-800 text-white'
                    : 'bg-white hover:bg-slate-50 border-slate-100 text-slate-900 shadow-slate-100'
                }`}
              >
                {/* Left side: Icon badge & Info */}
                <div className="flex items-center gap-3 min-w-0">
                  {/* Status Circle with Down/Up Arrow + Clock badge (Page 46) */}
                  <div className="relative shrink-0">
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center ${
                        isDeposit
                          ? 'bg-[#EBF9F1] text-[#10B981]'
                          : 'bg-[#FEF2F2] text-[#EF4444]'
                      }`}
                    >
                      {isDeposit ? (
                        <ArrowDown className="w-5 h-5 stroke-[2.5]" />
                      ) : (
                        <ArrowUp className="w-5 h-5 stroke-[2.5]" />
                      )}
                    </div>
                    {/* Small orange clock indicator (Page 46) */}
                    <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#F59E0B] border-2 border-white flex items-center justify-center shadow-xs">
                      <Clock className="w-2 h-2 text-white stroke-[2.5]" />
                    </div>
                  </div>

                  {/* Transaction metadata */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">
                        {txNum}
                      </span>
                      <div className="px-2 py-0.5 rounded-md bg-[#E8EEFD] dark:bg-slate-800 text-[#3B66F5] text-[11px] font-mono font-bold flex items-center gap-1">
                        <span>ID</span>
                        <span className="truncate max-w-[110px]">{tx.customer_phone}</span>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {formatDateTime(tx.created_at)}
                    </div>
                  </div>
                </div>

                {/* Right side: Amount (Page 46) */}
                <div className="text-right shrink-0">
                  <span
                    className={`text-sm sm:text-base font-bold font-mono ${
                      isDeposit
                        ? 'text-slate-900 dark:text-white'
                        : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    +{formatAmount(tx.amount)}
                  </span>
                  {tx.commission_earned ? (
                    <div className="text-[10px] font-semibold text-emerald-500">
                      +{formatAmount(tx.commission_earned)}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })
        ) : (
          /* Empty State (Page 9) */
          <div
            className={`rounded-2xl p-10 text-center border ${
              isDark
                ? 'bg-slate-900/60 border-slate-800 text-slate-500'
                : 'bg-white border-slate-150 text-slate-400 shadow-2xs'
            }`}
          >
            <p className="text-sm font-medium tracking-wide">Empty</p>
          </div>
        )}
      </div>
    </div>
  );
};
