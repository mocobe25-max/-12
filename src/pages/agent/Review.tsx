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
    <div className="max-w-md mx-auto mt-12 pb-12">
      <div className="bg-slate-900/90 rounded-3xl shadow-2xl border border-slate-800 p-8 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
          <Clock className="w-10 h-10 text-amber-400 animate-pulse" />
        </div>
        
        <h1 className="text-2xl font-black text-white mb-3">{t('status_under_review', 'الطلب قيد المراجعة والتدقيق')}</h1>
        
        <p className="text-slate-300 mb-8 text-sm leading-relaxed font-medium">
          {t('review_message', 'تم استلام إثبات الدفع والبيانات بنجاح. يتم الآن التحقق بواسطة إدارة المنظمة وتفعيل حسابك فور الانتهاء.')}
        </p>
        
        <div className="inline-flex items-center justify-center px-4 py-2 bg-slate-950 rounded-full border border-slate-800 text-xs text-amber-400 font-bold tracking-wider">
          <div className="w-2 h-2 bg-amber-400 rounded-full ms-2 me-2 animate-ping"></div>
          {t('checking_updates', 'جاري التحديث التلقائي للحالة...')}
        </div>
      </div>
    </div>
  );
}
