import React from 'react';
import { User, Bell, Copy, Check, LogOut, Globe, Moon, Sun, ShieldCheck, MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface MobCashHeaderProps {
  agentId: string;
  fullName: string;
  copied: boolean;
  onCopyId: () => void;
  onOpenProfile: () => void;
  onOpenNotifications: () => void;
  onOpenSupport?: () => void;
  unreadCount?: number;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const MobCashHeader: React.FC<MobCashHeaderProps> = ({
  agentId,
  fullName,
  copied,
  onCopyId,
  onOpenProfile,
  onOpenNotifications,
  onOpenSupport,
  unreadCount = 2,
  isDark,
  onToggleTheme,
}) => {
  const { t } = useTranslation();

  return (
    <header className={`w-full pt-3 pb-2 px-4 flex items-center justify-between transition-colors ${
      isDark ? 'text-white' : 'text-slate-800'
    }`}>
      {/* Left: User Profile Icon Button (Page 9 & 46) */}
      <div className="flex items-center gap-2">
        <button
          onClick={onOpenProfile}
          className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-sm active:scale-95 ${
            isDark 
              ? 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700' 
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-slate-200/50'
          }`}
          title={t('profile', 'الملف الشخصي والإعدادات')}
          aria-label="Profile"
        >
          <User className="w-5 h-5" />
        </button>
      </div>

      {/* Center: ID with Badge (Page 9 & 46) */}
      <button
        onClick={onCopyId}
        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full transition-all cursor-pointer active:scale-95 border ${
          isDark
            ? 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-200'
            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 shadow-sm'
        }`}
        title={t('click_to_copy_id', 'انقر لنسخ المعرف ID')}
      >
        <span className="text-xs font-bold text-slate-400">ID</span>
        <span className="font-mono font-bold text-sm tracking-wide text-[#3B66F5]">
          {agentId}
        </span>
        {copied ? (
          <Check className="w-3.5 h-3.5 text-emerald-500 animate-in zoom-in-50 duration-200" />
        ) : (
          <Copy className="w-3 h-3 text-slate-400 hover:text-slate-600 transition-colors" />
        )}
      </button>

      {/* Right: Support, Notifications Bell & Theme toggle */}
      <div className="flex items-center gap-2">
        {onOpenSupport && (
          <button
            onClick={onOpenSupport}
            className={`w-11 h-11 rounded-full flex items-center justify-center relative transition-all cursor-pointer shadow-sm active:scale-95 ${
              isDark
                ? 'bg-slate-800/90 hover:bg-slate-700 text-blue-400 border border-slate-700'
                : 'bg-white hover:bg-slate-100 text-blue-600 border border-slate-200 shadow-slate-200/50'
            }`}
            title={t('live_support', 'الدعم المباشر (شات)')}
            aria-label="Live Support"
          >
            <MessageSquare className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white"></span>
          </button>
        )}

        <button
          onClick={onToggleTheme}
          className={`w-9 h-9 rounded-full hidden sm:flex items-center justify-center transition-all cursor-pointer ${
            isDark
              ? 'bg-slate-800 text-amber-400 hover:bg-slate-700'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
          title={isDark ? t('light_mode', 'الوضع الفاتح') : t('dark_mode', 'الوضع الداكن')}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <button
          onClick={onOpenNotifications}
          className={`w-11 h-11 rounded-full flex items-center justify-center relative transition-all cursor-pointer shadow-sm active:scale-95 ${
            isDark
              ? 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-slate-200/50'
          }`}
          title={t('notifications', 'الإشعارات')}
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white"></span>
          )}
        </button>
      </div>
    </header>
  );
};
