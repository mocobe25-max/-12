import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Info, ShieldCheck, Wallet } from 'lucide-react';
import { useAuthStore } from '../../store/auth';

export default function ActivationInfo() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t('activation_requirements')}</h1>
        <p className="text-gray-600 mt-2">{t('review_activation_requirements')}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 sm:p-8 space-y-8">
          
          {/* Capital Requirement */}
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Wallet className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">{t('required_activation_capital')}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {t('activation_capital_desc')}
              </p>
              <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-800 font-mono font-medium text-sm">
                {t('amount')}: ${user.activation_amount || '500.00'} USD
              </div>
            </div>
          </div>

          <div className="w-full h-px bg-gray-100"></div>

          {/* Commission Structure */}
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">{t('commission_structure')}</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-3">
                {t('commission_structure_desc')}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                  <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-semibold">{t('deposit')}</div>
                  <div className="text-lg font-bold text-gray-900">{user.commission_deposit}%</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                  <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-semibold">{t('withdrawal')}</div>
                  <div className="text-lg font-bold text-gray-900">{user.commission_withdraw}%</div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-blue-800">
              {t('activation_info_notice')}
            </p>
          </div>

          <button
            onClick={() => navigate('/agent/activate')}
            className="w-full py-4 bg-secondary text-white font-medium rounded-xl hover:bg-secondary/90 transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            {t('proceed_to_activation')}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
