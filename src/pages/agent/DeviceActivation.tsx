import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Smartphone, LogOut, Copy, CheckCheck, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/auth';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { sendTelegramNotification } from '../../lib/telegram';

export default function DeviceActivation() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [activationCode, setActivationCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activatedSuccess, setActivatedSuccess] = useState(false);

  useEffect(() => {
    if (!user || user.status !== 'active') {
      navigate('/agent/login');
      return;
    }

    let isMounted = true;
    let deviceId = '';

    const checkDevice = async () => {
      try {
        const deviceStorageKey = `mobcash_device_id_${user.agent_id}`;
        deviceId = localStorage.getItem(deviceStorageKey) || localStorage.getItem('mobcash_device_id') || '';
        if (!deviceId) {
          deviceId = 'dev_' + user.agent_id + '_' + Math.random().toString(36).substring(2, 10);
        }
        localStorage.setItem(deviceStorageKey, deviceId);
        localStorage.setItem('mobcash_device_id', deviceId);

        // Immediate local activation check
        const isLocalActive = localStorage.getItem(`device_active_${user.agent_id}_${deviceId}`) === 'true';
        if (isLocalActive) {
          if (isMounted) {
            const updatedUser = { ...user, status: 'active' };
            useAuthStore.getState().setUser(updatedUser, 'agent');
            navigate('/agent/dashboard');
            return;
          }
        }

        let deviceData: any = null;
        try {
          const { data } = await supabase
            .from('agent_devices')
            .select('*')
            .eq('agent_id', user.agent_id)
            .eq('device_id', deviceId)
            .maybeSingle();
          if (data) deviceData = data;
        } catch (err) {
          console.warn('Supabase agent_devices fetch note:', err);
        }

        if (!deviceData) {
          const localDevices = JSON.parse(localStorage.getItem('local_agent_devices') || '[]');
          deviceData = localDevices.find((d: any) => d.agent_id === user.agent_id && d.device_id === deviceId);
        }

        if (deviceData) {
          if (deviceData.status === 'active') {
            if (isMounted) {
              localStorage.setItem(`device_active_${user.agent_id}_${deviceId}`, 'true');
              const updatedUser = { ...user, status: 'active' };
              useAuthStore.getState().setUser(updatedUser, 'agent');
              navigate('/agent/dashboard');
              return;
            }
          } else {
            if (isMounted) {
              const code = deviceData.activation_code ? deviceData.activation_code.substring(0, 4) : '';
              setActivationCode(code);
              localStorage.setItem(`activation_code_${user.agent_id}_${deviceId}`, code);
              setLoading(false);
            }
          }
        } else {
          // generate new 4-character code unique to this agent and device
          let newCode = localStorage.getItem(`activation_code_${user.agent_id}_${deviceId}`);
          if (!newCode || newCode.length !== 4) {
             const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
             newCode = '';
             for (let i = 0; i < 4; i++) {
               newCode += chars.charAt(Math.floor(Math.random() * chars.length));
             }
             localStorage.setItem(`activation_code_${user.agent_id}_${deviceId}`, newCode);
          }
          
          if (isMounted) {
            setActivationCode(newCode);
          }
          
          const newDeviceObj = {
            id: 'dev_' + user.agent_id + '_' + Math.random().toString(36).substring(2, 9),
            agent_id: user.agent_id,
            device_id: deviceId,
            device_name: navigator.userAgent.substring(0, 50),
            activation_code: newCode,
            status: 'pending',
            created_at: new Date().toISOString()
          };
          
          const existingLocalDevices = JSON.parse(localStorage.getItem('local_agent_devices') || '[]');
          if (!existingLocalDevices.some((d: any) => d.agent_id === user.agent_id && d.device_id === deviceId)) {
            existingLocalDevices.push(newDeviceObj);
            localStorage.setItem('local_agent_devices', JSON.stringify(existingLocalDevices));
          }

          try {
            await supabase.from('agent_devices').insert([newDeviceObj]);
            
            // Send telegram notification to admin
            const message = `🔔 <b>New Device Activation Request</b>\n\n<b>Agent ID:</b> <code>${user.agent_id}</code>\n<b>Agent Name:</b> ${user.full_name}\n<b>Device ID:</b> <code>${deviceId}</code>\n<b>Activation Code:</b> <code>${newCode}</code>\n\nPlease activate this device from the Admin Panel.`;
            await sendTelegramNotification(message);
          } catch(e) {
            console.warn('Note inserting device to database:', e);
          }

          if (isMounted) {
            setLoading(false);
          }
        }
      } catch (err) {
        console.error(err);
        if (isMounted) setLoading(false);
      }
    };

    checkDevice();

    // Setup Realtime listener + Polling for instant device activation detection
    const deviceStorageKey = `mobcash_device_id_${user.agent_id}`;

    const checkActivationStatus = async () => {
      const activeDeviceId = deviceId || localStorage.getItem(deviceStorageKey) || localStorage.getItem('mobcash_device_id') || '';
      if (!activeDeviceId) return;

      // Check local active flag
      const isLocalActive = localStorage.getItem(`device_active_${user.agent_id}_${activeDeviceId}`) === 'true';
      const localDevices = JSON.parse(localStorage.getItem('local_agent_devices') || '[]');
      const localDev = localDevices.find((d: any) => (d.agent_id === user.agent_id || d.device_id === activeDeviceId) && d.status === 'active');

      if (isLocalActive || localDev) {
        if (isMounted) {
          setActivatedSuccess(true);
          localStorage.setItem(`device_active_${user.agent_id}_${activeDeviceId}`, 'true');
          const updatedUser = { ...user, status: 'active' };
          useAuthStore.getState().setUser(updatedUser, 'agent');
          setTimeout(() => {
            if (isMounted) navigate('/agent/dashboard');
          }, 800);
          return;
        }
      }

      try {
        const { data } = await supabase
          .from('agent_devices')
          .select('status')
          .eq('agent_id', user.agent_id)
          .eq('device_id', activeDeviceId)
          .maybeSingle();

        if (data && data.status === 'active') {
          if (isMounted) {
            setActivatedSuccess(true);
            localStorage.setItem(`device_active_${user.agent_id}_${activeDeviceId}`, 'true');
            const updatedUser = { ...user, status: 'active' };
            useAuthStore.getState().setUser(updatedUser, 'agent');
            setTimeout(() => {
              if (isMounted) navigate('/agent/dashboard');
            }, 800);
          }
        }
      } catch(e) {}
    };

    const interval = setInterval(checkActivationStatus, 1500);
    checkActivationStatus();

    const initialDevId = localStorage.getItem(deviceStorageKey) || localStorage.getItem('mobcash_device_id') || '';
    const channel = supabase
      .channel(`device_status_${user.agent_id}_${initialDevId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_devices',
          filter: `agent_id=eq.${user.agent_id}`
        },
        (payload: any) => {
          if (payload.new && payload.new.status === 'active') {
            if (isMounted) {
              setActivatedSuccess(true);
              const currentDevId = payload.new.device_id || initialDevId;
              localStorage.setItem(`device_active_${user.agent_id}_${currentDevId}`, 'true');
              const updatedUser = { ...user, status: 'active' };
              useAuthStore.getState().setUser(updatedUser, 'agent');
              setTimeout(() => {
                if (isMounted) navigate('/agent/dashboard');
              }, 800);
            }
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [user, navigate]);

  const handleVerify = async () => {
    setLoading(true);
    try {
      const deviceStorageKey = `mobcash_device_id_${user.agent_id}`;
      const deviceId = localStorage.getItem(deviceStorageKey);
      let status = 'pending';
      try {
        const { data } = await supabase
          .from('agent_devices')
          .select('status')
          .eq('agent_id', user.agent_id)
          .eq('device_id', deviceId)
          .maybeSingle();
        if (data) status = data.status;
      } catch (err) {
        // ignore
      }
        
      if (status === 'active') {
        setActivatedSuccess(true);
        const updatedUser = { ...user, status: 'active' };
        useAuthStore.getState().setUser(updatedUser, 'agent');
        
        try {
          const localAgents = JSON.parse(localStorage.getItem('local_registered_agents') || '[]');
          const aIndex = localAgents.findIndex((a: any) => a.agent_id === user.agent_id);
          if (aIndex >= 0) {
            localAgents[aIndex].status = 'active';
            localStorage.setItem('local_registered_agents', JSON.stringify(localAgents));
          }
        } catch(e) {}

        setTimeout(() => {
          navigate('/agent/dashboard');
        }, 1200);
      } else {
        const message = `⏳ <b>Reminder: Device Activation</b>\n\nAgent <b>${user.full_name}</b> (<code>${user.agent_id}</code>) is waiting for device activation.\n<b>Code:</b> <code>${activationCode}</code>`;
        await sendTelegramNotification(message);
        
        const isAr = (i18n.language || 'ar').startsWith('ar');
        alert(isAr 
          ? 'لم يتم تفعيل الجهاز بعد. يرجى التواصل مع المدير لتفعيل الكود.' 
          : t('device_not_activated_yet', 'Device not activated yet. Please contact your manager.')
        );
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/agent/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full bg-[#F8F9FA] text-[#131926] flex flex-col relative font-sans">
      {/* Header */}
      <div className="h-20 bg-white border-b border-gray-200 px-4 sm:px-8 flex items-center justify-between shadow-sm sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center text-white font-extrabold text-xl shadow-md">
            M
          </div>
          <span className="font-extrabold text-gray-900 text-lg tracking-tight hidden xs:inline">MobCash</span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 font-medium text-xs sm:text-sm flex items-center gap-1.5 shadow-xs">
            <span className="text-gray-500">{t('agent_id')}:</span>
            <strong className="font-mono text-secondary font-bold text-sm sm:text-base">{user?.agent_id}</strong>
          </div>

          <LanguageSwitcher variant="light" />

          <button
            onClick={handleLogout}
            className="p-2 sm:px-3 sm:py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all flex items-center gap-1.5 text-xs sm:text-sm font-semibold cursor-pointer border border-gray-200"
            title={t('logout')}
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">{t('logout')}</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col px-6 pt-8 pb-6 max-w-md mx-auto w-full">
        {activatedSuccess && (
          <div className="mb-6 bg-emerald-500 text-white p-4 rounded-2xl flex items-center gap-3 shadow-lg animate-bounce">
            <CheckCircle2 className="w-6 h-6 shrink-0" />
            <div>
              <div className="font-bold text-sm">
                {(i18n.language || 'ar').startsWith('ar') ? 'تم تفعيل هذا الجهاز بنجاح!' : 'Device activated successfully!'}
              </div>
              <div className="text-xs text-emerald-100">
                {(i18n.language || 'ar').startsWith('ar') ? 'جاري التوجيه تلقائياً إلى لوحة التحكم...' : 'Redirecting to dashboard...'}
              </div>
            </div>
          </div>
        )}

        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {t('device_activation_title', 'تفعيل الجهاز')}
        </h1>
        
        <div className="text-gray-600 text-sm leading-relaxed mb-8 text-center sm:text-start">
          <p>{t('device_activation_desc', 'لأسباب أمنية، يرجى الاتصال بمدير حسابك وتزويده بكود التفعيل التالي:')}</p>
          <div 
            onClick={() => {
              navigator.clipboard.writeText(activationCode);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="mt-4 flex items-center justify-center sm:justify-start gap-3 cursor-pointer group"
          >
            <div className="bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3 transition-colors group-hover:bg-gray-200">
              <span className="font-mono font-bold text-2xl tracking-widest text-black">{activationCode}</span>
              <div className="text-gray-400 group-hover:text-blue-600 transition-colors">
                {copied ? <CheckCheck className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
              </div>
            </div>
            {copied && <span className="text-xs font-bold text-emerald-500 transition-opacity">تم النسخ</span>}
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="relative w-48 h-48">
            <Smartphone className="w-full h-full text-gray-300" strokeWidth={1} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                <div className="w-8 h-8 text-blue-600">✓</div>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleVerify}
          disabled={loading}
          className="w-full bg-[#4E71FF] text-white font-bold py-4 rounded-xl mt-8 active:scale-95 transition-transform"
        >
          {t('verify', 'التحقق')}
        </button>
      </div>
    </div>
  );
}
