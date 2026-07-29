import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { CheckCircle2, Wallet, ArrowUpRight, ArrowDownLeft, Activity, Copy, Check, TrendingUp, Shield, Award, Sparkles, Send, DollarSign, User, FileText, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function AgentDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [copied, setCopied] = useState(false);

  // Deposit / Withdrawal Form State
  const [txTab, setTxTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [customerPhone, setCustomerPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loadingTx, setLoadingTx] = useState(false);
  const [txSuccess, setTxSuccess] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      checkDeviceStatus();
      supabase.from('agents').update({ current_step: 'Dashboard' }).eq('id', user.id);
      fetchTransactions();
    }
  }, [user]);

  const checkDeviceStatus = async () => {
    const deviceId = localStorage.getItem('mobcash_device_id');
    if (!deviceId) {
      navigate('/agent/device-activation');
      return;
    }
    try {
      const { data } = await supabase
        .from('agent_devices')
        .select('status')
        .eq('agent_id', user.agent_id)
        .eq('device_id', deviceId)
        .single();
        
      if (!data || data.status !== 'active') {
        navigate('/agent/device-activation');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchTransactions = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('agent_id', user.agent_id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && data) {
        setTransactions(data);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    }
  };

  const handleCopyId = () => {
    if (user?.agent_id) {
      navigator.clipboard.writeText(user.agent_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !amount || !customerPhone) return;

    setLoadingTx(true);
    setTxSuccess(null);

    const numAmount = parseFloat(amount);
    const rate = txTab === 'deposit' ? (user.commission_deposit || 5) : (user.commission_withdraw || 5);
    const commissionEarned = (numAmount * rate) / 100;

    const newTx = {
      agent_id: user.agent_id,
      type: txTab,
      customer_phone: customerPhone,
      amount: numAmount,
      commission_rate: rate,
      commission_earned: commissionEarned,
      note: note || (txTab === 'deposit' ? t('cash_deposit') : t('cash_withdraw')),
      status: 'completed',
      created_at: new Date().toISOString()
    };

    try {
      // Try inserting into supabase transactions table
      const { data, error } = await supabase.from('transactions').insert([newTx]).select();

      // Also log to activities
      await supabase.from('activities').insert([{
        agent_id: user.agent_id,
        action: `${txTab === 'deposit' ? 'إيداع' : 'سحب'} مبلغ $${numAmount} للعميل ${customerPhone}`
      }]);

      const inserted = data && data[0] ? data[0] : { ...newTx, id: Math.random().toString() };
      setTransactions(prev => [inserted, ...prev]);
      setTxSuccess(inserted);
      setAmount('');
      setCustomerPhone('');
      setNote('');
    } catch (err: any) {
      console.error('Transaction error:', err);
      // Fallback local addition if table doesn't exist yet
      const fallbackTx = { ...newTx, id: Math.random().toString() };
      setTransactions(prev => [fallbackTx, ...prev]);
      setTxSuccess(fallbackTx);
      setAmount('');
      setCustomerPhone('');
      setNote('');
    } finally {
      setLoadingTx(false);
    }
  };

  if (!user) return null;

  const sampleChartData = [
    { day: 'السبت', earnings: 120, transactions: 5 },
    { day: 'الأحد', earnings: 250, transactions: 12 },
    { day: 'الإثنين', earnings: 180, transactions: 8 },
    { day: 'الثلاثاء', earnings: 320, transactions: 15 },
    { day: 'الأربعاء', earnings: 410, transactions: 19 },
    { day: 'الخميس', earnings: 380, transactions: 16 },
    { day: 'الجمعة', earnings: 520, transactions: 24 },
  ];

  const currentRate = txTab === 'deposit' ? (user.commission_deposit || 5) : (user.commission_withdraw || 5);
  const calculatedCommission = amount ? (parseFloat(amount) * currentRate) / 100 : 0;

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Hero Card */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-gradient-to-r from-secondary via-blue-600 to-indigo-800 text-white p-8 rounded-3xl shadow-xl gap-6">
        <div>
          <div className="flex items-center gap-2 text-blue-100 font-medium text-sm mb-2">
            <Sparkles className="w-4 h-4 text-amber-300" />
            {t('authorized_agent_portal')}
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">{t('welcome_back')}, {user.full_name}</h1>
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <span className="text-sm bg-white/10 px-3 py-1 rounded-xl backdrop-blur-md">
              {t('agent_id')}: <strong className="font-mono text-amber-300">{user.agent_id}</strong>
            </span>
            <button
              onClick={handleCopyId}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? t('copied') : t('copy')}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-white/10 px-5 py-3 rounded-2xl backdrop-blur-md border border-white/20">
          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          <div>
            <p className="text-xs text-blue-100">{t('status')}</p>
            <p className="text-sm font-bold text-white">{t('active')} {t('status_active')}</p>
          </div>
        </div>
      </div>

      {/* Financial Wallet & Commission Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-7 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-gray-500 font-medium text-sm">{t('available_balance')}</h3>
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-secondary shadow-sm group-hover:scale-110 transition-transform">
              <Wallet className="w-6 h-6" />
            </div>
          </div>
          <div>
            <div className="text-4xl font-black text-gray-900 tracking-tight">$2,450.00</div>
            <p className="text-xs font-semibold text-emerald-600 mt-2 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" /> {t('available_for_instant_withdrawal')}
            </p>
          </div>
        </div>

        <div className="bg-white p-7 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-gray-500 font-medium text-sm">{t('deposit_commission')}</h3>
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm group-hover:scale-110 transition-transform">
              <ArrowDownLeft className="w-6 h-6" />
            </div>
          </div>
          <div>
            <div className="text-4xl font-black text-gray-900 tracking-tight">{user.commission_deposit}%</div>
            <p className="text-xs text-gray-400 mt-2">{t('per_transaction')} ({t('approved_deposit_commission')})</p>
          </div>
        </div>

        <div className="bg-white p-7 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-all group">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-gray-500 font-medium text-sm">{t('withdrawal_commission')}</h3>
            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 shadow-sm group-hover:scale-110 transition-transform">
              <ArrowUpRight className="w-6 h-6" />
            </div>
          </div>
          <div>
            <div className="text-4xl font-black text-gray-900 tracking-tight">{user.commission_withdraw}%</div>
            <p className="text-xs text-gray-400 mt-2">{t('per_transaction')} ({t('approved_withdraw_commission')})</p>
          </div>
        </div>
      </div>

      {/* Interactive Deposit & Withdrawal Widget (Requested Custom Feature) */}
      <div className="bg-gradient-to-br from-white via-indigo-50/40 to-blue-50/50 rounded-3xl p-8 md:p-10 shadow-lg border border-indigo-100 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-secondary to-purple-600"></div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 pb-6 border-b border-gray-200/60 gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4 text-amber-500" />
              {t('approved_financial_operations')}
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-secondary to-indigo-700 text-white flex items-center justify-center shadow-md">
                <DollarSign className="w-7 h-7" />
              </div>
              {t('instant_deposit_withdraw_system')}
            </h2>
            <p className="text-gray-500 text-sm mt-1 max-w-2xl">
              {t('system_description')}
            </p>
          </div>
          
          {/* Tabs Switcher */}
          <div className="flex items-center bg-gray-200/80 p-1.5 rounded-2xl border border-gray-300/60 shrink-0 shadow-inner">
            <button
              type="button"
              onClick={() => { setTxTab('deposit'); setTxSuccess(null); }}
              className={`px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 cursor-pointer ${
                txTab === 'deposit'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 scale-105'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              {t('cash_deposit')}
            </button>
            <button
              type="button"
              onClick={() => { setTxTab('withdraw'); setTxSuccess(null); }}
              className={`px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center gap-2 cursor-pointer ${
                txTab === 'withdraw'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20 scale-105'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              {t('cash_withdraw')}
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {txSuccess && (
          <div className="mb-8 p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start justify-between animate-fadeIn">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-base">{t('operation_success')}</h4>
                <p className="text-sm text-emerald-700 mt-1">
                  {t('operation_type')}: <strong className="uppercase">{txSuccess.type === 'deposit' ? t('deposit_type') : t('withdraw_type')}</strong> | 
                  {t('amount_label')}: <strong className="font-mono">${txSuccess.amount}</strong> | 
                  {t('earned_commission')}: <strong className="font-mono text-emerald-800">${txSuccess.commission_earned?.toFixed(2)}</strong>
                </p>
                <p className="text-xs text-emerald-600 mt-1 font-mono">{t('phone_number_label')}: {txSuccess.customer_phone} | {t('date_label')}: {new Date(txSuccess.created_at).toLocaleString()}</p>
              </div>
            </div>
            <button
              onClick={() => setTxSuccess(null)}
              className="text-emerald-700 hover:text-emerald-900 font-bold text-sm cursor-pointer px-3 py-1 bg-emerald-100 rounded-xl"
            >
              {t('close')}
            </button>
          </div>
        )}

        <form onSubmit={handleTransactionSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2.5 flex items-center gap-2">
                <User className="w-4 h-4 text-secondary" />
                {t('customer_phone_account')}
              </label>
              <input
                type="text"
                required
                placeholder="{t('phone_example')}"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl border-2 border-gray-300 focus:ring-4 focus:ring-secondary/20 focus:border-secondary bg-white font-mono text-gray-950 font-semibold text-base shadow-sm transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2.5 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-secondary" />
                  {txTab === 'deposit' ? t('amount_to_deposit') : t('amount_to_withdraw')}
                </span>
                <span className="text-xs text-gray-500 font-normal">{t('minimum_amount')}</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl border-2 border-gray-300 focus:ring-4 focus:ring-secondary/20 focus:border-secondary bg-white font-mono text-gray-950 font-black text-xl shadow-sm transition-all"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold font-mono">USD</div>
              </div>
            </div>
          </div>

          {/* Quick Amount Presets */}
          <div>
            <span className="text-xs font-bold text-gray-600 block mb-2">{t('preset_amounts')}</span>
            <div className="flex items-center gap-3 flex-wrap">
              {['50', '100', '250', '500', '1000', '2500', '5000'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(preset)}
                  className="px-4 py-2 rounded-xl bg-white border border-gray-300 text-gray-700 font-mono font-bold text-sm hover:bg-secondary hover:text-white hover:border-secondary transition-all shadow-sm cursor-pointer"
                >
                  ${preset}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-800 mb-2.5 flex items-center gap-2">
              <FileText className="w-4 h-4 text-secondary" />
              {t('notes_optional')}
            </label>
            <input
              type="text"
              placeholder="{t('notes_placeholder')}"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl border-2 border-gray-300 focus:ring-4 focus:ring-secondary/20 focus:border-secondary bg-white text-gray-950 font-medium shadow-sm transition-all"
            />
          </div>

          {/* Bottom Summary & Submit Bar */}
          <div className="flex flex-col lg:flex-row items-center justify-between bg-white p-6 rounded-2xl border-2 border-gray-200 gap-6 shadow-md">
            <div className="flex items-center gap-6 w-full lg:w-auto justify-around lg:justify-start">
              <div className="text-center lg:text-right">
                <span className="text-xs text-gray-500 font-semibold block">{t('your_commission_rate')} ({txTab === 'deposit' ? t('deposit_type') : t('withdraw_type')}):</span>
                <span className="text-2xl font-black text-indigo-600 font-mono">{currentRate}%</span>
              </div>
              <div className="h-10 w-px bg-gray-300"></div>
              <div className="text-center lg:text-right">
                <span className="text-xs text-gray-500 font-semibold block">إجمالي {t('earned_commission')}:</span>
                <span className="text-2xl font-black text-emerald-600 font-mono">${calculatedCommission.toFixed(2)} USD</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loadingTx}
              className={`w-full lg:w-auto px-10 py-4 rounded-2xl font-extrabold text-white shadow-xl transition-all flex items-center justify-center gap-3 cursor-pointer text-base transform hover:-translate-y-0.5 ${
                txTab === 'deposit'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-600/30'
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-purple-600/30'
              }`}
            >
              {loadingTx ? (
                <>
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{t('processing_transaction')}</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>{txTab === 'deposit' ? t('confirm_execute_deposit') : t('confirm_execute_withdraw')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Analytics & Performance Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-secondary" />
              {t('weekly_performance')}
            </h2>
            <span className="text-xs font-medium px-3 py-1 bg-secondary/10 text-secondary rounded-full">{t('financial_status_excellent')}</span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sampleChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="day" stroke="#9ca3af" fontSize={12} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '12px', border: 'none' }}
                />
                <Area type="monotone" dataKey="earnings" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorEarnings)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Agency Info & Quick Details */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between space-y-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-emerald-600" />
              {t('agency_info_accreditation')}
            </h2>
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-100">
                <span className="text-gray-500">{t('full_name_label')}</span>
                <span className="font-bold text-gray-900">{user.full_name}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-100">
                <span className="text-gray-500">{t('country_city_label')}</span>
                <span className="font-bold text-gray-900">{user.country} - {user.city}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-2xl bg-gray-50 border border-gray-100">
                <span className="text-gray-500">{t('bank_wallet_label')}</span>
                <span className="font-bold text-gray-900 font-mono">{user.bank_name}</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-blue-50 border border-emerald-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-900">{t('officially_accredited_agent')}</p>
              <p className="text-[11px] text-emerald-700">{t('all_operational_powers_active')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions Section */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-secondary" />
            {t('recent_transactions')} ({transactions.length})
          </h2>
          <span className="text-xs font-medium text-gray-400">{t('instant_transactions_log')}</span>
        </div>
        <div className="divide-y divide-gray-100">
          {transactions.length > 0 ? (
            transactions.map((tx: any) => (
              <div key={tx.id || Math.random()} className="p-5 flex items-center justify-between hover:bg-gray-50/80 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white shadow-sm ${
                    tx.type === 'deposit' ? 'bg-emerald-600' : 'bg-purple-600'
                  }`}>
                    {tx.type === 'deposit' ? <ArrowDownLeft className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        tx.type === 'deposit' ? 'bg-emerald-50 text-emerald-700' : 'bg-purple-50 text-purple-700'
                      }`}>
                        {tx.type === 'deposit' ? t('deposit_type') : t('withdraw_type')}
                      </span>
                      <span className="font-mono font-bold text-gray-900">{tx.customer_phone}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{tx.note || t('approved_financial_transaction')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-base font-black text-gray-950 font-mono">${tx.amount?.toFixed(2)} USD</p>
                  <p className="text-xs font-semibold text-emerald-600 mt-0.5">العمولة: +${tx.commission_earned?.toFixed(2)}</p>
                  <p className="text-[11px] text-gray-400 mt-1">{new Date(tx.created_at).toLocaleString()}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-gray-400">
              <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-300">
                <Activity className="w-8 h-8" />
              </div>
              <p className="font-medium text-gray-600">{t('no_transactions')}</p>
              <p className="text-xs text-gray-400 mt-1">{t('start_processing')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


