import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Wallet, ShieldCheck, Info } from 'lucide-react';
import { useAuthStore } from '../../store/auth';

export default function ActivationInfo() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  if (!user) return null;

  const depositRate = user.commission_deposit !== undefined && user.commission_deposit !== null 
    ? user.commission_deposit 
    : 2;
  const withdrawRate = user.commission_withdraw !== undefined && user.commission_withdraw !== null 
    ? user.commission_withdraw 
    : 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4">
      {/* Page Header */}
      <div className="text-center space-y-2 mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          {t('activation_requirements', 'شروط التفعيل')}
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          {t('review_activation_requirements', 'يرجى مراجعة المتطلبات لتفعيل حساب الوكالة الخاص بك.')}
        </p>
      </div>

      {/* Main White Card Container */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 sm:p-8 space-y-8">
          
          {/* Section 1: Required Activation Capital */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center flex-shrink-0 text-blue-600">
              <Wallet className="w-6 h-6" />
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="text-lg font-bold text-gray-900">
                {t('required_activation_capital', 'رأس مال التفعيل المطلوب')}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {t(
                  'activation_capital_desc',
                  'لتفعيل حسابك والبدء في معالجة المعاملات، يلزم إيداع مبلغ تفعيل أولي. سيتم إضافة هذا المبلغ إلى رصيد وكالتك عند الموافقة.'
                )}
              </p>
              <div className="pt-2">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-gray-100 text-gray-800 font-mono font-medium text-sm">
                  {t('amount', 'المبلغ')}: {user.activation_amount || '500'}$ USD
                </div>
              </div>
            </div>
          </div>

          <div className="w-full h-px bg-gray-100"></div>

          {/* Section 2: Commission Structure */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center flex-shrink-0 text-emerald-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {t('commission_structure', 'هيكل العمولات')}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed mt-1">
                  {t(
                    'commission_structure_desc',
                    'تم تكوين حسابك بمعدلات العمولة التالية لجميع المعاملات المعالجة:'
                  )}
                </p>
              </div>

              {/* Commission Boxes Grid */}
              <div className="grid grid-cols-2 gap-4 pt-1">
                {/* Deposit Box */}
                <div className="bg-gray-50/80 border border-gray-100 rounded-2xl p-4 text-center">
                  <div className="text-xs text-gray-500 font-bold mb-1">
                    {t('deposit', 'إيداع')}
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-gray-900 font-mono">
                    {depositRate}%
                  </div>
                </div>

                {/* Withdrawal Box */}
                <div className="bg-gray-50/80 border border-gray-100 rounded-2xl p-4 text-center">
                  <div className="text-xs text-gray-500 font-bold mb-1">
                    {t('withdrawal', 'سحب')}
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-gray-900 font-mono">
                    {withdrawRate}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Notice */}
          <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4 flex items-start gap-3 text-blue-900">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm leading-relaxed">
              {t(
                'activation_info_notice',
                'لتفعيل حساب الوكالة الخاص بك، يرجى إكمال عملية التفعيل في الصفحة التالية عن طريق تقديم إثبات الدفع الخاص بك.'
              )}
            </p>
          </div>

          {/* Section 4: Action Button */}
          <button
            onClick={() => navigate('/agent/activate')}
            className="w-full py-4 bg-secondary hover:bg-secondary/90 text-white font-extrabold text-base rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-secondary/20"
          >
            <span>{t('proceed_to_activation', 'متابعة التفعيل')}</span>
            <ArrowRight className="w-5 h-5 ltr:rotate-0 rtl:rotate-180" />
          </button>

        </div>
      </div>
    </div>
  );
}


