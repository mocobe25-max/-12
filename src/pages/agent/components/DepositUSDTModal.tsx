import React, { useState, useEffect, useMemo } from 'react';
import { X, Copy, Check, UploadCloud, Clock, RefreshCw, QrCode, ArrowRight, ShieldCheck, DollarSign } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../../lib/supabase';
import { sendTelegramMessage, getIpAddress, getLocationInfo } from '../../../lib/telegram';

interface DepositUSDTModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  user: any;
  onDepositSuccess?: () => void;
}

const DEFAULT_ACTIVE_ADDRESSES = [
  { id: 'addr_1', address: 'TL1XBetAgentOfficialTRC20DepositPool91A', network: 'TRC20' },
  { id: 'addr_2', address: 'TK9MobCashTRC20DirectSecurePayNode22B', network: 'TRC20' },
  { id: 'addr_3', address: 'TQ7GlobalExchangeTRC20AutomatedNode33C', network: 'TRC20' },
  { id: 'addr_4', address: 'TE5DirectAgentDepositNetworkTRC20Node44D', network: 'TRC20' },
];

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

export const DepositUSDTModal: React.FC<DepositUSDTModalProps> = ({
  isOpen,
  onClose,
  isDark,
  user,
  onDepositSuccess,
}) => {
  const { t, i18n } = useTranslation();
  const [amount, setAmount] = useState('');
  const [txHash, setTxHash] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [activeAddresses, setActiveAddresses] = useState<any[]>(DEFAULT_ACTIVE_ADDRESSES);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(600);

  // 10-Minute Address Rotation Calculation
  useEffect(() => {
    if (!isOpen) return;

    const calculateRotation = () => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = 600 - (now % 600);
      setSecondsRemaining(remaining);
    };

    calculateRotation();
    const interval = setInterval(calculateRotation, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Load configured addresses from DB or localStorage
  useEffect(() => {
    if (!isOpen) return;

    const loadAddresses = async () => {
      try {
        const { data, error } = await supabase
          .from('admin_usdt_addresses')
          .select('*')
          .eq('is_active', true);

        if (!error && data && data.length > 0) {
          setActiveAddresses(data);
        } else {
          // Check local storage fallback
          const local = JSON.parse(localStorage.getItem('admin_usdt_addresses') || '[]');
          const activeLocal = local.filter((a: any) => a.is_active !== false);
          if (activeLocal.length > 0) {
            setActiveAddresses(activeLocal);
          } else {
            setActiveAddresses(DEFAULT_ACTIVE_ADDRESSES);
          }
        }
      } catch (err) {
        setActiveAddresses(DEFAULT_ACTIVE_ADDRESSES);
      }
    };

    loadAddresses();
  }, [isOpen]);

  // Current Address rotated based on 10-minute block
  const currentAddressObj = useMemo(() => {
    if (!activeAddresses || activeAddresses.length === 0) {
      return DEFAULT_ACTIVE_ADDRESSES[0];
    }
    const tenMinBlock = Math.floor(Date.now() / (10 * 60 * 1000));
    const index = tenMinBlock % activeAddresses.length;
    return activeAddresses[index] || activeAddresses[0];
  }, [activeAddresses, secondsRemaining]);

  const currentAddress = currentAddressObj.address;
  const currentNetwork = currentAddressObj.network || 'TRC20';

  // Currency & conversion rate
  const agentCurrency = user?.currency || 'MAD';
  const exchangeRate = CURRENCY_RATES[agentCurrency] || 1.0;
  const numAmount = parseFloat(amount) || 0;
  const estimatedLocalAmount = numAmount * exchangeRate;

  // Format mm:ss
  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setScreenshotUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || numAmount <= 0) {
      setError('يرجى إدخال مبلغ صحيح');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const depositRecord = {
        agent_id: user?.agent_id,
        amount_usdt: numAmount,
        tx_hash: txHash.trim() || `TX-${Date.now().toString(36).toUpperCase()}`,
        status: 'pending',
        receipt_url: screenshotUrl || null,
        created_at: new Date().toISOString(),
      };

      // Try Supabase insert
      try {
        await supabase.from('agent_deposits').insert([depositRecord]);
      } catch (err) {
        console.warn('Supabase agent_deposits fallback:', err);
      }

      // Save to local storage
      try {
        const local = JSON.parse(localStorage.getItem('agent_deposits') || '[]');
        local.unshift({
          ...depositRecord,
          id: `dep_${Date.now()}`,
          agents: { full_name: user?.full_name, currency: agentCurrency },
        });
        localStorage.setItem('agent_deposits', JSON.stringify(local));
      } catch (e) {}

      // Send Instant Telegram Notification to Admin
      try {
        const ip = await getIpAddress();
        const location = await getLocationInfo();
        const lang = navigator.language || 'العربية';
        
        const msg = `💰 <b>طلب شحن رصيد الصرافة (USDT)</b> 💰\n\n` +
                    `🆔 <b>ID الوكيل:</b> <code>${user?.agent_id}</code>\n` +
                    `👤 <b>الاسم:</b> ${user?.full_name || 'وكيل'}\n` +
                    `💵 <b>مبلغ USDT:</b> <b>${numAmount} USDT</b>\n` +
                    `💱 <b>المبلغ بالعملة المحلية:</b> <b>${estimatedLocalAmount.toLocaleString()} ${agentCurrency}</b> (سعر الصرف: ${exchangeRate})\n` +
                    `📌 <b>عنوان الإيداع:</b> <code>${currentAddress}</code> (${currentNetwork})\n` +
                    `🔗 <b>رقم العملية (TX Hash):</b> <code>${depositRecord.tx_hash}</code>\n` +
                    `🌐 <b>اللغة:</b> ${lang}\n` +
                    `🌐 <b>IP:</b> <code>${ip}</code>\n` +
                    `📍 <b>الموقع:</b> ${location}\n` +
                    `⏰ <b>الوقت:</b> ${new Date().toLocaleString('ar-EG')}\n\n` +
                    `⚠️ <i>يرجى مراجعة وتأكيد الطلب من لوحة تحكم الإدارة لإضافة الرصيد فورياً إلى صرافة الوكيل.</i>`;
        await sendTelegramMessage(msg);
      } catch (e) {
        console.error('Telegram error:', e);
      }

      setSuccess(true);
      if (onDepositSuccess) onDepositSuccess();

      setTimeout(() => {
        onClose();
        setSuccess(false);
        setAmount('');
        setTxHash('');
        setScreenshotUrl('');
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء إرسال طلب الإيداع');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isRtl = ['ar', 'ur', 'fa'].includes(i18n.language?.split('-')[0] || 'en');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200" dir={isRtl ? 'rtl' : 'ltr'}>
      <div
        className={`w-full max-w-lg rounded-3xl shadow-2xl border overflow-hidden max-h-[92vh] flex flex-col ${
          isDark ? 'bg-[#0F172A] border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className={`p-4 sm:p-5 flex items-center justify-between border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-black">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg tracking-tight">
                {t('add_agency_funds', 'إضافة الأموال للصرافة (USDT)')}
              </h3>
              <p className="text-xs text-slate-400">
                {t('add_agency_funds_desc', 'شحن رصيد الوكالة الخاص بك لتنفيذ إيداعات اللاعبين')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          {success ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-2">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <h4 className="font-black text-xl">{t('deposit_submitted_title', 'تم إرسال طلب الشحن بنجاح')}</h4>
              <p className="text-sm text-slate-400 max-w-xs mx-auto leading-relaxed">
                {t('deposit_submitted_body', 'سيقوم المشرف بمراجعة المعاملة وإضافة الرصيد إلى صرافتك بعملتك المحلية فورياً.')}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Rotation Timer Badge */}
              <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/30 text-amber-400 px-3.5 py-2.5 rounded-2xl text-xs font-bold">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 animate-pulse" />
                  <span>{t('address_rotation_timer', 'يتغير عنوان المحفظة كل 10 دقائق تلقائياً')}</span>
                </div>
                <span className="font-mono font-black text-sm bg-amber-500/20 px-2 py-0.5 rounded-lg">
                  {formatTimer(secondsRemaining)}
                </span>
              </div>

              {/* Wallet Address Box with QR Code */}
              <div className={`p-4 rounded-2xl border flex flex-col items-center gap-3 text-center ${
                isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                {/* QR Code */}
                <div className="p-2 bg-white rounded-xl shadow-xs border border-gray-200">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(currentAddress)}`}
                    alt="USDT TRC20 QR Code"
                    className="w-28 h-28 sm:w-32 sm:h-32 object-contain"
                  />
                </div>

                <div className="space-y-1 w-full">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-[11px] font-black px-2.5 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-full border border-emerald-500/20">
                      {t('network_label', 'شبكة')} {currentNetwork} (USDT)
                    </span>
                  </div>
                  <p className="font-mono text-xs sm:text-sm font-extrabold break-all text-slate-800 dark:text-slate-200 select-all p-2 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                    {currentAddress}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-2 text-xs font-bold text-blue-500 hover:text-blue-600 bg-blue-500/10 hover:bg-blue-500/20 px-4 py-2 rounded-xl transition-all cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  {copied ? t('address_copied', 'تم نسخ العنوان!') : t('copy_wallet_address', 'نسخ عنوان المحفظة')}
                </button>
              </div>

              {/* Amount USDT Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    {t('amount_to_deposit_usdt', 'المبلغ المراد شحنه (USDT)')}
                  </label>
                  <span className="text-xs font-bold text-slate-400">
                    1 USDT = {exchangeRate} {agentCurrency}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder={t('example_100', 'مثال: 100')}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className={`w-full px-4 py-3 rounded-2xl border font-bold text-base focus:ring-2 focus:ring-emerald-500 outline-hidden font-mono ${
                      isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  />
                  <div className="absolute inset-y-0 end-3 flex items-center pointer-events-none">
                    <span className="text-xs font-extrabold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                      USDT
                    </span>
                  </div>
                </div>
              </div>

              {/* Dynamic Local Currency Calculation Card */}
              {numAmount > 0 && (
                <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 flex items-center justify-between">
                  <span className="text-xs font-bold">{t('estimated_credit', 'المبلغ المقدر الذي سيضاف لصرافتك:')}</span>
                  <span className="text-base font-black font-mono">
                    {estimatedLocalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {agentCurrency}
                  </span>
                </div>
              )}

              {/* TX Hash Input */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                  {t('tx_hash_label', 'معرف المعاملة (TX Hash / Transaction ID)')}
                </label>
                <input
                  type="text"
                  placeholder={t('tx_hash_placeholder', 'مثال: 7f3a8b2c... أو رقم الإشعار')}
                  value={txHash}
                  onChange={(e) => setTxHash(e.target.value)}
                  className={`w-full px-4 py-3 rounded-2xl border font-mono text-xs focus:ring-2 focus:ring-emerald-500 outline-hidden ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              {/* Optional Screenshot Upload */}
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                  {t('upload_receipt_optional', 'صورة وصل التحويل (اختياري)')}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-500/10 file:text-emerald-500 hover:file:bg-emerald-500/20 cursor-pointer"
                />
              </div>

              {error && (
                <p className="text-rose-500 text-xs font-bold text-center bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !amount || numAmount <= 0}
                className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <UploadCloud className="w-5 h-5" />
                )}
                <span>{t('confirm_agency_deposit', 'تأكيد إرسال طلب الشحن')}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
