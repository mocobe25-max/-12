import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Smartphone, LogOut, Copy, CheckCheck, ShieldCheck, Cpu, Globe, Monitor, Clock, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/auth';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { sendTelegramNotification } from '../../lib/telegram';
import { getDeviceFingerprint, generateDeviceActivationCode, DeviceInfo } from '../../lib/deviceFingerprint';

export default function DeviceActivation() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [activationCode, setActivationCode] = useState('');
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  useEffect(() => {
    if (!user) {
      navigate('/agent/login');
      return;
    }

    let isMounted = true;
    let channel: BroadcastChannel | null = null;

    const initializeDevice = async () => {
      try {
        setLoading(true);
        // Compute deterministic, real hardware fingerprint
        const fp = await getDeviceFingerprint(user.agent_id);
        if (!isMounted) return;
        setDeviceInfo(fp);

        localStorage.setItem('mobcash_device_id', fp.deviceId);

        // Check if this device is already recorded in Supabase
        let existingDevice: any = null;
        try {
          const { data } = await supabase
            .from('agent_devices')
            .select('*')
            .eq('agent_id', user.agent_id)
            .eq('device_id', fp.deviceId)
            .maybeSingle();
          if (data) existingDevice = data;
        } catch (err) {
          console.warn('Supabase agent_devices fetch note:', err);
        }

        // Check local storage fallback for devices
        let localDevices: any[] = [];
        try {
          localDevices = JSON.parse(localStorage.getItem('mobcash_registered_devices') || '[]');
        } catch (e) {}

        const localMatch = localDevices.find(
          (d) => d.agent_id === user.agent_id && d.device_id === fp.deviceId
        );

        if (existingDevice?.status === 'active' || localMatch?.status === 'active') {
          // Device is already approved!
          const updatedUser = { ...user, status: 'active' };
          useAuthStore.getState().setUser(updatedUser, 'agent');
          navigate('/agent/dashboard');
          return;
        }

        // Generate account-bound dynamic code
        const code =
          existingDevice?.activation_code ||
          localMatch?.activation_code ||
          generateDeviceActivationCode(user.agent_id, fp.fingerprintHash);

        setActivationCode(code);
        localStorage.setItem(`activation_code_${fp.deviceId}`, code);

        // Register device if not exists
        if (!existingDevice) {
          const newRecord = {
            agent_id: user.agent_id,
            device_id: fp.deviceId,
            device_name: fp.deviceName,
            activation_code: code,
            status: 'pending',
            created_at: new Date().toISOString(),
          };

          try {
            await supabase.from('agent_devices').insert([newRecord]);
          } catch (e) {
            console.warn('Supabase device insert fallback:', e);
          }

          // Save locally
          const updatedLocal = [...localDevices.filter((d) => d.device_id !== fp.deviceId), newRecord];
          localStorage.setItem('mobcash_registered_devices', JSON.stringify(updatedLocal));

          // Send immediate Telegram alert to Admin
          const tgramMsg = `🛡️ <b>طلب تفعيل جهاز جديد (Device Activation Request)</b>\n\n` +
            `👤 <b>الوكيل:</b> ${user.full_name || 'Agent'} (<code>${user.agent_id}</code>)\n` +
            `🔑 <b>كود التفعيل الأمني:</b> <code>${code}</code>\n` +
            `💻 <b>الجهاز:</b> ${fp.deviceName}\n` +
            `🖥️ <b>الدقة:</b> <code>${fp.resolution}</code>\n` +
            `🌐 <b>المنطقة:</b> ${fp.timeZone}\n` +
            `🆔 <b>معرف الجهاز:</b> <code>${fp.deviceId}</code>\n\n` +
            `يرجى الدخول إلى لوحة الإدارة وتفعيل الجهاز للمتابعة.`;

          await sendTelegramNotification(tgramMsg);
        }
      } catch (err) {
        console.error('Device initialization error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initializeDevice();

    // Setup real-time listeners for instant approval
    try {
      channel = new BroadcastChannel('agent_device_channel');
      channel.onmessage = (event) => {
        if (event.data?.agent_id === user.agent_id && event.data?.status === 'active') {
          handleAutoApproved();
        }
      };
    } catch (e) {}

    const storageListener = (e: StorageEvent) => {
      if (e.key === 'mobcash_device_update') {
        try {
          const parsed = JSON.parse(e.newValue || '{}');
          if (parsed.agent_id === user.agent_id && parsed.status === 'active') {
            handleAutoApproved();
          }
        } catch (err) {}
      }
    };
    window.addEventListener('storage', storageListener);

    // Supabase Realtime channel
    const realtimeSub = supabase
      .channel(`device_sub_${user.agent_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_devices',
          filter: `agent_id=eq.${user.agent_id}`,
        },
        (payload) => {
          if (payload.new && (payload.new as any).status === 'active') {
            handleAutoApproved();
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      if (channel) channel.close();
      window.removeEventListener('storage', storageListener);
      supabase.removeChannel(realtimeSub);
    };
  }, [user, navigate]);

  const handleAutoApproved = () => {
    const updatedUser = { ...user, status: 'active' };
    useAuthStore.getState().setUser(updatedUser, 'agent');
    setStatusMessage(t('device_approved_redirecting', 'تم تفعيل جهازك بنجاح! جاري التحويل للوحة التحكم...'));
    setTimeout(() => {
      navigate('/agent/dashboard');
    }, 900);
  };

  const handleManualCheck = async () => {
    if (!deviceInfo || !user) return;
    setLoading(true);
    setStatusMessage('');

    try {
      let isApproved = false;

      // Check database
      try {
        const { data } = await supabase
          .from('agent_devices')
          .select('status')
          .eq('agent_id', user.agent_id)
          .eq('device_id', deviceInfo.deviceId)
          .maybeSingle();
        if (data?.status === 'active') isApproved = true;
      } catch (err) {}

      // Check local storage
      if (!isApproved) {
        const local = JSON.parse(localStorage.getItem('mobcash_registered_devices') || '[]');
        const match = local.find(
          (d: any) => d.agent_id === user.agent_id && d.device_id === deviceInfo.deviceId
        );
        if (match?.status === 'active') isApproved = true;
      }

      if (isApproved) {
        handleAutoApproved();
      } else {
        // Send a ping reminder to Admin
        const reminderMsg = `⏳ <b>تذكير: الوكيل بانتظار تفعيل الجهاز</b>\n\n` +
          `الوكيل: <b>${user.full_name}</b> (<code>${user.agent_id}</code>)\n` +
          `كود التفعيل: <code>${activationCode}</code>\n` +
          `الجهاز: <code>${deviceInfo.deviceName}</code>`;
        await sendTelegramNotification(reminderMsg);

        setStatusMessage(
          t(
            'device_still_pending',
            'الجهاز ما زال بانتظار موافقة الإدارة. تم إرسال إشعار للمسؤول لتسريع التفعيل.'
          )
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (activationCode) {
      navigator.clipboard.writeText(activationCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/agent/login');
  };

  return (
    <div className="min-h-[100dvh] w-full bg-[#0F172A] text-slate-100 flex flex-col relative font-sans selection:bg-blue-500 selection:text-white">
      {/* Top Professional Header */}
      <header className="h-16 sm:h-20 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-linear-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-500/20">
            M
          </div>
          <div className="hidden xs:flex flex-col">
            <span className="font-extrabold text-white text-base tracking-tight leading-none">MobCash Terminal</span>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5">Device Security Layer</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 text-xs sm:text-sm flex items-center gap-1.5 font-mono">
            <span className="text-slate-400 font-sans">{t('agent_id', 'معرف الوكيل')}:</span>
            <strong className="text-blue-400 font-bold">{user?.agent_id}</strong>
          </div>

          <LanguageSwitcher variant="dark" />

          <button
            onClick={handleLogout}
            className="p-2 sm:px-3 sm:py-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all flex items-center gap-1.5 text-xs sm:text-sm font-semibold cursor-pointer border border-slate-800 hover:border-rose-500/30"
            title={t('logout', 'خروج')}
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">{t('logout', 'خروج')}</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 max-w-lg mx-auto w-full">
        <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
          {/* Subtle Top Glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-32 bg-blue-500/20 blur-3xl rounded-full pointer-events-none" />

          {/* Security Icon & Title */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 mx-auto flex items-center justify-center shadow-inner">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {t('device_verification_title', 'التحقق الأمني من الجهاز')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
              {t(
                'device_verification_desc',
                'لحماية عملياتك المالية، يجب اعتماد هذا الجهاز من قِبل إدارة النظام قبل فتح الحساب.'
              )}
            </p>
          </div>

          {/* Dynamic Activation Code Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span className="font-semibold flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-blue-400" />
                {t('activation_code_label', 'كود التفعيل الخاص بهذا الحساب والجهاز:')}
              </span>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                {t('active_token', 'رمز أمان فريد')}
              </span>
            </div>

            <div
              onClick={handleCopyCode}
              className="group bg-slate-950 border border-slate-700/80 hover:border-blue-500/50 rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all shadow-inner active:scale-[0.99]"
            >
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                  SECURITY ACTIVATION CODE
                </span>
                <span className="font-mono font-black text-2xl sm:text-3xl text-blue-400 tracking-wider">
                  {activationCode || '••••-••••-••••'}
                </span>
              </div>

              <button
                type="button"
                className="px-3.5 py-2 rounded-xl bg-slate-800 group-hover:bg-blue-600 text-slate-300 group-hover:text-white transition-all text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                {copied ? <CheckCheck className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? t('copied', 'تم النسخ') : t('copy', 'نسخ')}</span>
              </button>
            </div>
          </div>

          {/* Live Status Pill */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-amber-400 animate-ping shrink-0" />
            <div className="text-xs text-amber-200/90 leading-relaxed">
              <strong>{t('pending_admin_approval', 'الحالة: بانتظار موافقة الإدارة')}</strong>
              <p className="text-[11px] text-amber-300/70 mt-0.5">
                {t('approval_sync_note', 'سيتم فتح الشاشة تلقائياً بمجرد تفعيل المدير لجهازك.')}
              </p>
            </div>
          </div>

          {/* Detected Device Specifications Card */}
          {deviceInfo && (
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-2 text-xs">
              <div className="text-slate-400 font-bold flex items-center gap-1.5 border-b border-slate-800/60 pb-2">
                <Monitor className="w-4 h-4 text-slate-400" />
                <span>{t('hardware_specs', 'مواصفات الجهاز المتصل:')}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 font-mono text-[11px] pt-1">
                <div>
                  <span className="text-slate-500 block">نظام التشغيل / OS:</span>
                  <span className="text-slate-300 font-semibold">{deviceInfo.os}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">المتصفح / Browser:</span>
                  <span className="text-slate-300 font-semibold">{deviceInfo.browser}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">الدقة / Resolution:</span>
                  <span className="text-slate-300">{deviceInfo.resolution}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">المنطقة / Timezone:</span>
                  <span className="text-slate-300 truncate">{deviceInfo.timeZone}</span>
                </div>
              </div>
            </div>
          )}

          {statusMessage && (
            <div className="text-xs text-center p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-300 flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Action Button */}
          <div className="space-y-3 pt-2">
            <button
              onClick={handleManualCheck}
              disabled={loading}
              className="w-full py-4 px-6 rounded-2xl bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Clock className="w-5 h-5" />
                  <span>{t('check_status_now', 'التحقق من حالة التفعيل الآن')}</span>
                </>
              )}
            </button>

            <p className="text-[11px] text-center text-slate-500">
              {t('support_contact_note', 'إذا استغرق التفعيل وقتاً أطول، تواصل مع مديرك المباشر مع تزويده بكود التفعيل.')}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
