import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Search, Edit2, Trash2, ShieldAlert, Eye, EyeOff, X, Clock, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { sendTelegramMessage } from '../../lib/telegram';

export default function ManageAgents() {
  const { t } = useTranslation();
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  
  // Edit Modal State
  const [editingAgent, setEditingAgent] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    agent_id: '',
    password_hash: '',
    full_name: '',
    country: '',
    city: '',
    bank_name: '',
    commission_deposit: 0,
    commission_withdraw: 0,
    agent_type: 'mobcash',
    activation_amount: '',
    usdt_address: '',
    qr_code_url: ''
  });

  // Delete Modal State
  const [agentToDelete, setAgentToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      let supabaseAgents: any[] = [];
      try {
        const { data, error } = await supabase
          .from('agents')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) {
          supabaseAgents = data;
        }
      } catch {
        // ignore supabase error
      }

      let localAgents: any[] = [];
      try {
        localAgents = JSON.parse(localStorage.getItem('local_registered_agents') || '[]');
      } catch {
        // ignore
      }

      // Merge and deduplicate by agent_id or id
      const map = new Map();
      [...supabaseAgents, ...localAgents].forEach(a => {
        if (a && a.agent_id) {
          map.set(a.agent_id, a);
        }
      });

      const merged = Array.from(map.values()).sort((a: any, b: any) => {
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      });

      setAgents(merged);
    } catch (error) {
      console.error('Error fetching agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('agents')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      
      setAgents(agents.map(a => a.id === id ? { ...a, status: newStatus } : a));
      
      const agent = agents.find(a => a.id === id);
      if (agent) {
        await supabase.from('activities').insert([
          {
            agent_id: agent.agent_id,
            action: `Status updated to ${newStatus} by admin`,
          },
        ]);

        // Send Telegram notification
        try {
          const msg = `🔄 *تحديث حالة الوكيل* 🔄\n\n` +
                      `*ID الوكيل:* \`${agent.agent_id}\`\n` +
                      `*الاسم:* ${agent.full_name}\n` +
                      `*الحالة الجديدة:* ${newStatus}\n` +
                      `*بواسطة:* الإدارة`;
          await sendTelegramMessage(msg);
        } catch (e) {
          console.error('Telegram notification failed', e);
        }
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const resetDepositTimer = async (agent: any) => {
    try {
      // Mark as PENDING_LOGIN so countdown only starts when the agent actually logs in / opens the portal
      await supabase
        .from('agents')
        .update({ deposit_timer_reset_at: 'PENDING_LOGIN' })
        .eq('id', agent.id);

      // Reset local flags
      localStorage.removeItem(`deposit_timer_start_${agent.id}`);
      localStorage.setItem(`deposit_timer_pending_${agent.id}`, 'true');

      alert(`✅ تم تجديد مهلة الإيداع للوكيل: ${agent.full_name || agent.agent_id}\nوسيبدأ عد الـ 10 دقائق فور تسجيل الوكيل لدخوله.`);
      fetchAgents();
    } catch (error) {
      console.error('Error resetting timer:', error);
    }
  };

  const confirmDelete = (id: string) => {
    setAgentToDelete(id);
  };

  const handleDelete = async () => {
    if (!agentToDelete) return;
    
    try {
      const { error } = await supabase
        .from('agents')
        .delete()
        .eq('id', agentToDelete);

      if (error) throw error;
      
      setAgents(agents.filter(a => a.id !== agentToDelete));
      setAgentToDelete(null);
    } catch (error) {
      console.error('Error deleting agent:', error);
    }
  };

  const handleEditClick = (agent: any) => {
    setEditingAgent(agent);
    setEditForm({
      agent_id: agent.agent_id || '',
      password_hash: agent.password_hash || '',
      full_name: agent.full_name,
      country: agent.country,
      city: agent.city,
      bank_name: agent.bank_name,
      commission_deposit: agent.commission_deposit,
      commission_withdraw: agent.commission_withdraw,
      agent_type: agent.agent_type || 'mobcash',
      activation_amount: agent.activation_amount || '',
      usdt_address: agent.usdt_address || '',
      qr_code_url: agent.qr_code_url || ''
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAgent) return;

    try {
      const { error } = await supabase
        .from('agents')
        .update(editForm)
        .eq('id', editingAgent.id);

      if (error) throw error;

      setAgents(agents.map(a => a.id === editingAgent.id ? { ...a, ...editForm } : a));
      setEditingAgent(null);
    } catch (error) {
      console.error('Error updating agent:', error);
      alert('Failed to update agent');
    }
  };

  const togglePassword = (id: string) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredAgents = agents.filter(agent => 
    agent.full_name.toLowerCase().includes(search.toLowerCase()) ||
    agent.agent_id.includes(search)
  );

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-blue-100 text-blue-800';
      case 'verified': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div className="p-8">{t('loading')}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t('manage_agents')}</h1>
        </div>
        
        <div className="relative">
          <div className="absolute inset-y-0 start-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder={t('search_agents')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-secondary focus:border-secondary w-full sm:w-64 bg-white"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-4 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('agent_id')} & {t('password')}
                </th>
                <th scope="col" className="px-6 py-4 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('name')}
                </th>
                <th scope="col" className="px-6 py-4 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('location')}
                </th>
                <th scope="col" className="px-6 py-4 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('status')} & Step
                </th>
                <th scope="col" className="px-6 py-4 text-end text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAgents.map((agent) => (
                <tr key={agent.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-mono text-sm font-medium text-secondary">{agent.agent_id}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-xs text-gray-500">
                        {showPasswords[agent.id] ? agent.password_hash : '••••••••'}
                      </span>
                      <button 
                        onClick={() => togglePassword(agent.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords[agent.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{agent.full_name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">{agent.bank_name}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        agent.agent_type === 'bank_transfer'
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        {agent.agent_type === 'bank_transfer' ? '🏦 تحويل مصرفي' : '🟢 وكيل موبيكاش'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{agent.city}</div>
                    <div className="text-sm text-gray-500">{agent.country}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-2 items-start">
                      <select
                        value={agent.status}
                        onChange={(e) => updateStatus(agent.id, e.target.value)}
                        className={`text-xs font-semibold rounded-full px-3 py-1 border-0 cursor-pointer focus:ring-2 focus:ring-secondary ${getStatusColor(agent.status)}`}
                      >
                        <option value="pending">{t('pending')}</option>
                        <option value="verified">{t('verified')}</option>
                        <option value="under_review">{t('under_review')}</option>
                        <option value="active">{t('active')}</option>
                        <option value="suspended">{t('suspended')}</option>
                      </select>
                      {agent.current_step && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                          Step: {agent.current_step}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-end text-sm font-medium">
                    <button 
                      onClick={() => resetDepositTimer(agent)}
                      className="text-amber-600 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 p-2 rounded-lg transition-colors inline-flex items-center gap-1 text-xs font-bold me-1 cursor-pointer"
                      title="إعادة فتح مهلة الإيداع 10 دقائق"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span className="hidden lg:inline">تجديد المهلة (10د)</span>
                    </button>
                    <button 
                      onClick={() => handleEditClick(agent)}
                      className="text-secondary hover:text-primary transition-colors p-2"
                      title={t('edit', 'تعديل')}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => confirmDelete(agent.id)}
                      className="text-red-600 hover:text-red-900 transition-colors p-2 ml-2"
                      title={t('delete', 'حذف')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredAgents.length === 0 && (
            <div className="p-8 text-center text-gray-500 flex flex-col items-center">
              <ShieldAlert className="w-12 h-12 text-gray-300 mb-3" />
              <p>{t('no_agents_found')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {agentToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{t('confirm_delete')}</h3>
            <p className="text-gray-500 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setAgentToDelete(null)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-xl font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingAgent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">{t('edit_agent')}</h3>
              <button onClick={() => setEditingAgent(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
              {/* Agent Type */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">نوع الوكيل</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEditForm({...editForm, agent_type: 'mobcash'})}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer text-xs font-bold ${
                      editForm.agent_type === 'mobcash'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    🟢 وكيل موبيكاش (بدون محفظة)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditForm({...editForm, agent_type: 'bank_transfer'})}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer text-xs font-bold ${
                      editForm.agent_type === 'bank_transfer'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    🏦 وكيل تحويل مصرفي
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('agent_id') || 'الايدي (Agent ID)'}</label>
                  <input
                    type="text"
                    value={editForm.agent_id}
                    onChange={e => setEditForm({...editForm, agent_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary bg-white text-gray-950 font-semibold font-mono text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('password') || 'كلمة المرور'}</label>
                  <input
                    type="text"
                    value={editForm.password_hash}
                    onChange={e => setEditForm({...editForm, password_hash: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary bg-white text-gray-950 font-semibold font-mono text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('name')}</label>
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={e => setEditForm({...editForm, full_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary bg-white text-gray-950 font-semibold"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('country')}</label>
                  <input
                    type="text"
                    value={editForm.country}
                    onChange={e => setEditForm({...editForm, country: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary bg-white text-gray-950 font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('city')}</label>
                  <input
                    type="text"
                    value={editForm.city}
                    onChange={e => setEditForm({...editForm, city: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary bg-white text-gray-950 font-semibold"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('bank_name')}</label>
                <input
                  type="text"
                  value={editForm.bank_name}
                  onChange={e => setEditForm({...editForm, bank_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary bg-white text-gray-950 font-semibold"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('deposit_commission')} (%)</label>
                  <input
                    type="number"
                    value={editForm.commission_deposit}
                    onChange={e => setEditForm({...editForm, commission_deposit: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary bg-white text-gray-950 font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('withdrawal_commission')} (%)</label>
                  <input
                    type="number"
                    value={editForm.commission_withdraw}
                    onChange={e => setEditForm({...editForm, commission_withdraw: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary bg-white text-gray-950 font-semibold"
                    required
                  />
                </div>
              </div>
              
              {/* Payment Details Section */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <h4 className="font-bold text-gray-900 mb-4">{t('payment_details')}</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('activation_amount_usdt')}</label>
                    <input
                      type="text"
                      value={editForm.activation_amount}
                      onChange={e => setEditForm({...editForm, activation_amount: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary bg-white text-gray-950 font-semibold font-mono"
                      placeholder="e.g. 500.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('deposit_address_usdt')}</label>
                    <input
                      type="text"
                      value={editForm.usdt_address}
                      onChange={e => setEditForm({...editForm, usdt_address: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary bg-white text-gray-950 font-semibold font-mono text-sm"
                      placeholder="T..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('qr_code_image')}</label>
                    <input
                      type="text"
                      value={editForm.qr_code_url}
                      onChange={e => setEditForm({...editForm, qr_code_url: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary bg-white text-gray-950 font-semibold text-sm"
                      placeholder="https://..."
                    />
                    {editForm.qr_code_url && (
                      <div className="mt-2 p-2 bg-gray-50 border border-gray-200 rounded-lg inline-block">
                        <img src={editForm.qr_code_url} alt="QR Code Preview" className="w-20 h-20 object-contain" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingAgent(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-secondary hover:bg-secondary/90 rounded-lg font-medium transition-colors"
                >
                  {t('save_changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
