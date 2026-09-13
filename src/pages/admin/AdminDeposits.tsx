import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';
import { Check, X, Wallet, RefreshCw, Plus, ShieldCheck, Clock, ExternalLink, Trash2 } from 'lucide-react';
import { sendTelegramMessage } from '../../lib/telegram';

const CURRENCY_RATES: Record<string, number> = {
  MAD: 10.15,
  IQD: 1315.0,
  DZD: 137.5,
  TND: 3.12,
  EGP: 50.2,
  USD: 1.0,
  EUR: 0.92,
  TRY: 36.4,
  XOF: 615.0,
  SAR: 3.75,
  AED: 3.67,
};

const DEFAULT_POOL = [
  { id: 'addr_1', address: 'TL1XBetAgentOfficialTRC20DepositPool91A', network: 'TRC20', is_active: true },
  { id: 'addr_2', address: 'TK9MobCashTRC20DirectSecurePayNode22B', network: 'TRC20', is_active: true },
  { id: 'addr_3', address: 'TQ7GlobalExchangeTRC20AutomatedNode33C', network: 'TRC20', is_active: true },
  { id: 'addr_4', address: 'TE5DirectAgentDepositNetworkTRC20Node44D', network: 'TRC20', is_active: true },
];

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
    try {
      const { data } = await supabase
        .from('agent_deposits')
        .select('*, agents(full_name, currency, balance)')
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        setDeposits(data);
      } else {
        const local = JSON.parse(localStorage.getItem('agent_deposits') || '[]');
        setDeposits(local);
      }
    } catch (err) {
      const local = JSON.parse(localStorage.getItem('agent_deposits') || '[]');
      setDeposits(local);
    } finally {
      setLoading(false);
    }
  };

  const fetchAddresses = async () => {
    try {
      const { data } = await supabase
        .from('admin_usdt_addresses')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        setAddresses(data);
      } else {
        const local = JSON.parse(localStorage.getItem('admin_usdt_addresses') || '[]');
        if (local.length > 0) {
          setAddresses(local);
        } else {
          setAddresses(DEFAULT_POOL);
          localStorage.setItem('admin_usdt_addresses', JSON.stringify(DEFAULT_POOL));
        }
      }
    } catch (err) {
      const local = JSON.parse(localStorage.getItem('admin_usdt_addresses') || '[]');
      setAddresses(local.length > 0 ? local : DEFAULT_POOL);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;
    const newAddr = {
      id: `addr_${Date.now()}`,
      address: address.trim(),
      network: 'TRC20',
      is_active: true,
      created_at: new Date().toISOString(),
    };

    try {
      await supabase.from('admin_usdt_addresses').insert([newAddr]);
    } catch (e) {}

    const updated = [newAddr, ...addresses];
    setAddresses(updated);
    localStorage.setItem('admin_usdt_addresses', JSON.stringify(updated));
    setAddress('');
  };

  const handleToggleAddress = async (id: string, currentStatus: boolean) => {
    try {
      await supabase.from('admin_usdt_addresses').update({ is_active: !currentStatus }).eq('id', id);
    } catch (e) {}

    const updated = addresses.map(a => a.id === id ? { ...a, is_active: !currentStatus } : a);
    setAddresses(updated);
    localStorage.setItem('admin_usdt_addresses', JSON.stringify(updated));
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await supabase.from('admin_usdt_addresses').delete().eq('id', id);
    } catch (e) {}

    const updated = addresses.filter(a => a.id !== id);
    setAddresses(updated);
    localStorage.setItem('admin_usdt_addresses', JSON.stringify(updated));
  };

  const handleApprove = async (deposit: any) => {
    const currency = deposit.agents?.currency || 'MAD';
    const rate = CURRENCY_RATES[currency] || 1;
    const suggestedAmount = Math.round((deposit.amount_usdt * rate) * 100) / 100;

    const amountStr = window.prompt(
      `المبلغ المطلوب: ${deposit.amount_usdt} USDT\nسعر الصرف: 1 USDT = ${rate} ${currency}\n\nالمبلغ المقترح لإضافته للوكيل: ${suggestedAmount} ${currency}\n\nأدخل المبلغ النهائي بعملة الوكيل المحلية:`,
      suggestedAmount.toString()
    );

    if (!amountStr) return;
    const amountAdded = parseFloat(amountStr);
    if (isNaN(amountAdded) || amountAdded <= 0) return alert('المبلغ غير صالح');

    try {
      // 1. Update deposit status in Supabase
      try {
        await supabase
          .from('agent_deposits')
          .update({ status: 'approved', amount_added: amountAdded })
          .eq('id', deposit.id);
      } catch (e) {}

      // 2. Fetch current balance & update Supabase
      let currentBal = 0;
      try {
        const { data: agentData } = await supabase
          .from('agents')
          .select('balance')
          .eq('agent_id', deposit.agent_id)
          .single();
        currentBal = agentData?.balance ? parseFloat(agentData.balance) : 0;
        await supabase
          .from('agents')
          .update({ balance: currentBal + amountAdded })
          .eq('agent_id', deposit.agent_id);
      } catch (e) {}

      // 3. Update local storage for agents
      const localAgents = JSON.parse(localStorage.getItem('local_registered_agents') || '[]');
      const updatedAgents = localAgents.map((ag: any) => {
        if (ag.agent_id === deposit.agent_id) {
          const newBal = (parseFloat(ag.balance) || 0) + amountAdded;
          return { ...ag, balance: newBal };
        }
        return ag;
      });
      localStorage.setItem('local_registered_agents', JSON.stringify(updatedAgents));

      // 4. Update current logged-in agent session if matches
      const currentSession = JSON.parse(localStorage.getItem('mobcash_agent_session') || 'null');
      if (currentSession && currentSession.agent_id === deposit.agent_id) {
        currentSession.balance = (parseFloat(currentSession.balance) || 0) + amountAdded;
        localStorage.setItem('mobcash_agent_session', JSON.stringify(currentSession));
      }

      // 5. Broadcast instant update to all tabs/windows
      try {
        const channel = new BroadcastChannel('agent_balance_channel');
        channel.postMessage({
          agent_id: deposit.agent_id,
          amount_added: amountAdded,
          new_balance: currentBal + amountAdded,
          timestamp: Date.now(),
        });
        channel.close();
      } catch (e) {}

      localStorage.setItem('mobcash_balance_update', JSON.stringify({
        agent_id: deposit.agent_id,
        amount_added: amountAdded,
        timestamp: Date.now(),
      }));

      // 6. Update local deposit list
      const localDeposits = JSON.parse(localStorage.getItem('agent_deposits') || '[]');
      const updatedDeps = localDeposits.map((d: any) =>
        d.id === deposit.id ? { ...d, status: 'approved', amount_added: amountAdded } : d
      );
      localStorage.setItem('agent_deposits', JSON.stringify(updatedDeps));

      // 7. Send Telegram confirmation
      try {
        const msg = `✅ <b>تمت الموافقة على شحن رصيد الصرافة</b> ✅\n\n` +
                    `🆔 <b>ID الوكيل:</b> <code>${deposit.agent_id}</code>\n` +
                    `👤 <b>الاسم:</b> ${deposit.agents?.full_name || 'وكيل'}\n` +
                    `💵 <b>مبلغ USDT:</b> ${deposit.amount_usdt} USDT\n` +
                    `💰 <b>المبلغ المضاف للرصيد:</b> <b>+${amountAdded} ${currency}</b>\n` +
                    `🔗 <b>رقم العملية (TX):</b> <code>${deposit.tx_hash}</code>\n` +
                    `⏰ <b>التاريخ:</b> ${new Date().toLocaleString('ar-EG')}`;
        await sendTelegramMessage(msg);
      } catch (e) {}

      fetchDeposits();
      alert(`تمت الموافقة وإضافة ${amountAdded} ${currency} إلى رصيد الوكيل فورياً!`);
    } catch (err: any) {
      alert(err.message || 'حدث خطأ');
    }
  };

  const handleReject = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من رفض هذا الطلب؟')) return;
    try {
      await supabase.from('agent_deposits').update({ status: 'rejected' }).eq('id', id);
    } catch (e) {}

    const localDeposits = JSON.parse(localStorage.getItem('agent_deposits') || '[]');
    const updatedDeps = localDeposits.map((d: any) => d.id === id ? { ...d, status: 'rejected' } : d);
    localStorage.setItem('agent_deposits', JSON.stringify(updatedDeps));

    fetchDeposits();
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">{t('manage_deposits', 'إدارة شحن صرافة الوكلاء (USDT)')}</h1>
          <p className="text-sm text-gray-500 mt-1">
            إدارة عناوين USDT التي تدور كل 10 دقائق تلقائياً وتأكيد إيداعات الوكلاء لتحويلها لعملاتهم المحلية
          </p>
        </div>
        <button
          onClick={fetchDeposits}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors cursor-pointer w-fit"
        >
          <RefreshCw className="w-4 h-4" />
          <span>تحديث الطلبات</span>
        </button>
      </div>

      {/* Addresses Management */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">{t('usdt_addresses', 'عناوين الإيداع (USDT TRC20 Rotation Pool)')}</h2>
              <p className="text-xs text-gray-500">يتغير العنوان الظاهر للوكيل بين هذه العناوين النشطة تلقائياً كل 10 دقائق</p>
            </div>
          </div>
          <span className="text-xs font-black bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
            {addresses.filter(a => a.is_active).length} عنوان نشط
          </span>
        </div>

        <form onSubmit={handleAddAddress} className="flex gap-2">
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="أدخل عنوان USDT TRC20 جديد (يبدأ بـ T)..."
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono text-sm font-semibold"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('add', 'إضافة')}</span>
          </button>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {addresses.map((a) => (
            <div
              key={a.id}
              className={`flex items-center justify-between p-3.5 border rounded-xl transition-all ${
                a.is_active ? 'bg-emerald-50/50 border-emerald-200' : 'bg-gray-50 border-gray-200 opacity-60'
              }`}
            >
              <div className="min-w-0 flex-1 pl-3">
                <span className="text-[11px] font-bold text-gray-400 block mb-0.5">{a.network || 'TRC20'}</span>
                <span className="font-mono text-xs font-bold text-gray-800 block truncate" title={a.address}>
                  {a.address}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleAddress(a.id, a.is_active)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black cursor-pointer transition-colors ${
                    a.is_active ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  {a.is_active ? t('active', 'نشط') : t('inactive', 'معطل')}
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteAddress(a.id)}
                  className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                  title="حذف"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Deposits List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">{t('recent_deposits', 'طلبات شحن رصيد الصرافة الواردة')}</h2>
          <span className="text-xs text-gray-500 font-semibold">{deposits.length} معاملة</span>
        </div>

        {deposits.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            لا توجد طلبات إيداع حالياً
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">الوكيل</th>
                  <th className="py-3.5 px-4">مبلغ USDT</th>
                  <th className="py-3.5 px-4">رقم المعاملة (TX Hash)</th>
                  <th className="py-3.5 px-4">التاريخ</th>
                  <th className="py-3.5 px-4">الحالة</th>
                  <th className="py-3.5 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {deposits.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-gray-900">{d.agents?.full_name || 'وكيل'}</div>
                      <div className="font-mono text-xs text-gray-500 font-semibold">
                        ID: {d.agent_id} • العملة: <span className="text-blue-600 font-bold">{d.agents?.currency || 'MAD'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-black text-emerald-600 text-base">
                        {d.amount_usdt} USDT
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-xs text-gray-600 max-w-[180px] truncate" title={d.tx_hash}>
                        {d.tx_hash}
                      </div>
                      {d.receipt_url && (
                        <a
                          href={d.receipt_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-0.5"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>عرض الوصل</span>
                        </a>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-gray-500 font-mono">
                      {d.created_at ? new Date(d.created_at).toLocaleString('ar-EG') : 'الآن'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black ${
                          d.status === 'pending'
                            ? 'bg-amber-100 text-amber-700'
                            : d.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {d.status === 'pending' ? 'قيد المراجعة' : d.status === 'approved' ? 'مقبول ومضاف' : 'مرفوض'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-2">
                        {d.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(d)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                            >
                              <Check className="w-4 h-4" />
                              <span>موافقة وإضافة الرصيد</span>
                            </button>
                            <button
                              onClick={() => handleReject(d.id)}
                              className="px-2.5 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-600 rounded-xl text-xs font-black flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                              <span>رفض</span>
                            </button>
                          </>
                        )}
                        {d.status === 'approved' && (
                          <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                            +{d.amount_added || Math.round(d.amount_usdt * (CURRENCY_RATES[d.agents?.currency || 'MAD'] || 1))} {d.agents?.currency || 'MAD'}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
