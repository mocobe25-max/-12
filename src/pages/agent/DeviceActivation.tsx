import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Smartphone, LogOut } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/auth';

export default function DeviceActivation() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [activationCode, setActivationCode] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.status !== 'active') {
      navigate('/agent/login');
      return;
    }

    const checkDevice = async () => {
      try {
        let deviceId = localStorage.getItem('mobcash_device_id');
        if (!deviceId) {
          deviceId = 'dev_' + Math.random().toString(36).substring(2, 15);
          localStorage.setItem('mobcash_device_id', deviceId);
        }

        const { data, error } = await supabase
          .from('agent_devices')
          .select('*')
          .eq('agent_id', user.agent_id)
          .eq('device_id', deviceId)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching device status', error);
        }

        if (data) {
          if (data.status === 'active') {
            navigate('/agent/dashboard');
          } else {
            setActivationCode(data.activation_code);
            setLoading(false);
          }
        } else {
          // generate new code
          const generateActivationCode = () => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let result = '';
            for (let i = 0; i < 4; i++) {
              result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return result;
          };
          const newCode = generateActivationCode();
          setActivationCode(newCode);
          
          await supabase.from('agent_devices').insert([
            {
              agent_id: user.agent_id,
              device_id: deviceId,
              device_name: navigator.userAgent.substring(0, 50), // simple device name
              activation_code: newCode,
              status: 'pending'
            }
          ]);
          setLoading(false);
        }
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    checkDevice();
  }, [user, navigate]);

  const handleVerify = async () => {
    setLoading(true);
    try {
      const deviceId = localStorage.getItem('mobcash_device_id');
      const { data, error } = await supabase
        .from('agent_devices')
        .select('status')
        .eq('agent_id', user.agent_id)
        .eq('device_id', deviceId)
        .single();
        
      if (data && data.status === 'active') {
        navigate('/agent/dashboard');
      } else {
        alert(t('device_not_activated_yet', 'Device not activated yet. Please contact your manager.'));
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
      <div className="h-16 flex items-center justify-between px-6 bg-white border-b border-gray-200">
        <div className="font-bold text-gray-700">ID {user?.agent_id}</div>
        <button onClick={handleLogout} className="p-2 text-gray-500 hover:text-gray-900">
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col px-6 pt-8 pb-6 max-w-md mx-auto w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {t('device_activation_title', 'تفعيل الجهاز')}
        </h1>
        
        <p className="text-gray-600 text-sm leading-relaxed mb-8">
          {t('device_activation_desc', 'لأسباب أمنية، يرجى الاتصال بمدير حسابك وتزويده بكود التفعيل التالي:')}
          <br/>
          <span className="font-mono font-bold text-xl text-black block mt-2">{activationCode}</span>
        </p>

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
