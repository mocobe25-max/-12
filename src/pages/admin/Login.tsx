import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Lock, User, ShieldAlert, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/auth';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { MobCashLogo } from '../../components/MobCashLogo';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(true);

  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { user, role, setUser } = useAuthStore();

  React.useEffect(() => {
    if (user && role === 'admin') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [user, role, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('username', username)
        .single();

      if (error || !data) {
        throw new Error(t('invalid_credentials'));
      }

      if (data.password_hash !== password) {
        throw new Error(t('invalid_credentials'));
      }

      setUser(data, 'admin');
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || t('login_failed'));
    } finally {
      setLoading(false);
    }
  };

  const isRtl = i18n.language === 'ar';

  return (
    <div
      className="min-h-screen bg-[#0B0E14] text-white flex flex-col justify-between items-center px-6 py-10 relative overflow-hidden font-sans select-none"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Branding Section */}
      <div className="flex-1 flex flex-col justify-center items-center text-center z-10 my-auto">
        <MobCashLogo className="w-28 h-28 mb-4 transition-transform hover:scale-105 duration-300" />

        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-2">
          MobCash
        </h1>

        <p className="text-gray-300/90 text-lg sm:text-xl font-medium tracking-wide">
          {t('management_system', 'Management System')}
        </p>
      </div>

      {/* Bottom Actions Section */}
      <div className="w-full max-w-sm flex flex-col items-center z-10 mt-auto pb-4">
        

        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="w-full bg-[#4E71FF] hover:bg-[#3D62EF] active:bg-[#3153DC] text-white font-bold py-4 px-6 rounded-2xl text-lg sm:text-xl shadow-lg shadow-blue-600/25 transition-all duration-200 cursor-pointer active:scale-[0.98] flex items-center justify-center mb-3"
        >
          {t('admin_login_title', 'Admin Login')}
        </button>

        <button
          type="button"
          onClick={() => navigate('/agent/login')}
          className="w-full bg-[#131926] hover:bg-[#1A2234] border border-[#252E42] text-[#4E71FF] hover:text-white font-bold py-4 px-6 rounded-2xl text-lg sm:text-xl hover:border-[#4E71FF] transition-all duration-200 cursor-pointer active:scale-[0.98] flex items-center justify-center mb-6"
        >
          {t('go_to_agent_login', 'Go to Agent Portal')}
        </button>

        <LanguageSwitcher variant="dark" />
      </div>

      {/* ADMIN LOGIN MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="bg-[#121722] border border-[#232B3E] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-white animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#232B3E]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-600/20 rounded-xl text-[#4E71FF]">
                  <MobCashLogo className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {t('admin_login_title', 'Admin Login')}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {t('login_to_continue', 'Sign in to access your dashboard')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-[#1C2434] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-5 bg-red-950/40 border border-red-800/60 p-4 rounded-2xl flex items-center gap-3 text-red-300 text-sm">
                <ShieldAlert className="w-5 h-5 shrink-0 text-red-400" />
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-2">
                  {t('username', 'Username')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 start-0 start-3 flex items-center pointer-events-none text-gray-400">
                    <User className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="admin"
                    className="w-full bg-[#182030] border border-[#2B364E] focus:border-[#4E71FF] focus:ring-1 focus:ring-[#4E71FF] text-white text-base rounded-2xl py-3.5 ps-11 pe-4 outline-none transition-all placeholder:text-gray-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-2">
                  {t('password', 'Password')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 start-0 start-3 flex items-center pointer-events-none text-gray-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#182030] border border-[#2B364E] focus:border-[#4E71FF] focus:ring-1 focus:ring-[#4E71FF] text-white text-base rounded-2xl py-3.5 ps-11 pe-4 outline-none transition-all placeholder:text-gray-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#4E71FF] hover:bg-[#3D62EF] active:bg-[#3153DC] disabled:opacity-50 text-white font-bold py-4 rounded-2xl text-lg shadow-lg shadow-blue-600/30 transition-all cursor-pointer active:scale-[0.98] flex items-center justify-center mt-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t('loading', 'Loading...')}
                  </span>
                ) : (
                  t('login', 'Log in')
                )}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => navigate('/agent/login')}
                  className="text-sm font-semibold text-[#4E71FF] hover:underline"
                >
                  {t('go_to_agent_login', 'Go to Agent Login')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
