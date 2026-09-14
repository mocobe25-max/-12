import { useEffect, useState, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { LogOut, ShieldCheck, UserCheck, AlertTriangle, CheckCircle2, XCircle, Info, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { MobCashLogo } from '../components/MobCashLogo';
import { supabase } from '../lib/supabase';

interface StatusNotification {
  type: 'active' | 'suspended' | 'deleted' | 'under_review' | 'verified';
  title: string;
  message: string;
}

export function AgentLayout() {
  const { user, role, logout, setUser } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { i18n, t } = useTranslation();

  const [notification, setNotification] = useState<StatusNotification | null>(null);
  const prevStatusRef = useRef<string | null>(user?.status || null);

  // Helper for multi-language status notification text
  const getStatusNotificationText = (newStatus: string): StatusNotification => {
    const lang = (i18n.language || 'ar').split('-')[0];

    switch (newStatus) {
      case 'active':
        if (lang === 'ar') {
          return {
            type: 'active',
            title: 'تم تفعيل حسابك بنجاح!',
            message: 'تهانينا! قامت الإدارة بتفعيل حسابك رسمياً. تم فتح لوحة التحكم وجميع الخدمات والعمليات بالكامل.',
          };
        } else if (lang === 'fr') {
          return {
            type: 'active',
            title: 'Compte activé avec succès !',
            message: 'Félicitations ! Votre compte a été officiellement activé par l\'administration. Toutes les fonctionnalités sont disponibles.',
          };
        } else if (lang === 'ru') {
          return {
            type: 'active',
            title: 'Аккаунт успешно активирован!',
            message: 'Поздравляем! Ваш аккаунт активирован администрацией. Доступ ко всем операциям открыт.',
          };
        } else {
          return {
            type: 'active',
            title: 'Account Activated Successfully!',
            message: 'Congratulations! Your account has been officially activated by administration. Dashboard and all operations are now fully accessible.',
          };
        }

      case 'suspended':
        if (lang === 'ar') {
          return {
            type: 'suspended',
            title: 'تنبيه: تم تعليق حسابك',
            message: 'تم تعليق حساب الوكيل من قبل الإدارة. يرجى التواصل مع الدعم الفني للمراجعة وإعادة التفعيل.',
          };
        } else if (lang === 'fr') {
          return {
            type: 'suspended',
            title: 'Compte suspendu',
            message: 'Votre compte a été suspendu par l\'administration. Veuillez contacter le support pour réactivation.',
          };
        } else if (lang === 'ru') {
          return {
            type: 'suspended',
            title: 'Аккаунт заблокирован',
            message: 'Ваш аккаунт был заблокирован администрацией. Пожалуйста, обратитесь в службу поддержки.',
          };
        } else {
          return {
            type: 'suspended',
            title: 'Notice: Account Suspended',
            message: 'Your agent account has been suspended by administration. Please contact live support for assistance.',
          };
        }

      case 'deleted':
        if (lang === 'ar') {
          return {
            type: 'deleted',
            title: 'تم إيقاف وحذف الحساب',
            message: 'تم إلغاء وحذف حسابك من قبل إدارة النظام. سيتم تسجيل الخروج فوراً.',
          };
        } else if (lang === 'fr') {
          return {
            type: 'deleted',
            title: 'Compte supprimé',
            message: 'Votre compte a été désactivé et supprimé par l\'administration.',
          };
        } else if (lang === 'ru') {
          return {
            type: 'deleted',
            title: 'Аккаунт удален',
            message: 'Ваш аккаунт был удален администрацией системы.',
          };
        } else {
          return {
            type: 'deleted',
            title: 'Account Deactivated/Removed',
            message: 'Your account has been deleted by system administration. You will be logged out immediately.',
          };
        }

      case 'under_review':
        if (lang === 'ar') {
          return {
            type: 'under_review',
            title: 'حسابك قيد المراجعة',
            message: 'تم تحويل حالة الحساب إلى قيد المراجعة والتدقيق لدى الإدارة.',
          };
        } else {
          return {
            type: 'under_review',
            title: 'Account Under Review',
            message: 'Your account status has been set to under review by administration.',
          };
        }

      case 'verified':
        if (lang === 'ar') {
          return {
            type: 'verified',
            title: 'تم تأكيد التحقق من الحساب',
            message: 'يرجى إتمام عملية الإيداع والتفعيل لبدء استخدام النظام.',
          };
        } else {
          return {
            type: 'verified',
            title: 'Account Verified',
            message: 'Please complete the deposit to finish activating your account.',
          };
        }

      default:
        return {
          type: 'active',
          title: 'تحديث الحالة',
          message: `تم تحديث حالة حسابك إلى: ${newStatus}`,
        };
    }
  };

  // Real-time synchronization for agent status changes
  useEffect(() => {
    if (!user || role !== 'agent') return;

    const handleNewStatus = (newStatus: string, updatedRecord?: any) => {
      if (!newStatus) return;

      const currentAuthUser = useAuthStore.getState().user;
      if (!currentAuthUser) return;
      const currentStatus = currentAuthUser?.status;
      const currentPath = window.location.pathname;

      const isAlreadyOnCorrectPath =
        (newStatus === 'active' && (currentPath === '/agent/dashboard' || currentPath === '/agent/device-activation')) ||
        (newStatus === 'suspended' && currentPath === '/agent/suspended') ||
        (newStatus === 'under_review' && currentPath === '/agent/review') ||
        (newStatus === 'verified' && currentPath === '/agent/activate') ||
        (newStatus === 'pending' && currentPath === '/agent/verify');

      // If status matches and user is already on the exact right screen, skip duplicate notification
      if (currentStatus === newStatus && isAlreadyOnCorrectPath && prevStatusRef.current === newStatus) {
        return;
      }

      const notif = getStatusNotificationText(newStatus);
      setNotification(notif);
      prevStatusRef.current = newStatus;

      if (newStatus === 'deleted') {
        setTimeout(() => {
          logout();
          navigate('/agent/login', { replace: true });
        }, 2500);
        return;
      }

      // Update auth store immediately
      const updatedUser = {
        ...currentAuthUser,
        ...(updatedRecord || {}),
        status: newStatus,
      };
      setUser(updatedUser, 'agent');

      // Update local storage registered agents
      try {
        const localAgents = JSON.parse(localStorage.getItem('local_registered_agents') || '[]');
        const idx = localAgents.findIndex((a: any) => a.agent_id === user.agent_id);
        if (idx >= 0) {
          localAgents[idx] = { ...localAgents[idx], ...(updatedRecord || {}), status: newStatus };
          localStorage.setItem('local_registered_agents', JSON.stringify(localAgents));
        }
      } catch (err) {
        console.warn('Storage sync err:', err);
      }

      // Route immediately based on new status
      if (newStatus === 'active') {
        if (currentPath !== '/agent/dashboard' && currentPath !== '/agent/device-activation') {
          navigate('/agent/dashboard', { replace: true });
        }
      } else if (newStatus === 'suspended') {
        if (currentPath !== '/agent/suspended') {
          navigate('/agent/suspended', { replace: true });
        }
      } else if (newStatus === 'under_review') {
        if (currentPath !== '/agent/review') {
          navigate('/agent/review', { replace: true });
        }
      } else if (newStatus === 'verified') {
        if (currentPath !== '/agent/activate') {
          navigate('/agent/activate', { replace: true });
        }
      } else if (newStatus === 'pending') {
        if (currentPath !== '/agent/verify') {
          navigate('/agent/verify', { replace: true });
        }
      }
    };

    // 1. BroadcastChannel listener (instant cross-tab communication)
    let bc: BroadcastChannel | null = null;
    let profileBc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('agent_status_channel');
      bc.onmessage = (event) => {
        if (event.data && event.data.agent_id === user.agent_id) {
          handleNewStatus(event.data.status, event.data.record);
        }
      };
      
      profileBc = new BroadcastChannel('agent_profile_update');
      profileBc.onmessage = (event) => {
        if (event.data && event.data.agent_id === user.agent_id) {
           useAuthStore.getState().updateUser(event.data);
        }
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported:', e);
    }

    // 2. Storage event listener (syncs across browser tabs/windows)
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'mobcash_agent_status_broadcast' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed.agent_id === user.agent_id) {
            handleNewStatus(parsed.status, parsed.record);
          }
        } catch (err) {}
      }
    };
    window.addEventListener('storage', onStorage);

    // 3. Supabase Realtime subscription on `agents` table
    const subChannel = supabase
      .channel(`agent_status_realtime_${user.agent_id}_${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agents',
          filter: `agent_id=eq.${user.agent_id}`,
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            handleNewStatus('deleted');
          } else if (payload.new && payload.new.status) {
            handleNewStatus(payload.new.status, payload.new);
          }
        }
      )
      .subscribe();

    // 4. Heartbeat check every 1.5 seconds (fast polling guarantee)
    const interval = setInterval(async () => {
      try {
        // Check Supabase first
        const { data, error } = await supabase
          .from('agents')
          .select('*')
          .eq('agent_id', user.agent_id)
          .maybeSingle();

        if (!error && data && data.status) {
          if (data.status !== useAuthStore.getState().user?.status) {
            handleNewStatus(data.status, data);
          }
          return;
        }

        // Check local storage fallback
        const local = JSON.parse(localStorage.getItem('local_registered_agents') || '[]');
        const found = local.find((a: any) => a.agent_id === user.agent_id);
        if (found && found.status && found.status !== useAuthStore.getState().user?.status) {
          handleNewStatus(found.status, found);
        }
      } catch (err) {
        // quiet error
      }
    }, 1500);

    return () => {
      if (bc) bc.close();
      window.removeEventListener('storage', onStorage);
      subChannel.unsubscribe();
      clearInterval(interval);
    };
  }, [user?.agent_id, role]); // Removed user?.status to prevent constant interval resetting when status changes

  // Standard route protection based on current status
  useEffect(() => {
    if (!user || role !== 'agent') {
      navigate('/agent/login');
      return;
    }

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
  }, [user?.status, role, navigate, location.pathname]);

  if (!user || role !== 'agent') return null;

  const isRtl = ['ar', 'ur', 'fa'].includes(i18n.language?.split('-')[0] || 'en');
  const isDashboard = location.pathname === '/agent/dashboard';

  return (
    <div className="relative font-sans" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Real-time Status Alert Modal / Toast */}
      {notification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
          <div
            className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border text-center relative overflow-hidden ${
              notification.type === 'active'
                ? 'bg-slate-900 border-emerald-500/40 text-white'
                : notification.type === 'suspended'
                ? 'bg-slate-900 border-rose-500/40 text-white'
                : 'bg-slate-900 border-amber-500/40 text-white'
            }`}
          >
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg ${
                notification.type === 'active'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : notification.type === 'suspended'
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              }`}
            >
              {notification.type === 'active' ? (
                <CheckCircle2 className="w-8 h-8" />
              ) : notification.type === 'suspended' ? (
                <AlertTriangle className="w-8 h-8" />
              ) : (
                <Info className="w-8 h-8" />
              )}
            </div>

            <h3 className="text-xl font-black mb-2 tracking-tight">{notification.title}</h3>
            <p className="text-sm text-slate-300 mb-6 leading-relaxed font-medium">
              {notification.message}
            </p>

            <button
              onClick={() => setNotification(null)}
              className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm transition-all cursor-pointer shadow-lg ${
                notification.type === 'active'
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black'
                  : notification.type === 'suspended'
                  ? 'bg-rose-500 hover:bg-rose-600 text-white'
                  : 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-black'
              }`}
            >
              {t('understood', 'موافق / إغلاق')}
            </button>
          </div>
        </div>
      )}

      {isDashboard ? (
        <Outlet />
      ) : (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950">
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
                  <strong className="font-mono text-amber-400 font-extrabold tracking-wider">
                    {user.agent_id}
                  </strong>
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

          {/* Main Content View */}
          <main className="flex-1 w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>

          {/* Modern Footer */}
          <footer className="border-t border-slate-800/60 py-4 text-center text-xs text-slate-500 font-medium">
            MobCash Partner Portal &copy; {new Date().getFullYear()} &bull; جميع الحقوق محفوظة
          </footer>
        </div>
      )}
    </div>
  );
}

