import React from 'react';
import { X, Bell, CheckCircle2, ShieldCheck, DollarSign, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  isDark,
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const notifications = [
    {
      id: 1,
      title: 'إيداع الأرباح الشهرية التلقائي',
      desc: 'تذكير: يتم إيداع صافي أرباح وعمولات الوكيل في الحساب يوم 3 من كل شهر ميلادي وفقاً لدليل MobCash الرسمي.',
      time: 'اليوم، 09:00',
      unread: true,
      icon: DollarSign,
      color: 'text-emerald-500 bg-emerald-500/10',
    },
    {
      id: 2,
      title: 'أمان الجهاز والحساب',
      desc: 'تم توثيق هذا الجهاز بنجاح. حسابك نشط ومحمي بنظام التحقق المزدوج.',
      time: 'أمس، 18:22',
      unread: true,
      icon: ShieldCheck,
      color: 'text-blue-500 bg-blue-500/10',
    },
    {
      id: 3,
      title: 'تحديث برنامج Reddy',
      desc: 'تأكد من تسجيل الدخول الدوري كل 15 يوماً للحفاظ على نشاط الحساب وتجنب الإغلاق التلقائي.',
      time: 'منذ يومين',
      unread: false,
      icon: Info,
      color: 'text-amber-500 bg-amber-500/10',
    },
  ];

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
            <div className="w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center text-[#3B66F5]">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">مركز التنبيهات والإشعارات</h3>
              <p className="text-xs text-slate-400">إشعارات النظام الرسمية لـ MobCash</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
          {notifications.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className={`p-3.5 rounded-2xl border flex items-start gap-3 transition-all ${
                  item.unread
                    ? isDark
                      ? 'bg-slate-800/60 border-slate-700'
                      : 'bg-blue-50/40 border-blue-100'
                    : isDark
                    ? 'bg-slate-950/40 border-slate-800'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h5 className="font-bold text-xs text-slate-900 dark:text-white">
                      {item.title}
                    </h5>
                    <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                      {item.time}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
