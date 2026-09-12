import React from 'react';
import { X, User, ShieldCheck, MapPin, Percent, Moon, Sun, Globe, LogOut, Copy, Check, MessageSquare, ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../../../components/LanguageSwitcher';

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  depositRate: number;
  withdrawRate: number;
  onLogout: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const ProfileDrawer: React.FC<ProfileDrawerProps> = ({
  isOpen,
  onClose,
  user,
  depositRate,
  withdrawRate,
  onLogout,
  isDark,
  onToggleTheme,
}) => {
  const { t } = useTranslation();
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handleCopyId = () => {
    if (user?.agent_id) {
      navigator.clipboard.writeText(user.agent_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`w-full max-w-sm h-full flex flex-col shadow-2xl transition-all border-l ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-base">{t('profile_and_account', 'الملف الشخصي والحساب')}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {/* User Profile Card */}
          <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
            <div className="w-13 h-13 rounded-full bg-[#3B66F5] text-white flex items-center justify-center font-black text-xl shadow-md">
              {user?.first_name ? user.first_name[0].toUpperCase() : 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-black text-base truncate">
                {user?.first_name || user?.full_name || 'MobCash Agent'} {user?.last_name || ''}
              </h4>
              <button
                onClick={handleCopyId}
                className="text-xs font-mono font-bold text-[#3B66F5] flex items-center gap-1.5 mt-0.5"
              >
                <span>ID: {user?.agent_id}</span>
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3 h-3 text-slate-400" />}
              </button>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold mt-1.5">
                <ShieldCheck className="w-3 h-3" />
                <span>{t('verified_agent', 'وكيل معتمد وموثق')}</span>
              </span>
            </div>
          </div>

          {/* Commissions Breakdown */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              {t('approved_commission_rates', 'نسب العمولات المعتمدة:')}
            </span>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-bold">
                  {t('deposit_commission_short', 'عمولة الإيداع (Deposit)')}
                </span>
                <span className="text-lg font-black font-mono text-emerald-500">
                  {depositRate}%
                </span>
              </div>
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
                <span className="text-[10px] text-rose-600 dark:text-rose-400 block font-bold">
                  {t('withdraw_commission_short', 'عمولة السحب (Withdraw)')}
                </span>
                <span className="text-lg font-black font-mono text-rose-500">
                  {withdrawRate}%
                </span>
              </div>
            </div>
          </div>

          {/* Location Info */}
          {(user?.country || user?.city) && (
            <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 font-bold">
                <MapPin className="w-3.5 h-3.5 text-blue-500" />
                <span>{t('registered_work_area', 'نطاق العمل المسجل:')}</span>
              </div>
              <p className="font-bold pr-5">
                {user?.city ? `${user.city}، ` : ''}{user?.country || ''}
              </p>
            </div>
          )}

          {/* Theme Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              {isDark ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
              <span className="font-bold">{t('theme_appearance', 'المظهر (Dark / Light)')}</span>
            </div>
            <button
              onClick={onToggleTheme}
              className="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isDark ? t('dark_mode', 'الوضع الداكن') : t('light_mode', 'الوضع الفاتح')}
            </button>
          </div>

          {/* Language Switcher */}
          <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-500" />
              <span className="font-bold">{t('app_language', 'لغة التطبيق')}</span>
            </div>
            <LanguageSwitcher />
          </div>

          {/* Support Link */}
          <a
            href="https://t.me/r_verification"
            target="_blank"
            rel="noreferrer"
            className="w-full p-3 rounded-xl bg-blue-50 dark:bg-slate-800 text-[#3B66F5] text-xs font-bold flex items-center justify-between hover:bg-blue-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span>{t('agent_support', 'دعم الوكلاء المعتمد (Reddy & Telegram)')}</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Drawer Footer: Logout */}
        <div className="p-5 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onLogout}
            className="w-full py-3 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('logout_account', 'تسجيل الخروج من الحساب')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
