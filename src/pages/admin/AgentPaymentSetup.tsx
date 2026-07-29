import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Wallet, UploadCloud, Check, Copy, Shield, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { sendTelegramMessage } from '../../lib/telegram';

export default function AgentPaymentSetup() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [agent, setAgent] = useState<any>(null);
  const [credentials, setCredentials] = useState<{ agent_id: string; password_hash: string } | null>(
    location.state?.credentials || null
  );
  
  const [formData, setFormData] = useState({
    activation_amount: '500',
    usdt_address: '',
  });
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (id) {
      fetchAgent();
    }
  }, [id]);

  const fetchAgent = async () => {
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      setAgent(data);
    } catch (error) {
      console.error('Error fetching agent:', error);
    }
  };

  const copyCredentials = () => {
    if (credentials) {
      navigator.clipboard.writeText(`Agent ID: ${credentials.agent_id}\nPassword: ${credentials.password_hash}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let qrCodeUrl = agent?.qr_code_url || '';
      
      if (file) {
        qrCodeUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = error => reject(error);
        });
      }

      const { error } = await supabase
        .from('agents')
        .update({
          activation_amount: formData.activation_amount,
          usdt_address: formData.usdt_address,
          qr_code_url: qrCodeUrl
        })
        .eq('id', id);

      if (error) throw error;

      // Log activity
      await supabase.from('activities').insert([
        {
          agent_id: agent.agent_id,
          action: 'Admin configured payment details',
        },
      ]);

      // Send Telegram notification
      try {
        const msg = `⚙️ *إعداد تفاصيل الدفع* ⚙️\n\n` +
                    `*ID الوكيل:* \`${agent.agent_id}\`\n` +
                    `*الاسم:* ${agent.full_name}\n` +
                    `*مبلغ التفعيل:* ${formData.activation_amount} USDT\n` +
                    `*عنوان الدفع:* \`${formData.usdt_address}\`\n` +
                    `*بواسطة:* الإدارة`;
        await sendTelegramMessage(msg);
      } catch (e) {
        console.error('Telegram notification failed', e);
      }

      navigate('/admin/manage-agents');
    } catch (error) {
      console.error('Error saving payment setup:', error);
      alert(t('error_saving'));
    } finally {
      setLoading(false);
    }
  };

  if (!agent) return <div className="p-8">{t('loading')}...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center">
          <Wallet className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('payment_setup')}</h1>
          <p className="text-gray-500">{t('setup_payment_for')} {agent.full_name}</p>
        </div>
      </div>

      {credentials && (
        <div className="p-6 bg-blue-50 border border-blue-100 rounded-2xl mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-blue-900">{t('credentials_generated')}</h3>
            <button
              onClick={copyCredentials}
              className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors border border-blue-200 text-sm font-medium"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? t('copied') : t('copy')}
            </button>
          </div>
          <div className="space-y-3 font-mono text-sm">
            <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-blue-100">
              <span className="text-gray-500">{t('agent_id')}</span>
              <span className="font-bold text-gray-900">{credentials.agent_id}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-blue-100">
              <span className="text-gray-500">{t('password')}</span>
              <span className="font-bold text-gray-900">{credentials.password_hash}</span>
            </div>
          </div>
          <p className="mt-4 text-sm text-blue-600 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            {t('save_credentials_warning')}
          </p>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('activation_amount')} (USD)</label>
            <input
              type="number"
              required
              value={formData.activation_amount}
              onChange={(e) => setFormData({ ...formData, activation_amount: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-secondary focus:border-secondary bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('usdt_address')} (TRC20)</label>
            <input
              type="text"
              required
              value={formData.usdt_address}
              onChange={(e) => setFormData({ ...formData, usdt_address: e.target.value })}
              placeholder="T..."
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-secondary focus:border-secondary bg-gray-50 font-mono"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('upload_barcode')}</label>
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
                      accept="image/*"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
              </div>
            </div>
            {file && (
              <div className="mt-3 text-sm text-green-600 flex items-center gap-2 bg-green-50 p-3 rounded-lg border border-green-100">
                <Check className="w-4 h-4" />
                {t('selected')}: <span className="font-medium">{file.name}</span>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? '...' : t('save_and_continue')}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
