import { useEffect, useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { Shield, Users, PlusCircle, LogOut, LayoutDashboard, Menu, X, MonitorSmartphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { MobCashLogo } from '../components/MobCashLogo';

export function AdminLayout() {
  const { user, role, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!user || role !== 'admin') {
      navigate('/admin/login');
    }
  }, [user, role, navigate]);

  if (!user || role !== 'admin') return null;

  const navItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: t('dashboard') },
    { path: '/admin/create-agent', icon: PlusCircle, label: t('create_agent') },
    { path: '/admin/manage-agents', icon: Users, label: t('manage_agents') },
    { path: '/admin/device-activation', icon: MonitorSmartphone, label: t('device_activation', 'تفعيل الأجهزة') },
  ];

  const isRtl = ['ar', 'ur', 'fa'].includes(i18n.language?.split('-')[0] || 'en');

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 start-0 end-0 h-16 bg-primary text-white flex items-center justify-between px-4 z-30">
        <div className="flex items-center gap-3">
          <MobCashLogo className="w-8 h-8" />
          <span className="text-lg font-bold tracking-wider">MobCash</span>
        </div>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 -me-2">
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 start-0 z-20 w-64 bg-primary text-white flex flex-col transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
        isMobileMenuOpen ? "translate-x-0" : "rtl:translate-x-full ltr:-translate-x-full"
      )}>
        <div className="p-6 hidden lg:flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <MobCashLogo className="w-10 h-10" />
            <span className="text-xl font-bold tracking-wider">MobCash</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 mt-16 lg:mt-0 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setIsMobileMenuOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-start",
                  isActive 
                    ? "bg-secondary text-white font-medium" 
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 space-y-4">
          <div className="hidden lg:block">
            <LanguageSwitcher />
          </div>
          <button
            onClick={() => {
              logout();
              navigate('/admin/login');
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:bg-white/5 hover:text-white transition-colors text-start"
          >
            <LogOut className="w-5 h-5" />
            {t('logout')}
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-10 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto pt-16 lg:pt-0 w-full">
        <div className="p-4 sm:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
