import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';
import { Check, X, Wallet, RefreshCw } from 'lucide-react';

export default function AdminDeposits() {
  const { t } = useTranslation();
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState('');
  const [addresses, setAddresses] = useState<any[]>([]);

  useEffect(() => {
    fetchDeposits();
    fetchAddresses();
  }, []);

  const fetchDeposits = async () => {
    setLoading(true);
    const { data } = await supabase.from('agent_deposits').select('*, agents(full_name, currency)').order('created_at', { ascending: false });
    if (data) setDeposits(data);
    setLoading(false);
  };

  const fetchAddresses = async () => {
    const { data } = await supabase.from('admin_usdt_addresses').select('*').order('created_at', { ascending: false });
    if (data) setAddresses(data);
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;
    await supabase.from('admin_usdt_addresses').insert([{ address: address.trim(), network: 'TRC20', is_active: true }]);
    setAddress('');
    fetchAddresses();
  };

  const handleToggleAddress = async (id: string, currentStatus: boolean) => {
    await supabase.from('admin_usdt_addresses').update({ is_active: !currentStatus }).eq('id', id);
    fetchAddresses();
  };

  const handleApprove = async (deposit: any) => {
    const amountStr = window.prompt(t('enter_local_amount', 'أدخل المبلغ بعملة الوكيل المحلية الذي سيتم إضافته لرصيده:'));
    if (!amountStr) return;
    const amountAdded = parseFloat(amountStr);
    if (isNaN(amountAdded) || amountAdded <= 0) return alert('Invalid amount');
    
    // Update deposit status
    await supabase.from('agent_deposits').update({ status: 'approved', amount_added: amountAdded }).eq('id', deposit.id);
    
    // Update agent balance
    const { data: agentData } = await supabase.from('agents').select('balance').eq('agent_id', deposit.agent_id).single();
    const currentBal = agentData?.balance ? parseFloat(agentData.balance) : 0;
    await supabase.from('agents').update({ balance: currentBal + amountAdded }).eq('agent_id', deposit.agent_id);
    
    fetchDeposits();
  };

  const handleReject = async (id: string) => {
    if (!window.confirm('Are you sure you want to reject this deposit?')) return;
    await supabase.from('agent_deposits').update({ status: 'rejected' }).eq('id', id);
    fetchDeposits();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">{t('manage_deposits', 'إدارة إيداعات الوكلاء')}</h1>
      
      {/* Addresses Management */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-bold mb-4">{t('usdt_addresses', 'عناوين الإيداع (USDT TRC20)')}</h2>
        <form onSubmit={handleAddAddress} className="flex gap-2 mb-4">
          <input 
            type="text" 
            value={address} 
            onChange={e => setAddress(e.target.value)} 
            placeholder="T..." 
            className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm" 
          />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold">{t('add', 'إضافة')}</button>
        </form>
        <div className="space-y-2">
          {addresses.map(a => (
            <div key={a.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
              <span className="font-mono text-sm break-all">{a.address}</span>
              <button 
                onClick={() => handleToggleAddress(a.id, a.is_active)}
                className={`px-3 py-1 rounded-md text-xs font-bold ${a.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'}`}
              >
                {a.is_active ? t('active', 'نشط') : t('inactive', 'غير نشط')}
              </button>
            </div>
          ))}
        </div>
      </div>
      
      {/* Deposits List */}
      <div className="bg-white rounded-xl shadow-sm border p-6 overflow-x-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">{t('recent_deposits', 'الطلبات الأخيرة')}</h2>
          <button onClick={fetchDeposits} className="p-2 hover:bg-gray-100 rounded-full"><RefreshCw className="w-5 h-5 text-gray-500" /></button>
        </div>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b text-gray-500">
              <th className="pb-2">Agent</th>
              <th className="pb-2">USDT Amount</th>
              <th className="pb-2">TX Hash</th>
              <th className="pb-2">Status</th>
              <th className="pb-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {deposits.map(d => (
              <tr key={d.id} className="border-b last:border-0">
                <td className="py-3">
                  <div className="font-bold">{d.agents?.full_name}</div>
                  <div className="text-xs text-gray-500">{d.agent_id}</div>
                </td>
                <td className="py-3 font-bold text-blue-600">{d.amount_usdt} USDT</td>
                <td className="py-3 font-mono text-xs max-w-[150px] truncate" title={d.tx_hash}>{d.tx_hash}</td>
                <td className="py-3">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${d.status === 'pending' ? 'bg-amber-100 text-amber-700' : d.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    {d.status}
                  </span>
                </td>
                <td className="py-3 flex items-center gap-2">
                  {d.status === 'pending' && (
                    <>
                      <button onClick={() => handleApprove(d)} className="p-1.5 bg-emerald-100 text-emerald-600 rounded hover:bg-emerald-200"><Check className="w-4 h-4" /></button>
                      <button onClick={() => handleReject(d.id)} className="p-1.5 bg-rose-100 text-rose-600 rounded hover:bg-rose-200"><X className="w-4 h-4" /></button>
                    </>
                  )}
                  {d.status === 'approved' && d.amount_added && (
                    <span className="text-xs font-bold text-gray-500">+{d.amount_added} {d.agents?.currency}</span>
                  )}
                </td>
              </tr>
            ))}
            {deposits.length === 0 && (
              <tr><td colSpan={5} className="py-4 text-center text-gray-500">No deposits found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
