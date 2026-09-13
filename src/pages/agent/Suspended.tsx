import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Mail, RefreshCw } from 'lucide-react';
import { useAuthStore } from '../../store/auth';
import { supabase } from '../../lib/supabase';

export default function Suspended() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();

  useEffect(() => {
    if (user) {
      supabase.from('agents').update({ current_step: 'Suspended' }).eq('id', user.id);
    }

    // Direct listener on Suspended screen for instant unblocking
    const checkStatus = async () => {
      if (!user?.agent_id) return;
      try {
        const { data } = await supabase
          .from('agents')
          .select('status')
          .eq('agent_id', user.agent_id)
          .maybeSingle();

        if (data && data.status && data.status !== 'suspended') {
          updateUser({ status: data.status });
          if (data.status === 'active') {
            navigate('/agent/dashboard', { replace: true });
          } else if (data.status === 'under_review') {
            navigate('/agent/review', { replace: true });
          } else if (data.status === 'verified') {
            navigate('/agent/activate', { replace: true });
          }
        }
      } catch (err) {}
    };

    const interval = setInterval(checkStatus, 1500);

    return () => clearInterval(interval);
  }, [user, navigate, updateUser]);

  return (
    <div className="max-w-md mx-auto mt-12 pb-12">
      <div className="bg-slate-900/90 rounded-3xl shadow-2xl border border-rose-500/30 p-8 text-center relative overflow-hidden">
        <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/30 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
          <AlertTriangle className="w-10 h-10 text-rose-500" />
        </div>
        
        <h1 className="text-2xl font-black text-white mb-2">{t('account_suspended', 'الحساب معلق مؤقتاً')}</h1>
        
        <p className="text-slate-300 mb-6 leading-relaxed text-sm font-medium">
          {t('account_suspended_desc', 'تم تعليق هذا الحساب من قبل إدارة المنصة. يرجى التواصل مع الإدارة للمراجعة وإعادة التفعيل.')}
        </p>

        {/* Live Auto-Checking Indicator */}
        <div className="mb-6 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/80 border border-slate-800 text-[11px] font-semibold text-amber-400">
          <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
          <span>{t('checking_status_live', 'جاري فحص حالة الحساب تلقائياً... سيتم الفتح فور التفعيل')}</span>
        </div>
        
        <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 text-start">
          <h3 className="text-xs font-bold text-amber-400 mb-2 flex items-center gap-2 uppercase tracking-wider">
            <Mail className="w-4 h-4 text-amber-400" />
            {t('contact_support', 'تواصل مع الدعم الفني')}
          </h3>
          <p className="text-xs text-slate-300">
            {t('contact_support_desc_1', 'يرجى إرسال معرف الوكيل ')}
            <span className="font-mono font-bold text-amber-400">{user?.agent_id}</span>
            {t('contact_support_desc_2', ' لمعالجة تفعيل الحساب.')}
          </p>
          <a href="mailto:manager@1xbetagent.shop" className="mt-3 inline-block text-xs font-mono font-bold text-amber-400 hover:underline">
            manager@1xbetagent.shop
          </a>
        </div>
      </div>
    </div>
  );
}
