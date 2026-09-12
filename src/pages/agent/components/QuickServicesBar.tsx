import React from 'react';
import { RotateCcw, ShieldCheck, CreditCard, Users, BookOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface QuickServicesBarProps {
  onOpenCancelDeposit: () => void;
  onOpenPartnership: () => void;
  onOpenPrepayment: () => void;
  onOpenSubagents: () => void;
  onOpenGuide: () => void;
  isDark: boolean;
}

export const QuickServicesBar: React.FC<QuickServicesBarProps> = ({
  onOpenCancelDeposit,
  onOpenPartnership,
  onOpenPrepayment,
  onOpenSubagents,
  onOpenGuide,
  isDark,
}) => {
  const { t } = useTranslation();

  const services = [
    {
      id: 'guide',
      title: t('agent_guide_nav', 'دليل الوكيل'),
      desc: t('guide_desc', 'كتيب الإرشادات'),
      icon: BookOpen,
      action: onOpenGuide,
      badge: 'PDF',
      color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
    },
    {
      id: 'subagents',
      title: t('subagents_nav', 'الصرافين التابعين'),
      desc: t('subagents_desc', 'برنامج الإحالة'),
      icon: Users,
      action: onOpenSubagents,
      badge: '$50',
      color: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    },
    {
      id: 'partnership',
      title: t('partnership_nav', 'التحقق من الشراكة'),
      desc: t('partner_desc', 'توثيق رسمي'),
      icon: ShieldCheck,
      action: onOpenPartnership,
      badge: 'Official',
      color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    },
    {
      id: 'cancel_deposit',
      title: t('cancel_deposit_nav', 'إلغاء الإيداع'),
      desc: t('cancel_desc', 'استرداد المعاملة'),
      icon: RotateCcw,
      action: onOpenCancelDeposit,
      color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    },
    {
      id: 'prepayment',
      title: t('epos_prepayment_nav', 'الدفع المسبق (EPOS)'),
      desc: t('prepay_desc', 'إدارة الحد والشحن'),
      icon: CreditCard,
      action: onOpenPrepayment,
      color: 'text-teal-500 bg-teal-500/10 border-teal-500/20',
    },
  ];

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2 px-1">
        <span
          className={`text-xs font-bold uppercase tracking-wider ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          {t('quick_tools_title', 'الخدمات السريعة')}
        </span>
      </div>

      <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-1 pt-0.5 px-0.5">
        {services.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={item.action}
              className={`flex-shrink-0 flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border transition-all cursor-pointer active:scale-95 shadow-2xs ${
                isDark
                  ? 'bg-slate-900/95 hover:bg-slate-800 border-slate-800 text-slate-200'
                  : 'bg-white hover:bg-slate-50 border-slate-200/80 text-slate-700 shadow-slate-100'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${item.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-right flex flex-col">
                <span className="text-xs font-bold whitespace-nowrap">{item.title}</span>
                <span className="text-[10px] text-slate-400 whitespace-nowrap">{item.desc}</span>
              </div>
              {item.badge && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-500 border border-blue-500/20">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
