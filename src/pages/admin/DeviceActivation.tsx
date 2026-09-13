import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, MonitorSmartphone, CheckCircle, XCircle, Clock, ShieldCheck, Cpu, Smartphone, RefreshCw, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { sendTelegramNotification } from '../../lib/telegram';

export default function AdminDeviceActivation() {
  const { t } = useTranslation();
  const [agents, setAgents] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal for activation
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [inputCode, setInputCode] = useState('');
  const [isActivating, setIsActivating] = useState(false);

  useEffect(() => {
    fetchData();

    // Listen to device requests in real-time
    const sub = supabase
      .channel('admin_devices_sub')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'agent_devices' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(sub);
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch agents
      let dbAgents: any[] = [];
      try {
        const { data: agentsData } = await supabase
          .from('agents')
          .select('*')
          .order('created_at', { ascending: false });
        if (agentsData) dbAgents = agentsData;
      } catch (e) {}

      let localAgents: any[] = [];
      try {
        localAgents = JSON.parse(localStorage.getItem('local_registered_agents') || '[]');
      } catch (e) {}

      const allAgentsMap = new Map();
      [...dbAgents, ...localAgents].forEach((a) => {
        if (!allAgentsMap.has(a.agent_id)) allAgentsMap.set(a.agent_id, a);
      });
      const mergedAgents = Array.from(allAgentsMap.values());
      setAgents(mergedAgents);

      // Fetch all devices from Supabase & localStorage
      let dbDevices: any[] = [];
      try {
        const { data: devicesData } = await supabase
          .from('agent_devices')
          .select('*')
          .order('created_at', { ascending: false });
        if (devicesData) dbDevices = devicesData;
      } catch (err) {}

      let localDevices: any[] = [];
      try {
        localDevices = JSON.parse(localStorage.getItem('mobcash_registered_devices') || '[]');
      } catch (e) {}

      const devicesMap = new Map();
      [...dbDevices, ...localDevices].forEach((d) => {
        const key = `${d.agent_id}_${d.device_id}`;
        if (!devicesMap.has(key)) devicesMap.set(key, d);
      });

      const finalDevices = Array.from(devicesMap.values());
      setDevices(finalDevices);

      if (selectedAgent) {
        const updatedSelected = mergedAgents.find((a) => a.agent_id === selectedAgent.agent_id);
        if (updatedSelected) setSelectedAgent(updatedSelected);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAgentSelect = (agent: any) => {
    setSelectedAgent(agent);
  };

  const handleQuickActivate = async (device: any) => {
    if (!window.confirm(`هل أنت متأكد من تفعيل هذا الجهاز للوكيل ${device.agent_id} فوراً؟`)) {
      return;
    }
    await executeDeviceApproval(device);
  };

  const handleActivateClick = (device: any) => {
    setSelectedDevice(device);
    setInputCode(device.activation_code || '');
    setShowActivateModal(true);
  };

  const executeDeviceApproval = async (device: any) => {
    setIsActivating(true);
    try {
      const now = new Date().toISOString();

      // Update Supabase
      try {
        await supabase
          .from('agent_devices')
          .update({ status: 'active', activated_at: now })
          .eq('device_id', device.device_id)
          .eq('agent_id', device.agent_id);
      } catch (e) {
        console.warn('Supabase device update fallback:', e);
      }

      // Update local storage devices
      try {
        const local = JSON.parse(localStorage.getItem('mobcash_registered_devices') || '[]');
        const updated = local.map((d: any) => {
          if (d.device_id === device.device_id && d.agent_id === device.agent_id) {
            return { ...d, status: 'active', activated_at: now };
          }
          return d;
        });
        localStorage.setItem('mobcash_registered_devices', JSON.stringify(updated));
      } catch (e) {}

      // Broadcast instant unlock to Agent tab
      try {
        const channel = new BroadcastChannel('agent_device_channel');
        channel.postMessage({
          agent_id: device.agent_id,
          device_id: device.device_id,
          status: 'active',
        });
        channel.close();

        localStorage.setItem(
          'mobcash_device_update',
          JSON.stringify({
            agent_id: device.agent_id,
            device_id: device.device_id,
            status: 'active',
            time: Date.now(),
          })
        );
      } catch (e) {}

      // Send Telegram notification
      const message = `✅ <b>تم اعتماد الجهاز بنجاح (Device Activated)</b>\n\n` +
        `👤 <b>الوكيل:</b> <code>${device.agent_id}</code>\n` +
        `🔑 <b>كود التفعيل:</b> <code>${device.activation_code}</code>\n` +
        `💻 <b>الجهاز:</b> ${device.device_name || 'Terminal'}\n` +
        `🕒 <b>الوقت:</b> ${new Date().toLocaleTimeString()}`;
      await sendTelegramNotification(message);

      setShowActivateModal(false);
      await fetchData();
    } catch (err) {
      console.error('Error activating device:', err);
      alert('حدث خطأ أثناء تفعيل الجهاز');
    } finally {
      setIsActivating(false);
    }
  };

  const submitActivation = async () => {
    if (!selectedDevice) return;
    const cleanInput = inputCode.trim().toUpperCase().replace(/\s+/g, '');
    const cleanExpected = (selectedDevice.activation_code || '').trim().toUpperCase().replace(/\s+/g, '');

    if (cleanInput && cleanExpected && cleanInput !== cleanExpected) {
      alert(t('invalid_activation_code', 'كود التفعيل غير مطابق للكود الصادر من الجهاز'));
      return;
    }

    await executeDeviceApproval(selectedDevice);
  };

  const handleDeactivate = async (device: any) => {
    if (!window.confirm(t('confirm_deactivate_device', 'هل أنت متأكد من إلغاء تفعيل هذا الجهاز؟ سيتوقف الوكيل فوراً.'))) {
      return;
    }

    try {
      // Update/delete in Supabase
      try {
        await supabase
          .from('agent_devices')
          .update({ status: 'blocked' })
          .eq('device_id', device.device_id)
          .eq('agent_id', device.agent_id);
      } catch (e) {}

      // Update local storage
      try {
        const local = JSON.parse(localStorage.getItem('mobcash_registered_devices') || '[]');
        const updated = local.filter(
          (d: any) => !(d.device_id === device.device_id && d.agent_id === device.agent_id)
        );
        localStorage.setItem('mobcash_registered_devices', JSON.stringify(updated));
      } catch (e) {}

      // Broadcast revocation
      try {
        const channel = new BroadcastChannel('agent_device_channel');
        channel.postMessage({
          agent_id: device.agent_id,
          device_id: device.device_id,
          status: 'blocked',
        });
        channel.close();

        localStorage.setItem(
          'mobcash_device_update',
          JSON.stringify({
            agent_id: device.agent_id,
            device_id: device.device_id,
            status: 'blocked',
            time: Date.now(),
          })
        );
      } catch (e) {}

      fetchData();
    } catch (err) {
      console.error(err);
      alert('Error deactivating device');
    }
  };

  const filteredAgents = agents.filter(
    (a) =>
      a.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.agent_id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-blue-600" />
            <span>{t('device_activation', 'تفعيل الأجهزة والتحقق الأمني')}</span>
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            {t(
              'device_activation_subtitle',
              'إدارة أجهزة الوكلاء المرتبطة بالبصمة الأمنية (Hardware Fingerprint) مع إشعارات فورية.'
            )}
          </p>
        </div>

        <button
          onClick={fetchData}
          className="px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-700 text-sm font-semibold flex items-center gap-2 shadow-xs cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>تحديث القائمة</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agents List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[650px]">
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute start-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t('search_agent', 'ابحث باسم أو كود الوكيل...')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden text-sm"
                dir="auto"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loading ? (
              <div className="p-4 text-center text-gray-500">{t('loading')}</div>
            ) : filteredAgents.map((agent) => {
              const agentDevices = devices.filter((d) => d.agent_id === agent.agent_id);
              const pendingCount = agentDevices.filter((d) => d.status === 'pending').length;

              return (
                <button
                  key={agent.agent_id}
                  onClick={() => handleAgentSelect(agent)}
                  className={`w-full text-start p-3.5 rounded-xl transition-all flex items-center justify-between border ${
                    selectedAgent?.agent_id === agent.agent_id
                      ? 'bg-blue-50 border-blue-200 text-blue-900 shadow-xs'
                      : 'hover:bg-gray-50 border-transparent text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                      {agent.full_name?.[0]?.toUpperCase() || 'A'}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-gray-900">{agent.full_name}</div>
                      <div className="text-xs text-gray-500 font-mono">{agent.agent_id}</div>
                    </div>
                  </div>

                  {pendingCount > 0 ? (
                    <span className="px-2.5 py-1 bg-amber-500 text-white text-xs font-bold rounded-full animate-pulse shadow-xs">
                      {pendingCount} بانتظار التفعيل
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400 font-medium">
                      {agentDevices.length} أجهزة
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Devices Panel */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[650px]">
          {selectedAgent ? (
            <div className="h-full flex flex-col">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{selectedAgent.full_name}</h2>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span className="font-mono bg-white px-2 py-0.5 rounded border border-gray-200">
                      ID: {selectedAgent.agent_id}
                    </span>
                    <span>العملة: {selectedAgent.currency || 'USD'}</span>
                    <span>الرصيد: {selectedAgent.balance || 0}</span>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Pending Devices */}
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-amber-600 mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span>طلبات تفعيل الأجهزة المعلقة (Pending Devices)</span>
                  </h3>
                  <div className="space-y-3">
                    {devices.filter(
                      (d) => d.agent_id === selectedAgent.agent_id && d.status === 'pending'
                    ).length === 0 ? (
                      <div className="p-6 text-center border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 text-sm">
                        لا توجد طلبات تفعيل معلقة لهذا الوكيل حالياً.
                      </div>
                    ) : (
                      devices
                        .filter((d) => d.agent_id === selectedAgent.agent_id && d.status === 'pending')
                        .map((device) => (
                          <div
                            key={device.device_id || device.id}
                            className="p-4 border border-amber-200 bg-amber-50/50 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
                          >
                            <div className="space-y-1">
                              <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                <Smartphone className="w-4 h-4 text-amber-600" />
                                <span>{device.device_name || 'Mobile/PC Terminal'}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-gray-500">كود التفعيل الأمني:</span>
                                <span className="font-mono font-black text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-md text-sm border border-blue-200 tracking-wider">
                                  {device.activation_code}
                                </span>
                              </div>
                              <div className="text-[11px] text-gray-400 font-mono">
                                تاريخ الطلب: {new Date(device.created_at).toLocaleString()}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleQuickActivate(device)}
                                disabled={isActivating}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>تفعيل فوري</span>
                              </button>

                              <button
                                onClick={() => handleActivateClick(device)}
                                className="px-3.5 py-2 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                              >
                                تأكيد بالكود
                              </button>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>

                {/* Active Devices */}
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-600 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span>الأجهزة المعتمدة والمفعلة (Active Devices)</span>
                  </h3>
                  <div className="space-y-3">
                    {devices.filter(
                      (d) => d.agent_id === selectedAgent.agent_id && d.status === 'active'
                    ).length === 0 ? (
                      <div className="p-6 text-center border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 text-sm">
                        لا توجد أجهزة مفعلة لهذا الوكيل.
                      </div>
                    ) : (
                      devices
                        .filter((d) => d.agent_id === selectedAgent.agent_id && d.status === 'active')
                        .map((device) => (
                          <div
                            key={device.device_id || device.id}
                            className="p-4 border border-emerald-100 bg-emerald-50/20 rounded-2xl flex items-center justify-between shadow-xs"
                          >
                            <div className="space-y-0.5">
                              <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                <MonitorSmartphone className="w-4 h-4 text-emerald-600" />
                                <span>{device.device_name || 'Terminal'}</span>
                              </div>
                              <div className="text-xs text-gray-500 font-mono">
                                الكود: <strong className="text-gray-700">{device.activation_code}</strong> &bull; تم التفعيل: {new Date(device.activated_at || device.created_at).toLocaleString()}
                              </div>
                            </div>

                            <button
                              onClick={() => handleDeactivate(device)}
                              className="px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              title={t('remove_device', 'إلغاء التفعيل فوراً')}
                            >
                              <XCircle className="w-4 h-4" />
                              <span>إلغاء التفعيل</span>
                            </button>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 p-6 space-y-3">
              <MonitorSmartphone className="w-16 h-16 text-gray-300" strokeWidth={1.5} />
              <p className="text-sm font-medium">{t('select_agent_to_view_devices', 'اختر وكيلاً من القائمة لعرض أجهزته والتحكم في تفعيلها.')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Activation Code Verification Modal */}
      {showActivateModal && selectedDevice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 space-y-4">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">{t('enter_activation_code', 'تأكيد تفعيل الجهاز')}</h3>
              <p className="text-xs text-gray-500">
                كود الجهاز المعروض عند الوكيل:
              </p>
            </div>

            <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200 text-center font-mono font-black text-xl text-blue-600 tracking-wider">
              {selectedDevice.activation_code}
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowActivateModal(false)}
                className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-100 transition-colors"
              >
                {t('cancel', 'إلغاء')}
              </button>
              <button
                type="button"
                onClick={submitActivation}
                disabled={isActivating}
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isActivating ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>{t('verify_and_activate', 'تأكيد وتفعيل')}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
