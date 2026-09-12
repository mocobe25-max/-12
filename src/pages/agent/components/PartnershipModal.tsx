import React, { useState } from 'react';
import { X, ShieldCheck, QrCode, Copy, Check, Share2, Award, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PartnershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentId: string;
  fullName: string;
  country: string;
  city: string;
  isDark: boolean;
}

export const PartnershipModal: React.FC<PartnershipModalProps> = ({
  isOpen,
  onClose,
  agentId,
  fullName,
  country,
  city,
  isDark,
}) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const verificationUrl = `https://mobcash.partners/verify/${agentId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(
      `شهادة اعتماد الوكيل الرسمي لـ MobCash & 1xBet:\nالاسم: ${fullName}\nالمعرف: ${agentId}\nالمدينة: ${city}, ${country}\nالتحقق الرسمي: https://t.me/r_verification`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
            <div className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">
                {t('partnership_title', 'التحقق من الشراكة الرسمية')}
              </h3>
              <p className="text-xs text-slate-400">
                {t('partnership_sub', 'إثبات الاعتماد الرسمي لإرساله للعملاء')}
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
          {/* Official Accreditation Badge Card */}
          <div className="relative p-5 rounded-3xl bg-gradient-to-br from-[#1E2B45] to-[#0E1726] text-white border border-blue-500/30 shadow-xl overflow-hidden text-center">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>

            <div className="w-14 h-14 mx-auto mb-2 rounded-2xl bg-[#3B66F5] text-white flex items-center justify-center shadow-lg ring-4 ring-blue-500/20">
              <Award className="w-8 h-8 text-amber-300" />
            </div>

            <span className="text-[10px] uppercase tracking-widest font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 inline-block mb-1">
              OFFICIALLY VERIFIED PARTNER
            </span>

            <h4 className="font-black text-lg text-white">{fullName}</h4>
            <p className="text-xs text-slate-300 font-mono">
              Agent ID: <span className="text-amber-400 font-bold">{agentId}</span>
            </p>

            <div className="mt-4 pt-3 border-t border-slate-700/60 grid grid-cols-2 gap-2 text-xs">
              <div className="text-right">
                <span className="text-slate-400 text-[10px] block">نطاق العمل:</span>
                <span className="font-bold text-slate-200">{city}, {country}</span>
              </div>
              <div className="text-left">
                <span className="text-slate-400 text-[10px] block">نصف القطر:</span>
                <span className="font-mono font-bold text-emerald-400">5.0 KM Radius</span>
              </div>
            </div>

            <div className="mt-3 p-2 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">قناة التحقق الرسمية:</span>
              <a
                href="https://t.me/r_verification"
                target="_blank"
                rel="noreferrer"
                className="text-[#3B66F5] font-bold flex items-center gap-1 hover:underline"
              >
                <span>t.me/r_verification</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="text-center text-xs text-slate-500 dark:text-slate-400">
            يمكنك مشاركة هذا الإثبات مع العملاء لتأكيد شرعية عمليات الإيداع والسحب.
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleCopyLink}
              className="flex-1 py-3 px-4 rounded-2xl bg-[#3B66F5] hover:bg-[#2F54DB] text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-95"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'تم نسخ شهادة الاعتماد' : 'نسخ بيانات الاعتماد'}</span>
            </button>
            <button
              onClick={onClose}
              className="py-3 px-5 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
