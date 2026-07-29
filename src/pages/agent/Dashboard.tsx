import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/auth';
import { CheckCircle2, Wallet, ArrowUpRight, ArrowDownLeft, Activity } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function AgentDashboard() {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      supabase.from('agents').update({ current_step: 'Dashboard' }).eq('id', user.id);
    }
  }, [user]);

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('welcome_back')}, {user.full_name}</h1>
          <p className="text-gray-500 mt-1">{t('agent_id')}: <span className="font-mono font-medium text-secondary">{user.agent_id}</span></p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full border border-green-100 font-medium">
          <CheckCircle2 className="w-5 h-5" />
          {t('active')}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium">{t('available_balance')}</h3>
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-secondary">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900">$0.00</div>
            <p className="text-sm text-gray-500 mt-1">USD</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium">{t('deposit_commission')}</h3>
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900">{user.commission_deposit}%</div>
            <p className="text-sm text-gray-500 mt-1">{t('per_transaction')}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-500 font-medium">{t('withdrawal_commission')}</h3>
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900">{user.commission_withdraw}%</div>
            <p className="text-sm text-gray-500 mt-1">{t('per_transaction')}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-secondary" />
            {t('recent_transactions')}
          </h2>
          <button className="text-sm font-medium text-secondary hover:text-primary transition-colors">
            {t('view_all')}
          </button>
        </div>
        <div className="p-8 text-center text-gray-500">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-gray-300" />
          </div>
          <p>{t('no_transactions')}</p>
          <p className="text-sm mt-1">{t('start_processing')}</p>
        </div>
      </div>
    </div>
  );
}
