import React, { useState } from 'react';
import { X, RotateCcw, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { MobCashTransaction } from './RecentTransactionsList';

interface CancelDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  recentDeposits: MobCashTransaction[];
  onExecuteCancel: (txId: string, reason: string) => Promise<boolean>;
  isDark: boolean;
}

export const CancelDepositModal: React.FC<CancelDepositModalProps> = ({
  isOpen,
  onClose,
  recentDeposits,
  onExecuteCancel,
  isDark,
}) => {
  const { t } = useTranslation();
  const [selectedTxId, setSelectedTxId] = useState('');
  const [manualTxNumber, setManualTxNumber] = useState('');
  const [reason, setReason] = useState('wrong_id');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = selectedTxId || manualTxNumber;
    if (!targetId) return;

    setLoading(true);
    try {
      await new Promise((res) => setTimeout(res, 750));
      await onExecuteCancel(targetId, reason);
      setSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedTxId('');
    setManualTxNumber('');
    setSuccess(false);
    onClose();
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
            <div className="w-9 h-9 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">
                {t('cancel_deposit_title', 'إلغاء عملية الإيداع')}
              </h3>
              <p className="text-xs text-slate-400">
                {t('cancel_deposit_sub', 'استرجاع الرصيد عند الخطأ في المعاملة')}
              </p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  وفقاً لسياسة MobCash، يمكن إلغاء الإيداع الخاطئ واسترداد حد نقطة البيع إذا تم الإبلاغ في غضون الدقائق الأولى ولم يسحب اللاعب الرصيد.
                </span>
              </div>

              {/* Choose from recent deposits if available */}
              {recentDeposits.length > 0 && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    اختر من آخر عمليات الإيداع:
                  </label>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {recentDeposits.slice(0, 4).map((tx) => (
                      <div
                        key={tx.id}
                        onClick={() => setSelectedTxId(tx.id)}
                        className={`p-3 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition-all ${
                          selectedTxId === tx.id
                            ? 'border-amber-500 bg-amber-500/10 text-amber-500 font-bold'
                            : isDark
                            ? 'bg-slate-950 border-slate-800 hover:border-slate-700'
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <span className="font-mono">Player: {tx.customer_phone}</span>
                          <span className="text-[10px] text-slate-400 block">
                            {new Date(tx.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <span className="font-mono font-bold">${tx.amount}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Or manual transaction number */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  أو أدخل رقم المعاملة (№...):
                </label>
                <input
                  type="text"
                  placeholder="مثال: №...113 أو ID اللاعب"
                  value={manualTxNumber}
                  onChange={(e) => {
                    setManualTxNumber(e.target.value);
                    if (e.target.value) setSelectedTxId('');
                  }}
                  className={`w-full px-4 py-3 rounded-2xl border font-mono text-sm focus:ring-2 focus:ring-amber-500 outline-hidden transition-all ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  سبب الإلغاء:
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-2xl border text-xs focus:ring-2 focus:ring-amber-500 outline-hidden transition-all ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-white'
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  <option value="wrong_id">خطأ في معرف اللاعب (Player ID)</option>
                  <option value="wrong_amount">إدخال مبلغ غير مقصود</option>
                  <option value="duplicate">عملية مكررة</option>
                  <option value="customer_request">طلب العميل قبل التنفيذ</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading || (!selectedTxId && !manualTxNumber)}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3.5 px-5 rounded-2xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    <span>إرسال طلب إلغاء الإيداع واسترداد الحد</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="py-6 flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h4 className="font-bold text-lg">تم قبول طلب إلغاء الإيداع</h4>
                <p className="text-xs text-slate-400 mt-1">
                  تمت إعادة المبلغ إلى حد نقطة البيع (EPOS Limit) بنجاح.
                </p>
              </div>
              <button
                onClick={handleReset}
                className="w-full py-3 px-4 rounded-xl bg-[#3B66F5] text-white text-xs font-bold cursor-pointer"
              >
                حسناً، تم
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
