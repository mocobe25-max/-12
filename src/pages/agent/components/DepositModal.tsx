import React, { useState } from 'react';
import { X, ArrowDown, CheckCircle2, ShieldCheck, DollarSign, User, AlertCircle, Copy, Check, Printer } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLimit: number;
  depositRate: number;
  onExecuteDeposit: (playerId: string, amount: number, note?: string) => Promise<any>;
  isDark: boolean;
}

export const DepositModal: React.FC<DepositModalProps> = ({
  isOpen,
  onClose,
  currentLimit,
  depositRate,
  onExecuteDeposit,
  isDark,
}) => {
  const { t } = useTranslation();
  const [playerId, setPlayerId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'input' | 'processing' | 'success'>('input');
  const [successReceipt, setSuccessReceipt] = useState<any>(null);
  const [copiedId, setCopiedId] = useState(false);

  if (!isOpen) return null;

  const numAmount = parseFloat(amount) || 0;
  const commissionEarned = (numAmount * (depositRate || 5)) / 100;
  const isInsufficient = numAmount > currentLimit;

  const handleQuickAmount = (val: number) => {
    setAmount(val.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerId || numAmount <= 0 || isInsufficient) return;

    setLoading(true);
    setStep('processing');

    try {
      // Simulate realistic network delay for security verification
      await new Promise((res) => setTimeout(res, 800));
      const res = await onExecuteDeposit(playerId, numAmount, note);
      setSuccessReceipt(res);
      setStep('success');
    } catch (err) {
      console.error('Error during deposit:', err);
      setStep('input');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setPlayerId('');
    setAmount('');
    setNote('');
    setStep('input');
    setSuccessReceipt(null);
    onClose();
  };

  const handleCopyReceipt = () => {
    if (successReceipt?.id) {
      navigator.clipboard.writeText(
        `MobCash Receipt: Deposit $${numAmount} to Player ID: ${playerId} - Ref: ${successReceipt.id}`
      );
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
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
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#EBF9F1] flex items-center justify-center text-[#10B981]">
              <ArrowDown className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">
                {t('player_deposit_title', 'إيداع للاعب')} (Dépôt)
              </h3>
              <p className="text-xs text-slate-400">
                {t('available_limit', 'الحد المتاح')}: ${currentLimit.toFixed(2)}
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

        {/* Body content */}
        <div className="p-5">
          {step === 'input' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Player ID Field */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-500" />
                  {t('player_id_input', 'معرف اللاعب في 1xBet (Player ID)')}
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: 94820148"
                  value={playerId}
                  onChange={(e) => setPlayerId(e.target.value)}
                  className={`w-full px-4 py-3 rounded-2xl border font-mono font-bold text-base focus:ring-2 focus:ring-blue-500 outline-hidden transition-all ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-white placeholder:text-slate-700'
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
                  }`}
                />
              </div>

              {/* Amount Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                    {t('amount_to_deposit', 'المبلغ')}
                  </label>
                  <span className="text-[11px] text-slate-400">
                    {t('min_deposit', 'الحد الأدنى $15')}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className={`w-full px-4 py-3 rounded-2xl border font-mono font-black text-xl focus:ring-2 focus:ring-emerald-500 outline-hidden transition-all ${
                      isDark
                        ? 'bg-slate-950 border-slate-800 text-emerald-400'
                        : 'bg-slate-50 border-slate-200 text-emerald-600'
                    }`}
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono font-bold text-xs text-slate-400">
                    USD
                  </span>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                {[15, 25, 50, 100, 200, 500].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleQuickAmount(val)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                      amount === val.toString()
                        ? 'bg-[#10B981] text-white shadow-xs'
                        : isDark
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    ${val}
                  </button>
                ))}
              </div>

              {/* Commission Preview Card */}
              <div
                className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs ${
                  isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-150'
                }`}
              >
                <div>
                  <span className="text-slate-400 block font-medium">
                    {t('commission_rate', 'نسبة عمولة الإيداع')}:
                  </span>
                  <span className="font-bold text-emerald-500">{depositRate}%</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block font-medium">
                    {t('expected_profit', 'ربحك من العملية')}:
                  </span>
                  <span className="font-mono font-bold text-sm text-emerald-500">
                    +${commissionEarned.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Warning if insufficient limit */}
              {isInsufficient && (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>
                    المبلغ المطلوب يتجاوز حد نقطة البيع الحالي (${currentLimit.toFixed(2)}).
                  </span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !playerId || numAmount <= 0 || isInsufficient}
                className="w-full bg-[#10B981] hover:bg-[#059669] active:bg-[#047857] text-white font-bold py-3.5 px-5 rounded-2xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <ArrowDown className="w-4 h-4" />
                <span>{t('confirm_deposit_btn', 'تأكيد وشحن رصيد اللاعب')}</span>
              </button>
            </form>
          )}

          {step === 'processing' && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-14 h-14 border-4 border-[#10B981] border-t-transparent rounded-full animate-spin"></div>
              <p className="font-bold text-base">جاري إيداع المبلغ لحساب اللاعب...</p>
              <p className="text-xs text-slate-400 font-mono">
                Player ID: {playerId} | ${numAmount}
              </p>
            </div>
          )}

          {step === 'success' && (
            <div className="py-4 flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#EBF9F1] text-[#10B981] flex items-center justify-center shadow-lg">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h4 className="font-bold text-lg text-slate-900 dark:text-white">
                  تم الإيداع بنجاح!
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  تم تحويل ${numAmount} إلى حساب اللاعب فورا
                </p>
              </div>

              {/* Official Receipt Box */}
              <div
                className={`w-full p-4 rounded-2xl border text-right font-sans text-xs space-y-2 ${
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex justify-between">
                  <span className="text-slate-400">رقم الإيصال:</span>
                  <span className="font-mono font-bold">
                    {successReceipt?.tx_number || `№...${playerId.slice(-3)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">معرف اللاعب:</span>
                  <span className="font-mono font-bold text-blue-500">{playerId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">المبلغ المشحون:</span>
                  <span className="font-mono font-bold text-emerald-500">${numAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">العمولة المكتسبة:</span>
                  <span className="font-mono font-bold text-emerald-500">
                    +${commissionEarned.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">الوقت:</span>
                  <span className="font-mono text-slate-500">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full pt-2">
                <button
                  type="button"
                  onClick={handleCopyReceipt}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {copiedId ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedId ? 'تم النسخ' : 'نسخ الإيصال'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="flex-1 py-3 px-4 rounded-xl bg-[#3B66F5] hover:bg-[#2F54DB] text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <span>تم وإغلاق</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
