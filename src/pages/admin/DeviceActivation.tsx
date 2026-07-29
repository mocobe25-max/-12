import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, MonitorSmartphone, CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';

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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch agents
      const { data: agentsData, error: agentsError } = await supabase
        .from('agents')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (agentsError) throw agentsError;
      setAgents(agentsData || []);

      // Fetch all devices
      const { data: devicesData, error: devicesError } = await supabase
        .from('agent_devices')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (devicesError) throw devicesError;
      setDevices(devicesData || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleAgentSelect = (agent: any) => {
    setSelectedAgent(agent);
  };

  const handleActivateClick = (device: any) => {
    setSelectedDevice(device);
    setInputCode('');
    setShowActivateModal(true);
  };

  const submitActivation = async () => {
    if (!selectedDevice || !inputCode.trim()) return;
    
    if (inputCode.trim().toLowerCase() !== selectedDevice.activation_code.toLowerCase()) {
      alert(t('invalid_activation_code', 'كود التفعيل غير صحيح'));
      return;
    }

    try {
      const { error } = await supabase
        .from('agent_devices')
        .update({ status: 'active', activated_at: new Date().toISOString() })
        .eq('id', selectedDevice.id);

      if (error) throw error;
      
      alert(t('device_activated_success', 'تم تفعيل الجهاز بنجاح'));
      setShowActivateModal(false);
      fetchData(); // refresh list
    } catch (err) {
      console.error(err);
      alert('Error activating device');
    }
  };

  const handleDeactivate = async (device: any) => {
    if (!window.confirm(t('confirm_deactivate_device', 'هل أنت متأكد من إلغاء تفعيل هذا الجهاز؟'))) return;
    
    try {
      const { error } = await supabase
        .from('agent_devices')
        .delete()
        .eq('id', device.id);

      if (error) throw error;
      
      fetchData(); // refresh list
    } catch (err) {
      console.error(err);
      alert('Error deactivating device');
    }
  };

  const filteredAgents = agents.filter(a => 
    a.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    a.agent_id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('device_activation', 'تفعيل الأجهزة')}</h1>
          <p className="text-gray-500 mt-1">{t('device_activation_subtitle', 'إدارة وتفعيل أجهزة الوكلاء')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Agents List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[600px]">
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute start-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={t('search_agent', 'ابحث عن وكيل...')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                dir="auto"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loading ? (
              <div className="p-4 text-center text-gray-500">{t('loading')}</div>
            ) : filteredAgents.map(agent => {
              const agentDevices = devices.filter(d => d.agent_id === agent.agent_id);
              const pendingCount = agentDevices.filter(d => d.status === 'pending').length;
              
              return (
                <button
                  key={agent.id}
                  onClick={() => handleAgentSelect(agent)}
                  className={`w-full text-start p-3 rounded-xl transition-colors ${
                    selectedAgent?.id === agent.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="font-semibold text-gray-900">{agent.full_name || agent.agent_id}</div>
                  <div className="text-sm text-gray-500 mt-1 flex justify-between">
                    <span>ID: {agent.agent_id}</span>
                    {pendingCount > 0 && (
                      <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs font-bold">
                        {pendingCount} {t('pending', 'قيد الانتظار')}
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Selected Agent Devices */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 h-[600px] overflow-y-auto">
          {selectedAgent ? (
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                  <MonitorSmartphone className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedAgent.full_name || 'Agent'}</h2>
                  <p className="text-gray-500">ID: {selectedAgent.agent_id}</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Pending Devices */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-orange-500" />
                    {t('devices_pending_activation', 'أجهزة في انتظار التفعيل')}
                  </h3>
                  <div className="space-y-3">
                    {devices.filter(d => d.agent_id === selectedAgent.agent_id && d.status === 'pending').length === 0 ? (
                      <p className="text-gray-500 text-sm">{t('no_pending_devices', 'لا توجد أجهزة في انتظار التفعيل')}</p>
                    ) : (
                      devices.filter(d => d.agent_id === selectedAgent.agent_id && d.status === 'pending').map(device => (
                        <div key={device.id} className="flex items-center justify-between p-4 border border-orange-200 bg-orange-50 rounded-xl">
                          <div>
                            <div className="font-semibold text-gray-900">{device.device_name || 'Unknown Device'}</div>
                            <div className="text-sm text-gray-500 mt-1">{new Date(device.created_at).toLocaleString()}</div>
                          </div>
                          <button
                            onClick={() => handleActivateClick(device)}
                            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors shadow-sm"
                          >
                            {t('activate', 'تفعيل')}
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Active Devices */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2 mt-8">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    {t('activated_devices', 'الأجهزة المفعلة')}
                  </h3>
                  <div className="space-y-3">
                    {devices.filter(d => d.agent_id === selectedAgent.agent_id && d.status === 'active').length === 0 ? (
                      <p className="text-gray-500 text-sm">{t('no_active_devices', 'لا توجد أجهزة مفعلة')}</p>
                    ) : (
                      devices.filter(d => d.agent_id === selectedAgent.agent_id && d.status === 'active').map(device => (
                        <div key={device.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                          <div>
                            <div className="font-semibold text-gray-900">{device.device_name || 'Unknown Device'}</div>
                            <div className="text-sm text-gray-500 mt-1">
                              {t('activated_on', 'تم التفعيل في')}: {new Date(device.activated_at || device.created_at).toLocaleString()}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeactivate(device)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                            title={t('remove_device', 'إزالة الجهاز')}
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 p-6">
              <MonitorSmartphone className="w-16 h-16 mb-4 text-gray-200" />
              <p>{t('select_agent_to_view_devices', 'اختر وكيلاً لعرض أجهزته')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Activation Modal */}
      {showActivateModal && selectedDevice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{t('enter_activation_code', 'أدخل كود التفعيل')}</h3>
            <p className="text-sm text-gray-500 mb-6">{t('ask_agent_for_code', 'اطلب كود التفعيل من الوكيل وأدخله هنا لتفعيل الجهاز.')}</p>
            
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              className="w-full text-center text-2xl font-mono tracking-widest px-4 py-3 border-2 border-gray-300 focus:border-blue-500 rounded-xl mb-6 outline-none"
              placeholder="----"
              maxLength={4}
            />
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowActivateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                {t('cancel', 'إلغاء')}
              </button>
              <button
                onClick={submitActivation}
                disabled={inputCode.length < 4}
                className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {t('verify_and_activate', 'تفعيل')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
