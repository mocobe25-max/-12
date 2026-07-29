import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/auth';

export default function Review() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();

  useEffect(() => {
    if (!user) return;

    supabase.from('agents').update({ current_step: 'Under Review' }).eq('id', user.id);

    // Poll every 10 seconds to check status
    const interval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('agents')
          .select('status')
          .eq('id', user.id)
          .single();

        if (!error && data) {
          if (data.status !== user.status) {
            setUser({ ...user, status: data.status }, 'agent');
            if (data.status === 'active') {
              navigate('/agent/dashboard');
            } else if (data.status === 'suspended') {
              navigate('/agent/suspended');
            }
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [user, setUser, navigate]);

  return (
    <div className="max-w-md mx-auto mt-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="w-10 h-10 text-yellow-500 animate-pulse" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('status_under_review')}</h1>
        
        <p className="text-gray-600 mb-8 leading-relaxed">
          {t('review_message')}
        </p>
        
        <div className="inline-flex items-center justify-center px-4 py-2 bg-gray-50 rounded-full border border-gray-200 text-sm text-gray-500 font-medium">
          <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-ping"></div>
          {t('checking_updates')}
        </div>
      </div>
    </div>
  );
}
