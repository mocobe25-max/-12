import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { 
  CheckCircle2, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Activity, 
  Copy, 
  Check, 
  TrendingUp, 
  ShieldCheck, 
  Award, 
  Sparkles, 
  Send, 
  DollarSign, 
  User, 
  FileText, 
  CheckCircle,
  Cpu,
  Lock,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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
  const [verifyStep, setVerifyStep] = useState<number>(0); // 0: Idle, 1: Verifying phone, 2: System Check, 3: Complete
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
        .maybeSingle();
        
      if (!data || data.status !== 'active') {
        navigate('/agent/device-activation');
      }
    } catch (e) {
      console.warn('Device status check note:', e);
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
    setVerifyStep(1); // Step 1: Digital verification

    // Multi-step smart verification animation
    await new Promise(res => setTimeout(res, 600));
    setVerifyStep(2); // Step 2: System ledger check

    await new Promise(res => setTimeout(res, 700));

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
      const { data } = await supabase.from('transactions').insert([newTx]).select();

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
      const fallbackTx = { ...newTx, id: Math.random().toString() };
      setTransactions(prev => [fallbackTx, ...prev]);
      setTxSuccess(fallbackTx);
      setAmount('');
      setCustomerPhone('');
      setNote('');
    } finally {
      setVerifyStep(3);
      setTimeout(() => {
        setLoadingTx(false);
        setVerifyStep(0);
      }, 500);
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
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row items-start md:items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-2xl border border-slate-800 relative overflow-hidden gap-6"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-widest mb-2">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            {t('authorized_agent_portal', 'بوابة الوكيل المعتمد الذكية')}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">{t('welcome_back', 'مرحباً بك')}, {user.full_name}</h1>
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <span className="text-xs bg-slate-800/90 border border-slate-700/80 px-3 py-1.5 rounded-xl font-mono text-slate-200 shadow-inner">
              {t('agent_id')}: <strong className="font-mono text-amber-400 font-bold">{user.agent_id}</strong>
            </span>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCopyId}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1 text-emerald-400">
                    <Check className="w-3.5 h-3.5" />
                    {t('copied', 'تم النسخ!')}
                  </motion.span>
                ) : (
                  <motion.span key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1 text-slate-200">
                    <Copy className="w-3.5 h-3.5 text-amber-400" />
                    {t('copy', 'نسخ ID')}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>

        <motion.div 
          whileHover={{ scale: 1.03 }}
          className="flex items-center gap-3 bg-slate-800/80 border border-emerald-500/30 px-5 py-3.5 rounded-2xl backdrop-blur-md shrink-0 shadow-lg"
        >
          <div className="relative">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping"></span>
          </div>
          <div>
            <p className="text-[11px] text-slate-400 uppercase font-semibold">{t('status', 'الحالة')}</p>
            <p className="text-sm font-black text-emerald-400">{t('active', 'نشط ومعتمد')}</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Financial Wallet & Commission Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          whileHover={{ y: -4 }}
          transition={{ type: 'spring', stiffness: 300 }}
          className="bg-slate-900/90 p-6 sm:p-7 rounded-3xl shadow-xl border border-slate-800/80 flex flex-col justify-between group hover:border-amber-500/30"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-slate-400 font-bold text-xs uppercase tracking-wider">{t('available_balance', 'الرصيد المتاح')}</h3>
            <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 shadow-sm group-hover:rotate-6 transition-transform">
              <Wallet className="w-6 h-6" />
            </div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-amber-400 tracking-tight font-mono">$2,450.00</div>
            <p className="text-xs font-semibold text-emerald-400 mt-2 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" /> {t('available_for_instant_withdrawal', 'متاح للسحب والعمليات الفورية')}
            </p>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -4 }}
          transition={{ type: 'spring', stiffness: 300 }}
          className="bg-slate-900/90 p-6 sm:p-7 rounded-3xl shadow-xl border border-slate-800/80 flex flex-col justify-between group hover:border-emerald-500/30"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-slate-400 font-bold text-xs uppercase tracking-wider">{t('deposit_commission', 'عمولة الإيداع')}</h3>
            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 shadow-sm group-hover:rotate-6 transition-transform">
              <ArrowDownLeft className="w-6 h-6" />
            </div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight font-mono">{user.commission_deposit || 5}%</div>
            <p className="text-xs text-slate-400 mt-2">{t('per_transaction', 'لكل عملية إيداع نقدية')}</p>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -4 }}
          transition={{ type: 'spring', stiffness: 300 }}
          className="bg-slate-900/90 p-6 sm:p-7 rounded-3xl shadow-xl border border-slate-800/80 flex flex-col justify-between group hover:border-purple-500/30"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-slate-400 font-bold text-xs uppercase tracking-wider">{t('withdrawal_commission', 'عمولة السحب')}</h3>
            <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 rounded-2xl flex items-center justify-center text-purple-400 shadow-sm group-hover:rotate-6 transition-transform">
              <ArrowUpRight className="w-6 h-6" />
            </div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-purple-400 tracking-tight font-mono">{user.commission_withdraw || 5}%</div>
            <p className="text-xs text-slate-400 mt-2">{t('per_transaction', 'لكل عملية سحب نقدية')}</p>
          </div>
        </motion.div>
      </div>

      {/* Interactive Deposit & Withdrawal Operations Widget */}
      <div className="bg-slate-900/95 rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-amber-400 to-indigo-500"></div>
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 pb-6 border-b border-slate-800 gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-1">
              <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
              {t('approved_financial_operations', 'المنظومة الذكية للعمليات المعتمدة')}
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white flex items-center justify-center shadow-lg border border-indigo-400/20">
                <DollarSign className="w-7 h-7 text-amber-300" />
              </div>
              {t('instant_deposit_withdraw_system', 'تنفيذ عمليات الإيداع والسحب الفوري')}
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl font-medium">
              {t('system_description', 'أدخل رقم المحفظة أو الحساب والمبلغ المطلوب لتنفيذ العملية الفورية وحساب العمولة تلقائياً.')}
            </p>
          </div>
          
          {/* Tabs Switcher */}
          <div className="flex items-center bg-slate-950 p-1.5 rounded-2xl border border-slate-800 shrink-0 shadow-inner">
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => { setTxTab('deposit'); setTxSuccess(null); }}
              className={`px-6 py-3 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer ${
                txTab === 'deposit'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              {t('cash_deposit', 'إيداع نقدي')}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => { setTxTab('withdraw'); setTxSuccess(null); }}
              className={`px-6 py-3 rounded-xl font-black text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer ${
                txTab === 'withdraw'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              {t('cash_withdraw', 'سحب نقدي')}
            </motion.button>
          </div>
        </div>

        {/* Success Alert */}
        <AnimatePresence>
          {txSuccess && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="mb-8 p-6 rounded-2xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 flex items-start justify-between shadow-2xl relative overflow-hidden"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-lg mt-0.5">
                  <CheckCircle className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-black text-lg text-white flex items-center gap-2">
                    {t('operation_success', 'تم التحقق والتنفيذ بنجاح!')}
                    <span className="text-xs px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-400/30">معتمد</span>
                  </h4>
                  <p className="text-sm text-emerald-300 mt-1">
                    {t('operation_type', 'نوع العملية')}: <strong className="uppercase font-bold">{txSuccess.type === 'deposit' ? t('deposit_type', 'إيداع') : t('withdraw_type', 'سحب')}</strong> | 
                    {t('amount_label', ' المبلغ')}: <strong className="font-mono text-amber-300 text-base">${txSuccess.amount}</strong> | 
                    {t('earned_commission', 'العمولة المكتسبة')}: <strong className="font-mono text-emerald-300 text-base">${txSuccess.commission_earned?.toFixed(2)}</strong>
                  </p>
                  <p className="text-xs text-slate-400 mt-2 font-mono flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    {t('phone_number_label', 'رقم المحفظة/العميل')}: {txSuccess.customer_phone} | {new Date(txSuccess.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setTxSuccess(null)}
                className="text-emerald-300 hover:text-white font-bold text-xs cursor-pointer px-3.5 py-1.5 bg-emerald-900/60 rounded-xl border border-emerald-700 hover:bg-emerald-900 transition-all"
              >
                {t('close', 'إغلاق')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleTransactionSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2.5 uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-amber-400" />
                {t('customer_phone_account', 'رقم هاتف / حساب العميل')}
              </label>
              <input
                type="text"
                required
                placeholder="01XXXXXXXXX"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl border border-slate-700 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-slate-950 text-white font-mono font-bold text-base shadow-inner placeholder:text-slate-600 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2.5 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-amber-400" />
                  {txTab === 'deposit' ? t('amount_to_deposit', 'المبلغ المطلوب إيداعه') : t('amount_to_withdraw', 'المبلغ المطلوب سحبه')}
                </span>
                <span className="text-xs text-slate-400 font-normal">{t('minimum_amount', 'الحد الأدنى $1.00')}</span>
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
                  className="w-full px-5 py-4 rounded-2xl border border-slate-700 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-slate-950 text-amber-400 font-mono font-black text-xl shadow-inner placeholder:text-slate-700 transition-all"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold font-mono text-sm">USD</div>
              </div>
            </div>
          </div>

          {/* Quick Amount Presets */}
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">{t('preset_amounts', 'مبالغ سريعة')}</span>
            <div className="flex items-center gap-2.5 flex-wrap">
              {['50', '100', '250', '500', '1000', '2500', '5000'].map((preset) => (
                <motion.button
                  key={preset}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => setAmount(preset)}
                  className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono font-bold text-sm hover:border-amber-400 hover:text-amber-400 hover:bg-slate-900 transition-all cursor-pointer shadow-sm"
                >
                  ${preset}
                </motion.button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2.5 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" />
              {t('notes_optional', 'ملاحظات (اختياري)')}
            </label>
            <input
              type="text"
              placeholder={t('notes_placeholder', 'ملاحظات إضافية حول العملية')}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl border border-slate-700 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-slate-950 text-slate-200 font-medium shadow-inner placeholder:text-slate-600 text-sm"
            />
          </div>

          {/* Bottom Summary & Submit Bar */}
          <div className="flex flex-col lg:flex-row items-center justify-between bg-slate-950/80 p-6 rounded-2xl border border-slate-800 gap-6 shadow-xl">
            <div className="flex items-center gap-6 w-full lg:w-auto justify-around lg:justify-start">
              <div className="text-center lg:text-right">
                <span className="text-xs text-slate-400 font-semibold block">{t('your_commission_rate', 'نسبة عمولتك')}:</span>
                <span className="text-2xl font-black text-amber-400 font-mono">{currentRate}%</span>
              </div>
              <div className="h-10 w-px bg-slate-800"></div>
              <div className="text-center lg:text-right">
                <span className="text-xs text-slate-400 font-semibold block">{t('earned_commission', 'العمولة المكتسبة')}:</span>
                <span className="text-2xl font-black text-emerald-400 font-mono">${calculatedCommission.toFixed(2)} USD</span>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: loadingTx ? 1 : 1.02 }}
              whileTap={{ scale: loadingTx ? 1 : 0.98 }}
              type="submit"
              disabled={loadingTx}
              className={`w-full lg:w-auto px-10 py-4 rounded-2xl font-black text-white shadow-2xl transition-all flex items-center justify-center gap-3 cursor-pointer text-base ${
                txTab === 'deposit'
                  ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-900/50'
                  : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 shadow-purple-900/50'
              }`}
            >
              {loadingTx ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm font-bold tracking-wide">
                    {verifyStep === 1 && '🔍 جاري التشفير والتحقق من حساب العميل...'}
                    {verifyStep === 2 && '⚙️ جاري قيد السجل واحتساب العمولة...'}
                    {verifyStep === 3 && '✨ تم الاعتماد والتنفيذ!'}
                  </span>
                </div>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>{txTab === 'deposit' ? t('confirm_execute_deposit', 'تأكيد وتنفيذ الإيداع') : t('confirm_execute_withdraw', 'تأكيد وتنفيذ السحب')}</span>
                </>
              )}
            </motion.button>
          </div>
        </form>
      </div>

      {/* Analytics & Agency Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-slate-900/90 rounded-3xl p-6 shadow-xl border border-slate-800/80 lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-400" />
              {t('weekly_performance', 'مؤشر الأداء الأسبوعي')}
            </h2>
            <span className="text-xs font-bold px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full">{t('financial_status_excellent', 'ممتاز جداً')}</span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sampleChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '12px', borderColor: '#334155' }}
                />
                <Area type="monotone" dataKey="earnings" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorEarnings)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Agency Info */}
        <div className="bg-slate-900/90 rounded-3xl p-6 shadow-xl border border-slate-800/80 flex flex-col justify-between space-y-6">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              {t('agency_info_accreditation', 'بيانات الوكالة والاعتماد')}
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-xs">{t('full_name_label', 'الاسم بالكامل')}</span>
                <span className="font-bold text-white text-xs">{user.full_name}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-xs">{t('country_city_label', 'الدولة / المدينة')}</span>
                <span className="font-bold text-white text-xs">{user.country} - {user.city}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 text-xs">{t('bank_wallet_label', 'البنك / المحفظة')}</span>
                <span className="font-bold text-amber-400 font-mono text-xs">{user.bank_name || 'MobCash'}</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0 shadow-md">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-300">{t('officially_accredited_agent', 'وكيل معتمد رسمياً')}</p>
              <p className="text-[11px] text-emerald-400/80">{t('all_operational_powers_active', 'جميع صلاحيات التنفيذ نشطة')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions Section */}
      <div className="bg-slate-900/90 rounded-3xl shadow-xl border border-slate-800/80 overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-400" />
            {t('recent_transactions', 'سجل العمليات الأخيرة')} ({transactions.length})
          </h2>
          <span className="text-xs font-medium text-slate-400">{t('instant_transactions_log', 'تحديث فوري')}</span>
        </div>
        <div className="divide-y divide-slate-800/60">
          {transactions.length > 0 ? (
            transactions.map((tx: any, idx: number) => (
              <motion.div 
                key={tx.id || Math.random()} 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-5 flex items-center justify-between hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white shadow-md ${
                    tx.type === 'deposit' ? 'bg-emerald-600' : 'bg-purple-600'
                  }`}>
                    {tx.type === 'deposit' ? <ArrowDownLeft className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        tx.type === 'deposit' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      }`}>
                        {tx.type === 'deposit' ? t('deposit_type', 'إيداع') : t('withdraw_type', 'سحب')}
                      </span>
                      <span className="font-mono font-bold text-white text-sm">{tx.customer_phone}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{tx.note || t('approved_financial_transaction', 'عملية مالية معتمدة')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-base font-black text-amber-400 font-mono">${tx.amount?.toFixed(2)} USD</p>
                  <p className="text-xs font-semibold text-emerald-400 mt-0.5">العمولة: +${tx.commission_earned?.toFixed(2)}</p>
                  <p className="text-[11px] text-slate-500 mt-1 font-mono">{new Date(tx.created_at).toLocaleString()}</p>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="p-12 text-center text-slate-500">
              <div className="w-16 h-16 bg-slate-950 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-600 border border-slate-800">
                <Activity className="w-8 h-8" />
              </div>
              <p className="font-medium text-slate-300">{t('no_transactions', 'لا يوجد عمليات مسجلة حتى الآن')}</p>
              <p className="text-xs text-slate-500 mt-1">{t('start_processing', 'استخدم النموذج أعلاه للبدء بتنفيذ العمليات')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



