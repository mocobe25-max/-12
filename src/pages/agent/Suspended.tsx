import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Mail } from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { supabase } from '../../lib/supabase';

export default function Suspended() {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      supabase.from('agents').update({ current_step: 'Suspended' }).eq('id', user.id);
    }
  }, [user]);

  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-8 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-red-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('account_suspended')}</h1>
        
        <p className="text-gray-600 mb-8 leading-relaxed">
          {t('account_suspended_desc')}
        </p>
        
        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-left">
          <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Mail className="w-4 h-4 text-gray-500" />
            {t('contact_support')}
          </h3>
          <p className="text-sm text-gray-600">
            {t('contact_support_desc_1')}<span className="font-mono font-medium">{user?.agent_id}</span>{t('contact_support_desc_2')}
          </p>
          <a href="mailto:manager@1xbetagent.shop" className="mt-4 inline-block text-sm font-medium text-secondary hover:text-primary transition-colors">
            manager@1xbetagent.shop
          </a>
        </div>
      </div>
    </div>
  );
}
