import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { UserPlus, Copy, Check, Shield } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { sendTelegramMessage } from '../../lib/telegram';

export default function CreateAgent() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const generateAgentId = () => {
    const randomDigits = Math.floor(10000 + Math.random() * 90000); // 5 random digits
    return `1069${randomDigits}`;
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let pass = '';
    for (let i = 0; i < 12; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  const [formData, setFormData] = useState({
    agent_id: '',
    password: '',
    full_name: '',
    agency_name: '',
    country: '',
    city: '',
    bank_name: '',
    commission_deposit: '',
    commission_withdraw: '',
    agent_type: 'mobcash' as 'mobcash' | 'bank_transfer',
    usdt_address: '',
    activation_amount: '',
    qr_code_url: '',
  });
  const [qrFile, setQrFile] = useState<File | null>(null);

  const handleRegenerateId = () => {
    setFormData(prev => ({ ...prev, agent_id: generateAgentId() }));
  };

  const handleRegeneratePassword = () => {
    setFormData(prev => ({ ...prev, password: generatePassword() }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const newAgentId = formData.agent_id.trim();
    const newPassword = formData.password.trim();

    try {
      let uploadedQr = formData.qr_code_url;
      if (qrFile) {
        uploadedQr = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(qrFile);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = err => reject(err);
        });
      }

      const agentPayload = {
        agent_id: newAgentId,
        password_hash: newPassword,
        full_name: formData.agency_name ? `${formData.full_name} (${formData.agency_name})` : formData.full_name,
        country: formData.country,
        city: formData.city,
        bank_name: formData.agent_type === 'bank_transfer' ? formData.bank_name : '',
        commission_deposit: parseFloat(formData.commission_deposit) || 0,
        commission_withdraw: parseFloat(formData.commission_withdraw) || 0,
        agent_type: formData.agent_type,
        usdt_address: formData.usdt_address,
        activation_amount: formData.activation_amount,
        qr_code_url: uploadedQr,
        status: 'pending',
      };

      let createdAgent: any = null;

      const { data, error } = await supabase.from('agents').insert([agentPayload]).select();

      if (error) {
        console.warn('Full Supabase insert failed (likely due to custom columns), attempting standard insert fallback:', error);
        const standardPayload = {
          agent_id: newAgentId,
          password_hash: newPassword,
          full_name: formData.agency_name ? `${formData.full_name} (${formData.agency_name})` : formData.full_name,
          country: formData.country,
          city: formData.city,
          bank_name: formData.agent_type === 'bank_transfer' ? formData.bank_name : '',
          commission_deposit: parseFloat(formData.commission_deposit) || 0,
          commission_withdraw: parseFloat(formData.commission_withdraw) || 0,
          status: 'pending',
        };
        const fallbackRes = await supabase.from('agents').insert([standardPayload]).select();
        if (fallbackRes.data?.[0]) {
          createdAgent = fallbackRes.data[0];
        } else {
          console.warn('Standard insert also returned error, falling back to local creation:', fallbackRes.error);
        }
      } else if (data?.[0]) {
        createdAgent = data[0];
      }

      // If Supabase completely failed or createdAgent is null, construct fallback object
      if (!createdAgent) {
        createdAgent = {
          id: `local-${Date.now()}`,
          ...agentPayload,
          created_at: new Date().toISOString()
        };
      }

      // Save to local backup to ensure custom fields and agent exist regardless of DB constraints
      try {
        const local = JSON.parse(localStorage.getItem('local_registered_agents') || '[]');
        const updatedLocal = [{ ...agentPayload, ...createdAgent, id: createdAgent.id || newAgentId }, ...local.filter((a: any) => a.agent_id !== newAgentId)];
        localStorage.setItem('local_registered_agents', JSON.stringify(updatedLocal));
      } catch (err) {
        console.warn('LocalStorage backup error:', err);
      }

      // Log activity
      await supabase.from('activities').insert([
        {
          agent_id: newAgentId,
          action: `Agent created as ${formData.agent_type === 'mobcash' ? 'MobCash Agent' : 'Bank Transfer Agent'} by admin`,
        },
      ]);

      // Send Telegram notification
      try {
        const msg = `👤 <b>تم إنشاء وكيل جديد</b> 👤\n\n` +
                    `🆔 <b>ID الوكيل:</b> <code>${newAgentId}</code>\n` +
                    `🔑 <b>كلمة المرور:</b> <code>${newPassword}</code>\n` +
                    `🏷️ <b>نوع الوكيل:</b> <b>${formData.agent_type === 'mobcash' ? 'وكيل موبيكاش (بدون محفظة)' : 'وكيل تحويل مصرفي'}</b>\n` +
                    `👤 <b>الاسم:</b> ${formData.full_name}\n` +
                    `🌐 <b>الدولة:</b> ${formData.country} - ${formData.city}\n` +
                    `🏦 <b>البنك:</b> ${formData.bank_name}\n` +
                    `💵 <b>نسبة الإيداع:</b> ${formData.commission_deposit}%\n` +
                    `💰 <b>مبلغ التفعيل:</b> ${formData.activation_amount} USDT\n` +
                    `📌 <b>عنوان USDT:</b> <code>${formData.usdt_address || 'غير محدد'}</code>`;
        await sendTelegramMessage(msg);
      } catch (e) {
        console.error('Telegram notification failed', e);
      }

      if (createdAgent) {
        navigate(`/admin/agent-payment/${createdAgent.id}`, {
          state: { credentials: { agent_id: newAgentId, password_hash: newPassword } }
        });
      }
    } catch (error: any) {
      console.error('Error creating agent:', error);
      alert(error?.message || t('error_creating_agent') || 'Failed to create agent');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-primary text-white rounded-xl flex items-center justify-center">
          <UserPlus className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{t('create_agent')}</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Agent Type Selector */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-900 mb-2">
              {t('agent_type', 'نوع الوكيل')}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, agent_type: 'mobcash', bank_name: '' })}
                className={`p-4 rounded-2xl border-2 text-start transition-all cursor-pointer flex flex-col gap-1.5 relative overflow-hidden ${
                  formData.agent_type === 'mobcash'
                    ? 'border-secondary bg-blue-50/70 text-blue-950 shadow-md ring-2 ring-secondary/20'
                    : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-base flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                    {t('mobcash_agent', 'وكيل موبيكاش')}
                  </span>
                  {formData.agent_type === 'mobcash' && (
                    <span className="bg-secondary text-white text-xs px-2.5 py-0.5 rounded-full font-bold">
                      محدد
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 leading-relaxed mt-1">
                  {t('mobcash_agent_desc', 'لا يتطلب إدخال رقم محفظة في حساب الوكيل')}
                </p>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, agent_type: 'bank_transfer' })}
                className={`p-4 rounded-2xl border-2 text-start transition-all cursor-pointer flex flex-col gap-1.5 relative overflow-hidden ${
                  formData.agent_type === 'bank_transfer'
                    ? 'border-secondary bg-blue-50/70 text-blue-950 shadow-md ring-2 ring-secondary/20'
                    : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-base flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block"></span>
                    {t('bank_transfer_agent', 'وكيل تحويل مصرفي')}
                  </span>
                  {formData.agent_type === 'bank_transfer' && (
                    <span className="bg-secondary text-white text-xs px-2.5 py-0.5 rounded-full font-bold">
                      محدد
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 leading-relaxed mt-1">
                  {t('bank_transfer_agent_desc', 'يتطلب إدخال رقم الحساب أو المحفظة البنكية')}
                </p>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">{t('agent_id') || 'الايدي (Agent ID)'}</label>
                <button
                  type="button"
                  onClick={handleRegenerateId}
                  className="text-xs text-secondary hover:underline font-medium cursor-pointer"
                >
                  توليد تلقائي
                </button>
              </div>
              <input
                type="text"
                required
                value={formData.agent_id}
                onChange={(e) => setFormData({ ...formData, agent_id: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-secondary focus:border-secondary bg-white text-gray-950 font-semibold font-mono"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">{t('password') || 'كلمة المرور'}</label>
                <button
                  type="button"
                  onClick={handleRegeneratePassword}
                  className="text-xs text-secondary hover:underline font-medium cursor-pointer"
                >
                  توليد تلقائي
                </button>
              </div>
              <input
                type="text"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-secondary focus:border-secondary bg-white text-gray-950 font-semibold font-mono"
              />
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('full_name')}</label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-secondary focus:border-secondary bg-white text-gray-950 font-semibold"
              />
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('agency_name', 'اسم الوكالة')}</label>
              <input
                type="text"
                value={formData.agency_name}
                onChange={(e) => setFormData({ ...formData, agency_name: e.target.value })}
                placeholder={t('agency_name_placeholder', 'اختياري')}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-secondary focus:border-secondary bg-white text-gray-950 font-semibold"
              />
            </div>

            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('country')}</label>
              <input
                type="text"
                required
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-secondary focus:border-secondary bg-white text-gray-950 font-semibold"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('city')}</label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-secondary focus:border-secondary bg-white text-gray-950 font-semibold"
              />
            </div>

            {formData.agent_type === 'bank_transfer' && (
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('bank_name', 'اسم البنك / رقم الحساب')}</label>
                <input
                  type="text"
                  required={formData.agent_type === 'bank_transfer'}
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  placeholder={t('bank_name_placeholder', 'أدخل اسم البنك أو رقم الحساب البنكي')}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-secondary focus:border-secondary bg-white text-gray-950 font-semibold"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('commission_deposit', 'عمولة الإيداع (%)')}</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                required
                value={formData.commission_deposit}
                onChange={(e) => setFormData({ ...formData, commission_deposit: e.target.value })}
                placeholder="0.00"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-secondary focus:border-secondary bg-white text-gray-950 font-semibold font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('commission_withdraw', 'عمولة السحب (%)')}</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                required
                value={formData.commission_withdraw}
                onChange={(e) => setFormData({ ...formData, commission_withdraw: e.target.value })}
                placeholder="0.00"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-secondary focus:border-secondary bg-white text-gray-950 font-semibold font-mono"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-8 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? '...' : t('create_agent')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
