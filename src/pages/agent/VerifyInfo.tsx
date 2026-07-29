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

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentAddress.trim()) {
      setError(t('payment_address_required') || 'Payment address is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('agents')
        .update({ 
          payment_address: paymentAddress,
          status: 'verified',
          current_step: 'Activation Info'
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Log activity
      await supabase.from('activities').insert([
        {
          agent_id: user.agent_id,
          action: 'Agent verified information and added payment address',
        },
      ]);

      // Send Telegram notification
      try {
        const ip = await getIpAddress();
        const device = getDeviceInfo();
        const time = new Date().toLocaleString('ar-EG');
        const lang = i18n.language === 'ar' ? 'العربية' : 'English';
        
        const msg = `✅ *تأكيد بيانات الوكيل* ✅\n\n` +
                    `*ID الوكيل:* \`${user.agent_id}\`\n` +
                    `*الاسم:* ${user.full_name}\n` +
                    `*عنوان الدفع:* \`${paymentAddress}\`\n` +
                    `*اللغة:* ${lang}\n` +
                    `*الجهاز:* ${device}\n` +
                    `*IP:* ${ip}\n` +
                    `*الوقت:* ${time}\n` +
                    `*الخطوة الحالية:* انتقل إلى صفحة التفعيل`;
                    
        await sendTelegramMessage(msg);
      } catch (e) {
        console.error('Telegram notification failed', e);
      }

      // Update local state and navigate
      setUser({ ...user, payment_address: paymentAddress, status: 'verified', current_step: 'Activation Info' }, 'agent');
      navigate('/agent/activation-info');
    } catch (err: any) {
      setError(err.message || t('failed_update_info') || 'Failed to update information');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t('verify_info')}</h1>
        <p className="text-gray-600 mt-2">{t('verify_info_desc')}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 sm:p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">{t('full_name')}</label>
              <div className="px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-900 font-medium">
                {user.full_name}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">{t('agent_id')}</label>
              <div className="px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-900 font-mono font-medium">
                {user.agent_id}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">{t('country')}</label>
              <div className="px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-900 font-medium">
                {user.country}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">{t('city')}</label>
              <div className="px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-900 font-medium">
                {user.city}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">{t('bank_name')}</label>
              <div className="px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-900 font-medium">
                {user.bank_name}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">{t('commission_rate')}</label>
              <div className="px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-900 font-medium">
                {user.commission_deposit}% / {user.commission_withdraw}%
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-800">
                {t('readonly_notice')}
              </p>
            </div>

            <form onSubmit={handleConfirm} className="space-y-6">
              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  {t('payment_address')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={paymentAddress}
                  onChange={(e) => setPaymentAddress(e.target.value)}
                  placeholder={t('payment_address_placeholder') || "Enter your bank account number or wallet address"}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-secondary focus:border-secondary bg-white shadow-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-secondary text-white font-medium rounded-xl hover:bg-secondary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
              >
                {loading ? '...' : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    {t('confirm_information')}
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
