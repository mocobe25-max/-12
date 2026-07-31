import { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { LogOut, ShieldCheck, UserCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { MobCashLogo } from '../components/MobCashLogo';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

export function AgentLayout() {
  const { user, role, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { i18n, t } = useTranslation();

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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950 font-sans" dir={isRtl ? 'rtl' : 'ltr'}>
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
    </div>
  );
}

