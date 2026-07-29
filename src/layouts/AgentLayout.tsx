import { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { Shield, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';

export function AgentLayout() {
  const { user, role, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();

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
    } else if (status === 'verified' && path !== '/agent/activation-info' && path !== '/agent/activate') {
      navigate('/agent/activation-info');
    } else if (status === 'under_review' && path !== '/agent/review') {
      navigate('/agent/review');
    } else if (status === 'active' && path !== '/agent/dashboard') {
      navigate('/agent/dashboard');
    } else if (status === 'suspended' && path !== '/agent/suspended') {
      navigate('/agent/suspended');
    }
  }, [user, role, navigate, location.pathname]);

  if (!user || role !== 'agent') return null;

  const steps = [
    { id: 'pending', label: t('verify_info'), index: 1 },
    { id: 'verified', label: t('activation'), index: 2 },
    { id: 'under_review', label: t('review'), index: 3 },
    { id: 'active', label: t('active'), index: 4 },
  ];

  const currentStepIndex = steps.find(s => s.id === user.status)?.index || 1;

  const isRtl = ['ar', 'ur', 'fa'].includes(i18n.language?.split('-')[0] || 'en');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Topbar */}
      <header className="bg-primary text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-secondary" />
            <span className="text-xl font-bold tracking-wider">TemCash 1x</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-sm text-white/70">
              ID: <span className="font-mono text-white">{user.agent_id}</span>
            </div>
            <button
              onClick={() => {
                logout();
                navigate('/agent/login');
              }}
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden sm:inline">{t('logout')}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Progress Bar (only show if not suspended) */}
      {user.status !== 'suspended' && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 rounded-full z-0"></div>
              <div 
                className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-secondary rounded-full z-0 transition-all duration-500"
                style={{ width: `${((currentStepIndex - 1) / 3) * 100}%` }}
              ></div>
              
              {steps.map((step) => {
                const isCompleted = currentStepIndex > step.index;
                const isCurrent = currentStepIndex === step.index;
                
                return (
                  <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors",
                      isCompleted ? "bg-secondary text-white" : 
                      isCurrent ? "bg-secondary text-white ring-4 ring-secondary/20" : 
                      "bg-gray-200 text-gray-500"
                    )}>
                      {step.index}
                    </div>
                    <span className={cn(
                      "text-xs font-medium absolute -bottom-6 w-24 text-center",
                      isCurrent ? "text-primary" : "text-gray-500"
                    )}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 mt-6">
        <Outlet />
      </main>
    </div>
  );
}
