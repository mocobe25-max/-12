import React, { useState } from 'react';
import { X, BookOpen, ChevronRight, ChevronLeft, ShieldCheck, DollarSign, Users, HelpCircle, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AgentGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
}

export const AgentGuideModal: React.FC<AgentGuideModalProps> = ({
  isOpen,
  onClose,
  isDark,
}) => {
  const { t } = useTranslation();
  const [activeTopic, setActiveTopic] = useState<number>(1);

  if (!isOpen) return null;

  const topics = [
    {
      id: 1,
      title: 'معلومات عامة حول كيفية العمل كوكيل',
      sub: 'آلية الإيداع، السحب، وشرح الفرق بين الحد والرصيد',
      badge: 'الأساسيات',
      content: (
        <div className="space-y-3.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400">
            <strong>نظرة عامة على مهام الوكيل:</strong>
            <p className="mt-1">
              الوكيل المعتمد لـ MobCash يعمل كنقطة صرف وإيداع نقدية للاعبين في منطقته الجغرافية المحددة. يحصل الوكيل على نسبة عمولة معتمدة عن كل إيداع وكل سحب، ويتم إيداع أرباحه تلقائياً في حسابه يوم 3 من كل شهر.
            </p>
          </div>

          <h5 className="font-bold text-slate-900 dark:text-white text-sm">
            شرح الفرق بين الحد (Limite du PDV) والرصيد (Solde):
          </h5>
          <ul className="list-disc pr-4 space-y-1.5">
            <li>
              <strong>حد نقطة البيع (Limite du PDV):</strong> هو المبلغ المتاح لك حالياً لإجراء عمليات الإيداع للاعبين.
            </li>
            <li>
              <strong>الرصيد (Solde):</strong> هو إجمالي المبلغ المنفذ في عمليات إيداع اللاعبين.
            </li>
            <li>
              <strong>آلية التحرك:</strong> عند قيامك بإيداع مبلغ للاعب، ينخفض الحد بمقدار هذا المبلغ ويزداد الرصيد بنفس القيمة تماماً.
            </li>
          </ul>

          <h5 className="font-bold text-slate-900 dark:text-white text-sm pt-1">
            خطوات اعتماد سحب اللاعب (Withdrawal):
          </h5>
          <ol className="list-decimal pr-4 space-y-1">
            <li>يطلب اللاعب السحب عبر خيار "وكيل نقدي" في تطبيق 1xBet ويختار مدينتك والشارع.</li>
            <li>يظهر للاعب في شاشته <strong>كود تأكيد (Confirmation Code)</strong> مكون من 4-8 رموز.</li>
            <li>يفتح الوكيل زر Retirer في MobCash ويدخل معرف اللاعب وكود التأكيد.</li>
            <li>فور الاعتماد، يُضاف المبلغ فوراً إلى رصيد الوكيل.</li>
          </ol>
        </div>
      ),
    },
    {
      id: 2,
      title: 'أهمية وسائل التواصل الاجتماعي واستقطاب اللاعبين',
      sub: 'نشر إثباتات الدفع، كود البرومو، ومجموعات التلغرام',
      badge: 'التسويق',
      content: (
        <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            تعد وسائل التواصل (Telegram, Instagram, Facebook, TikTok) المصدر الأساسي لتوسيع قاعدة اللاعبين لديك.
          </p>
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 space-y-2">
            <strong>أهم استراتيجيات النجاح:</strong>
            <ul className="list-disc pr-4 space-y-1 text-[11px]">
              <li>إنشاء قناة تلغرام مخصصة لخدمات الإيداع والسحب السريعة.</li>
              <li>مشاركة لقطات شاشة لإثباتات الدفع الفورية وبناء المصداقية.</li>
              <li>طلب بوسترات كود البرومو المعتمد عبر مراسلة: <span className="text-blue-500 font-mono">manager@partners1xbet.com</span></li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 3,
      title: 'خطوات استعادة حساب تطبيق Reddy الرسمي',
      sub: 'سياسة إغلاق الحساب بعد 15 يوماً من عدم النشاط وكيفية إعادة الفتح',
      badge: 'الأمان والدعم',
      content: (
        <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
            <strong>سياسة عدم النشاط:</strong>
            <p className="mt-1">
              إذا لم يقم الوكيل بأي عملية تسجيل دخول أو نشاط لمدة 15 يوماً، يتم إغلاق برنامج Reddy تلقائياً لأسباب أمنية.
            </p>
          </div>
          <h5 className="font-bold text-slate-900 dark:text-white">طريقة إعادة التنشيط:</h5>
          <p>
            تواصل مباشرة مع قسم التحقق الرسمي عبر التلغرام:
          </p>
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-slate-800 flex items-center justify-between">
            <span className="font-mono font-bold text-blue-600 dark:text-blue-400">@r_verification</span>
            <span className="text-[10px] text-slate-400">الاثنين - الجمعة (10:00 - 19:00 UTC+3)</span>
          </div>
        </div>
      ),
    },
    {
      id: 4,
      title: 'ما العمل إذا لم يكن لدى الوكيل رصيد كافٍ في EPOS',
      sub: 'حلول تحويل الرصيد والتواصل مع قسم الأمان المالي',
      badge: 'السيولة',
      content: (
        <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            إذا احتاج الوكيل لتسوية رصيده لسحب أمواله الشخصية ولم يكن الرصيد كافياً:
          </p>
          <ul className="list-disc pr-4 space-y-1.5">
            <li>
              <strong>الخيار الأول:</strong> الاستمرار في إيداع المبالغ للاعبين آخرين لنقل الأموال من الحد إلى الرصيد المتاح للسحب.
            </li>
            <li>
              <strong>الخيار الثاني:</strong> التواصل مع قسم أمان المدفوعات لتوفير طريقة سحب بديلة معتمدة عبر البريد:
              <span className="block font-mono text-blue-500 font-bold mt-1">security@1xbet-team.com</span>
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: 5,
      title: 'تعليمات إعداد التخزين التلقائي والشحن (Autoreserve)',
      sub: 'شحن حساب MobCash عبر الحساب الرئيسي أو Web Management',
      badge: 'الشحن',
      content: (
        <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            يمكن للوكيل زيادة حد نقطة البيع (EPOS Limit) الخاص به عن طريق شحن حسابه المالي الرئيسي في 1xBet أو استخدام هيكلية الدفع المسبق (Prepayment) في لوحة Web Management.
          </p>
        </div>
      ),
    },
    {
      id: 6,
      title: 'تغيير طريقة استلام العمولات والأرباح',
      sub: 'التحويل بين المحافظ البنكية، USDT، وتعديل بيانات الدفع',
      badge: 'المدفوعات',
      content: (
        <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            لتغيير وسيلة استلام الأرباح الشهرية (USDT TRC20 أو تحويل بنكي)، يتم إرسال طلب لمدير الحسابات في برنامج Reddy قبل نهاية الشهر لضمان تحويل الأرباح في الموعد المحدد (اليوم الثالث من الشهر).
          </p>
        </div>
      ),
    },
    {
      id: 7,
      title: 'كيفية إضافة صراف فرعي (Sub-Agent)',
      sub: 'رسوم 50 دولار، تحديد نطاق 5 كم، وتقسيم نسب العمولات',
      badge: 'التوسع والربح',
      content: (
        <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
            <strong>أرباح شبكة الصرافين:</strong>
            <p className="mt-1">
              يمكن للوكيل الرئيسي تعيين صرافين تابعين له والحصول على نسبة من جميع عمليات الإيداع والسحب التي ينفذونها، مع رسوم تفعيل لمرة واحدة قدرها 50 دولار تضاف لحساب Web Management.
            </p>
          </div>
          <p>
            المتطلبات: الاسم الكامل، رقم التواصل، إحداثيات الموقع بنصف قطر 5 كم، وصورة الهوية.
          </p>
        </div>
      ),
    },
  ];

  const currentTopic = topics.find((t) => t.id === activeTopic) || topics[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl border transition-all ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-white'
            : 'bg-white border-slate-100 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">
                دليل الوكيل المعتمد (MobCash Guide)
              </h3>
              <p className="text-xs text-slate-400">
                الموضوع {activeTopic} من {topics.length}
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

        {/* Horizontal Topic Selector */}
        <div className="flex items-center gap-1.5 p-2 border-b border-slate-100 dark:border-slate-800 overflow-x-auto no-scrollbar bg-slate-50 dark:bg-slate-950/40 text-xs">
          {topics.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTopic(item.id)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTopic === item.id
                  ? 'bg-[#3B66F5] text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              موضوع {item.id}
            </button>
          ))}
        </div>

        {/* Topic Body */}
        <div className="p-5 max-h-[60vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
              {currentTopic.badge}
            </span>
            <span className="text-xs font-mono text-slate-400">
              الموضوع #{currentTopic.id}
            </span>
          </div>

          <h4 className="font-black text-base sm:text-lg mb-1 text-slate-900 dark:text-white">
            {currentTopic.title}
          </h4>
          <p className="text-xs text-slate-400 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            {currentTopic.sub}
          </p>

          {currentTopic.content}
        </div>

        {/* Navigation Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/40">
          <button
            disabled={activeTopic <= 1}
            onClick={() => setActiveTopic((prev) => Math.max(1, prev - 1))}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-slate-800 transition-all"
          >
            <ChevronRight className="w-4 h-4" />
            <span>السابق</span>
          </button>

          <span className="text-xs text-slate-400 font-mono">
            {activeTopic} / {topics.length}
          </span>

          <button
            disabled={activeTopic >= topics.length}
            onClick={() => setActiveTopic((prev) => Math.min(topics.length, prev + 1))}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#3B66F5] text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#2F54DB] transition-all shadow-xs"
          >
            <span>التالي</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
