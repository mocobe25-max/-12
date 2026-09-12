import React, { useState } from 'react';
import { X, ArrowDown, ArrowUp, Copy, Check, Printer, Share2, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { MobCashTransaction } from './RecentTransactionsList';

interface TransactionDetailsModalProps {
  transaction: MobCashTransaction | null;
  onClose: () => void;
  isDark: boolean;
}

export const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({
  transaction,
  onClose,
  isDark,
}) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  if (!transaction) return null;

  const isDeposit = transaction.type === 'deposit';

  const handleCopy = () => {
    navigator.clipboard.writeText(
      `إيصال عملية MobCash:\nالنوع: ${isDeposit ? 'إيداع' : 'سحب'}\nالمبلغ: $${transaction.amount}\nمعرف اللاعب: ${transaction.customer_phone}\nالمرجع: ${transaction.id}\nالتاريخ: ${transaction.created_at}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border transition-all ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-white'
            : 'bg-white border-slate-100 text-slate-900'
        }`}
      >
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center ${
                isDeposit
                  ? 'bg-emerald-500/10 text-emerald-500'
                  : 'bg-rose-500/10 text-rose-500'
              }`}
            >
              {isDeposit ? <ArrowDown className="w-5 h-5" /> : <ArrowUp className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-base">تفاصيل المعاملة الرسمية</h3>
              <p className="text-xs text-slate-400 font-mono">
                {transaction.tx_number || `№...${transaction.id.slice(-4)}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Big Amount Card */}
          <div
            className={`p-5 rounded-2xl border text-center ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              {isDeposit ? 'المبلغ المشحون' : 'المبلغ المسحوب'}
            </span>
            <div className="text-3xl font-black font-mono tracking-tight">
              ${transaction.amount.toFixed(2)}
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold mt-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>مكتملة ومعتمدة في النظام</span>
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-400">معرف اللاعب (Player ID):</span>
              <span className="font-mono font-bold text-blue-500">
                {transaction.customer_phone}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-400">نوع العملية:</span>
              <span className="font-bold">
                {isDeposit ? 'إيداع نقدي (Dépôt)' : 'سحب نقدي (Retirer)'}
              </span>
            </div>
            {transaction.commission_earned ? (
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 text-emerald-500 font-bold">
                <span>العمولة المكتسبة:</span>
                <span className="font-mono">+${transaction.commission_earned.toFixed(2)}</span>
              </div>
            ) : null}
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-400">تاريخ ووقت المعاملة:</span>
              <span className="font-mono text-slate-500">
                {new Date(transaction.created_at).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-400">المرجع الداخلي:</span>
              <span className="font-mono text-[10px] text-slate-400">{transaction.id}</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={handleCopy}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'تم نسخ الإيصال' : 'نسخ الإيصال'}</span>
            </button>
            <button
              onClick={handlePrint}
              className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
