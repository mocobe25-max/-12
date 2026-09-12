import React from 'react';
import { X, CreditCard, ArrowRight, ShieldCheck, DollarSign, ExternalLink, HelpCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PrepaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  limitAmount: number;
  balanceAmount: number;
  agentId: string;
  isDark: boolean;
}

export const PrepaymentModal: React.FC<PrepaymentModalProps> = ({
  isOpen,
  onClose,
  limitAmount,
  balanceAmount,
  agentId,
  isDark,
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

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
            <div className="w-9 h-9 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-500">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">الدفع المسبق وشحن الحد (EPOS)</h3>
              <p className="text-xs text-slate-400">هيكلية تمويل نقاط البيع الإلكترونية</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 leading-relaxed">
            <strong>نظام تمويل نقطة البيع المسبق:</strong>
            <p className="mt-1">
              يسمح نظام الدفع المسبق بشحن رصيد نقطة البيع فوراً عبر تحويل الأموال من حسابك المالي أو من خلال الوكيل المميز (Superagent) دون الحاجة لانتظار التسويات المصرفية.
            </p>
          </div>

          <div
            className={`p-4 rounded-2xl border space-y-2.5 font-mono ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex justify-between">
              <span className="text-slate-400 font-sans">حد نقطة البيع الحالي (Limit):</span>
              <span className="font-bold text-blue-500">${limitAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-sans">الرصيد المنفذ (Solde):</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">${balanceAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-2 text-emerald-500 font-bold">
              <span className="font-sans">مجموعة التمويل (Finance Group):</span>
              <span>نشط (Active)</span>
            </div>
          </div>

          <div className="space-y-2">
            <h5 className="font-bold text-slate-800 dark:text-slate-200">
              طرق زيادة الحد وإعادة الشحن (Autoreserve):
            </h5>
            <ol className="list-decimal pr-4 space-y-1 text-slate-500 dark:text-slate-400 leading-relaxed">
              <li>إجراء عمليات إيداع للاعبين لتحريك المبالغ بين الرصيد والحد.</li>
              <li>طلب زيادة الحد المسبق عبر مدير الحسابات في Reddy.</li>
              <li>التحويل المباشر من الحساب الرئيسي إلى حساب الصراف.</li>
            </ol>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 px-4 rounded-xl bg-[#3B66F5] hover:bg-[#2F54DB] text-white font-bold transition-all shadow-md cursor-pointer"
          >
            حسناً، فهمت
          </button>
        </div>
      </div>
    </div>
  );
};
