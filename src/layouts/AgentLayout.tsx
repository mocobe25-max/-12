import { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { LogOut, UserCheck, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { MobCashLogo } from '../components/MobCashLogo';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { supabase } from '../lib/supabase';

export function AgentLayout() {
  const { user, role, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { i18n, t } = useTranslation();
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'warning' | 'error' } | null>(null);

  useEffect(() => {
    if (!user || role !== 'agent') {
      navigate('/agent/login');
      return;
    }

    // Function to handle status update & show notification in current language
    const handleStatusUpdate = (newStatus: string, updatedRecord?: any) => {
      const currentLang = (i18n.language || 'ar').split('-')[0].toLowerCase();

      if (newStatus === 'suspended' && user.status !== 'suspended') {
        const msgs: Record<string, string> = {
          ar: '⚠️ تم تعليق حسابك من قبل الإدارة. يرجى التواصل مع الدعم الفني.',
          en: '⚠️ Your account has been suspended by administration. Please contact support.',
          fr: "⚠️ Votre compte a été suspendu par l'administration. Veuillez contacter le support.",
          ru: '⚠️ Ваш аккаунт был приостановлен администрацией. Свяжитесь с поддержкой.'
        };
        const msg = msgs[currentLang] || msgs.ar;
        setNotification({ message: msg, type: 'warning' });
        
        useAuthStore.getState().setUser({ ...user, ...updatedRecord, status: 'suspended' }, 'agent');
        navigate('/agent/suspended');
      } else if (newStatus === 'active' && user.status !== 'active') {
        const msgs: Record<string, string> = {
          ar: '🎉 تم تفعيل حسابك بنجاح!',
          en: '🎉 Your account has been activated successfully!',
          fr: '🎉 Votre compte a été activé avec succès !',
          ru: '🎉 Ваш аккаунт успешно активирован!'
        };
        const msg = msgs[currentLang] || msgs.ar;
        setNotification({ message: msg, type: 'success' });
        
        useAuthStore.getState().setUser({ ...user, ...updatedRecord, status: 'active' }, 'agent');
        navigate('/agent/dashboard');
      } else if ((newStatus === 'inactive' || newStatus === 'deleted') && user.status !== 'inactive') {
        const msgs: Record<string, string> = {
          ar: '❌ تم إلغاء تفعيل حسابك أو حذفه من قبل الإدارة.',
          en: '❌ Your account has been deactivated or deleted by administration.',
          fr: "❌ Votre compte a été désactivé ou supprimé par l'administration.",
          ru: '❌ Ваш аккаунт деактивирован или удален администрацией.'
        };
        const msg = msgs[currentLang] || msgs.ar;
        alert(msg);
        logout();
        navigate('/agent/login');
      } else if (updatedRecord) {
        // Sync balance or other info
        useAuthStore.getState().setUser({ ...user, ...updatedRecord }, 'agent');
      }
    };

    // Polling & Real-time fetch function
    const checkAgentStatus = async () => {
      try {
        const deviceStorageKey = `mobcash_device_id_${user.agent_id}`;
        const deviceId = localStorage.getItem(deviceStorageKey) || localStorage.getItem('mobcash_device_id') || '';

        const isLocalDeviceActive = deviceId ? localStorage.getItem(`device_active_${user.agent_id}_${deviceId}`) === 'true' : false;
        const isLocalAgentActive = localStorage.getItem(`agent_active_${user.agent_id}`) === 'true';

        let targetStatus = user.status;
        let updatedData: any = null;

        try {
          const { data } = await supabase
            .from('agents')
            .select('*')
            .eq('agent_id', user.agent_id)
            .maybeSingle();

          if (data) {
            updatedData = data;
            targetStatus = data.status;
          }
        } catch (err) {
          // ignore fetch error
        }

        // Check local registered agents list
        try {
          const localAgents = JSON.parse(localStorage.getItem('local_registered_agents') || '[]');
          const localMatch = localAgents.find((a: any) => a.agent_id === user.agent_id);
          if (localMatch && localMatch.status === 'active') {
            targetStatus = 'active';
            if (!updatedData) updatedData = localMatch;
          }
        } catch(e) {}

        // If device or agent is active locally, prioritize active status
        if (isLocalDeviceActive || isLocalAgentActive) {
          targetStatus = 'active';
        }

        if (targetStatus && targetStatus !== user.status) {
          handleStatusUpdate(targetStatus, updatedData);
        } else if (updatedData && (updatedData.balance !== user.balance || updatedData.currency !== user.currency)) {
          useAuthStore.getState().setUser({ ...user, ...updatedData }, 'agent');
        }
      } catch (err) {
        // ignore fetch error
      }
    };

    // Initial check
    checkAgentStatus();

    // Set polling interval every 3 seconds for fast status detection
    const interval = setInterval(checkAgentStatus, 3000);

    // Set up Supabase Realtime subscription on agents table
    const channel = supabase
      .channel(`agent_layout_status_${user.agent_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agents',
          filter: `agent_id=eq.${user.agent_id}`
        },
        (payload: any) => {
          if (payload.eventType === 'DELETE') {
            handleStatusUpdate('deleted');
          } else if (payload.new) {
            handleStatusUpdate(payload.new.status, payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [user?.agent_id, user?.status, i18n.language, navigate, logout]);

  useEffect(() => {
    if (!user || role !== 'agent') {
      navigate('/agent/login');
      return;
    }

    // Routing logic based on status
    const status = user.status;
    const path = location.pathname;

    if (status === 'pending' && path !== '/agent/verify') {
      navigate('/agent/verify');
    } else if (status === 'verified' && path !== '/agent/activate') {
      navigate('/agent/activate');
    } else if (status === 'under_review' && path !== '/agent/review') {
      navigate('/agent/review');
    } else if (status === 'active' && path !== '/agent/dashboard' && path !== '/agent/device-activation') {
      navigate('/agent/dashboard');
    } else if (status === 'suspended' && path !== '/agent/suspended') {
      navigate('/agent/suspended');
    }
  }, [user, role, navigate, location.pathname]);

  if (!user || role !== 'agent') return null;

  const isRtl = ['ar', 'ur', 'fa'].includes(i18n.language?.split('-')[0] || 'en');
  const isDashboard = location.pathname === '/agent/dashboard';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950 font-sans relative" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Real-time Toast Notification Banner */}
      {notification && (
        <div className="fixed top-4 inset-x-4 max-w-md mx-auto z-50 animate-in fade-in slide-in-from-top duration-300">
          <div className={`p-4 rounded-2xl shadow-2xl border flex items-start justify-between gap-3 ${
            notification.type === 'warning'
              ? 'bg-rose-950 border-rose-500/50 text-rose-100'
              : notification.type === 'success'
              ? 'bg-emerald-950 border-emerald-500/50 text-emerald-100'
              : 'bg-slate-900 border-slate-700 text-slate-100'
          }`}>
            <div className="flex items-center gap-3">
              {notification.type === 'warning' && <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0" />}
              {notification.type === 'success' && <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />}
              {notification.type === 'error' && <XCircle className="w-6 h-6 text-red-400 shrink-0" />}
              <p className="text-sm font-semibold leading-relaxed">{notification.message}</p>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-xs opacity-70 hover:opacity-100 font-bold px-2 py-1 rounded bg-black/20"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {isDashboard ? (
        <Outlet />
      ) : (
        <>
          {/* Top Header with MobCash Logo, Agent ID, and Logout */}
          <header className="bg-slate-900/95 border-b border-slate-800/80 backdrop-blur-xl sticky top-0 z-40 shadow-xl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
              {/* Logo Only */}
              <div className="flex items-center gap-3 shrink-0">
                <MobCashLogo className="w-9 h-9 sm:w-11 sm:h-11 shadow-lg rounded-xl ring-2 ring-amber-500/20" />
              </div>
              
              {/* Right Controls: ID & Logout */}
              <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                {/* Agent ID */}
                <div className="px-3 py-1.5 bg-slate-800/90 border border-slate-700/80 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 text-slate-200 shadow-inner">
                  <UserCheck className="w-4 h-4 text-amber-400" />
                  <span className="opacity-75 hidden sm:inline">{t('agent_id')}:</span>
                  <strong className="font-mono text-amber-400 font-extrabold tracking-wider">{user.agent_id}</strong>
                </div>

                {/* Logout Icon Button */}
                <button
                  onClick={() => {
                    logout();
                    navigate('/agent/login');
                  }}
                  className="flex items-center gap-1.5 text-slate-300 hover:text-white bg-slate-800/90 hover:bg-slate-700/90 px-3 py-2 rounded-xl transition-all text-xs font-bold cursor-pointer border border-slate-700 shadow-sm hover:border-slate-600"
                  title={t('logout')}
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span className="hidden md:inline">{t('logout')}</span>
                </button>
              </div>
            </div>
          </header>

          {/* Main Content View (No steps bar) */}
          <main className="flex-1 w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>

          {/* Modern Footer */}
          <footer className="border-t border-slate-800/60 py-4 text-center text-xs text-slate-500 font-medium">
            MobCash Partner Portal &copy; {new Date().getFullYear()} &bull; جميع الحقوق محفوظة
          </footer>
        </>
      )}
    </div>
  );
}

