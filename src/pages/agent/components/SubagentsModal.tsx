import React, { useState } from 'react';
import { X, Users, UserPlus, DollarSign, Copy, Check, MapPin, Calculator, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SubagentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentId: string;
  depositRate: number;
  withdrawRate: number;
  isDark: boolean;
}

export const SubagentsModal: React.FC<SubagentsModalProps> = ({
  isOpen,
  onClose,
  agentId,
  depositRate,
  withdrawRate,
  isDark,
}) => {
  const { t } = useTranslation();
  const [tab, setTab] = useState<'list' | 'add' | 'calculator'>('list');
  const [copiedCode, setCopiedCode] = useState(false);

  // Add form fields (Page 44)
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [country, setCountry] = useState('');
  const [cashDeskName, setCashDeskName] = useState('');
  const [coords, setCoords] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [submitting, setSubmitting] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  // Split calculator state (Page 48)
  const [calcVolume, setCalcVolume] = useState('1000');
  const [masterSharePercent, setMasterSharePercent] = useState('20'); // 20% (1/5)

  if (!isOpen) return null;

  const referralCode = `MC-${agentId.slice(-4) || '7829'}`;

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(
      `انضم كصراف فرعي تحت وكالتي في MobCash: كود الإحالة: ${referralCode}\nرابط التسجيل: https://mobcash.app/register?ref=${referralCode}`
    );
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await new Promise((res) => setTimeout(res, 900));
      setAddSuccess(true);
    } catch (e) {
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  const dummySubagents = [
    {
      id: 'sub_1',
      name: 'أحمد محمود',
      desk: 'Desk-Central',
      city: 'الرياض',
      volume: 8450,
      commissionShare: 169,
      status: 'active',
      date: '12.01.2026',
    },
    {
      id: 'sub_2',
      name: 'كريم التميمي',
      desk: 'Desk-North',
      city: 'جدة',
      volume: 5200,
      commissionShare: 104,
      status: 'active',
      date: '28.01.2026',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border transition-all ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-white'
            : 'bg-white border-slate-100 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-blue-500/10 flex items-center justify-center text-[#3B66F5]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">
                {t('subagents_title', 'إدارة الصرافين التابعين')} (Sub-Agents)
              </h3>
              <p className="text-xs text-slate-400">
                {t('subagents_subtitle', 'توسيع شبكتك وجني العمولات من عمليات الصرافين')}
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

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-1.5 gap-1 text-xs font-bold">
          <button
            onClick={() => setTab('list')}
            className={`flex-1 py-2 rounded-xl transition-all ${
              tab === 'list'
                ? 'bg-white dark:bg-slate-800 text-[#3B66F5] shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            شبكة الصرافين ({dummySubagents.length})
          </button>
          <button
            onClick={() => setTab('add')}
            className={`flex-1 py-2 rounded-xl transition-all ${
              tab === 'add'
                ? 'bg-white dark:bg-slate-800 text-[#3B66F5] shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            + إضافة صراف جديد ($50)
          </button>
          <button
            onClick={() => setTab('calculator')}
            className={`flex-1 py-2 rounded-xl transition-all ${
              tab === 'calculator'
                ? 'bg-white dark:bg-slate-800 text-[#3B66F5] shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            حاسبة تقسيم الأرباح
          </button>
        </div>

        {/* Body */}
        <div className="p-5 max-h-[75vh] overflow-y-auto">
          {tab === 'list' && (
            <div className="space-y-4">
              {/* Referral Code Box */}
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between ${
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-blue-50/50 border-blue-100'
                }`}
              >
                <div>
                  <span className="text-[11px] font-bold text-slate-400 block uppercase">
                    كود الإحالة الخاص بك لجذب الصرافين:
                  </span>
                  <span className="font-mono font-black text-lg text-[#3B66F5]">
                    {referralCode}
                  </span>
                </div>
                <button
                  onClick={handleCopyReferral}
                  className="px-3.5 py-2 rounded-xl bg-[#3B66F5] hover:bg-[#2F54DB] text-white text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'تم النسخ' : 'نسخ الرابط'}</span>
                </button>
              </div>

              {/* Subagents List */}
              <div className="space-y-2.5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  الصرافين النشطين تحت حسابك:
                </span>
                {dummySubagents.map((sub) => (
                  <div
                    key={sub.id}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                      isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{sub.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-bold">
                          {sub.desk}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" /> {sub.city} &bull; انضم: {sub.date}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-bold text-sm block">
                        ${sub.volume.toLocaleString()}
                      </span>
                      <span className="text-[11px] font-bold text-emerald-500">
                        ربحك: +${sub.commissionShare}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-500 text-center">
                * يتم إيداع أرباح الصرافين التابعين تلقائياً في حسابك يوم 3 من كل شهر.
              </div>
            </div>
          )}

          {tab === 'add' && (
            <div>
              {!addSuccess ? (
                <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs">
                    <strong>شروط فتح حساب صراف فرعي (حسب الدليل الرسمي):</strong>
                    <ul className="list-disc pr-4 mt-1 space-y-0.5 text-[11px]">
                      <li>رسوم تفعيل $50 (تظهر لاحقاً في حساب Web Management الخاص بك).</li>
                      <li>تحديد موقع جغرافي دقيق (نطاق عمل 5 كم).</li>
                      <li>إرفاق صورة الهوية وصورة سيلفي مع الهوية.</li>
                    </ul>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-400 block mb-1">الاسم الكامل (Full Name):</label>
                      <input
                        type="text"
                        required
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className={`w-full p-2.5 rounded-xl border ${
                          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-400 block mb-1">رقم التواصل (Contact):</label>
                      <input
                        type="text"
                        required
                        placeholder="+96650..."
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className={`w-full p-2.5 rounded-xl border ${
                          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-400 block mb-1">الدولة والمنطقة (Country & Region):</label>
                      <input
                        type="text"
                        required
                        placeholder="المملكة العربية السعودية"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className={`w-full p-2.5 rounded-xl border ${
                          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-400 block mb-1">المدينة (City):</label>
                      <input
                        type="text"
                        required
                        placeholder="الرياض"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className={`w-full p-2.5 rounded-xl border ${
                          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                        }`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-400 block mb-1">اسم نقطة الصرف (Cash Desk):</label>
                      <input
                        type="text"
                        required
                        placeholder="Al-Amal Cash Desk"
                        value={cashDeskName}
                        onChange={(e) => setCashDeskName(e.target.value)}
                        className={`w-full p-2.5 rounded-xl border ${
                          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-400 block mb-1">إحداثيات GPS (5km radius):</label>
                      <input
                        type="text"
                        placeholder="32.533556, 3.435674"
                        value={coords}
                        onChange={(e) => setCoords(e.target.value)}
                        className={`w-full p-2.5 rounded-xl border font-mono ${
                          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                        }`}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || !fullName || !phone}
                    className="w-full mt-2 py-3 px-4 rounded-2xl bg-[#3B66F5] hover:bg-[#2F54DB] text-white font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? 'جاري إرسال طلب الصراف الفرعي...' : 'إرسال طلب اعتماد الصراف الفرعي ($50)'}
                  </button>
                </form>
              ) : (
                <div className="py-6 text-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="font-bold text-base">تم رفع طلب الصراف الفرعي بنجاح!</h4>
                  <p className="text-xs text-slate-400">
                    سيقوم مدير الحسابات بمراجعة البيانات وتفعيل حساب MobCash الخاص بالصراف الفرعي خلال 24 ساعة.
                  </p>
                  <button
                    onClick={() => {
                      setAddSuccess(false);
                      setTab('list');
                    }}
                    className="px-6 py-2.5 rounded-xl bg-slate-800 text-white text-xs font-bold"
                  >
                    العودة لقائمة الصرافين
                  </button>
                </div>
              )}
            </div>
          )}

          {tab === 'calculator' && (
            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-500">
                <strong>حساب تقسيم العمولات (صفحة 48 من الدليل):</strong>
                <p className="text-[11px] mt-1 text-slate-400">
                  بصفتك الوكيل الرئيسي (Master Agent)، يمكنك أخذ حصة متفق عليها من عمولة الصراف التابع (مثال: 1/5 أو 20%، ويحتفظ الصراف بـ 4/5 أو 80%).
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-400 block mb-1">
                  إجمالي حجم عمليات الصراف الفرعي المتوقع ($):
                </label>
                <input
                  type="number"
                  value={calcVolume}
                  onChange={(e) => setCalcVolume(e.target.value)}
                  className={`w-full p-3 rounded-xl border font-mono font-bold text-sm ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              <div>
                <label className="font-bold text-slate-400 block mb-1">
                  نسبة اقتطاع الوكيل الرئيسي من العمولة (%):
                </label>
                <div className="flex items-center gap-2">
                  {[10, 20, 30, 50].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setMasterSharePercent(pct.toString())}
                      className={`px-3 py-1.5 rounded-xl font-bold font-mono ${
                        masterSharePercent === pct.toString()
                          ? 'bg-[#3B66F5] text-white'
                          : isDark
                          ? 'bg-slate-800 text-slate-300'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Results breakdown */}
              {(() => {
                const vol = parseFloat(calcVolume) || 0;
                const totalComm = (vol * (depositRate || 5)) / 100;
                const masterCut = (totalComm * (parseFloat(masterSharePercent) || 20)) / 100;
                const subCut = totalComm - masterCut;

                return (
                  <div
                    className={`p-4 rounded-2xl border space-y-2 font-mono ${
                      isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex justify-between">
                      <span className="text-slate-400">إجمالي عمولة العمليات:</span>
                      <span className="font-bold">${totalComm.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-500 font-bold">
                      <span>ربحك الصافي كوكيل رئيسي:</span>
                      <span>+${masterCut.toFixed(2)} USD</span>
                    </div>
                    <div className="flex justify-between text-[#3B66F5]">
                      <span>حصة الصراف الفرعي:</span>
                      <span>${subCut.toFixed(2)} USD</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
