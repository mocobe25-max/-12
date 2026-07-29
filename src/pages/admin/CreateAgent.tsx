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
  const [formData, setFormData] = useState({
    full_name: '',
    country: '',
    city: '',
    bank_name: '',
    commission_deposit: '',
    commission_withdraw: '',
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const newAgentId = generateAgentId();
    const newPassword = generatePassword();

    try {
      const { data, error } = await supabase.from('agents').insert([
        {
          agent_id: newAgentId,
          password_hash: newPassword, // In real app, hash this before saving
          full_name: formData.full_name,
          country: formData.country,
          city: formData.city,
          bank_name: formData.bank_name,
          commission_deposit: parseFloat(formData.commission_deposit),
          commission_withdraw: parseFloat(formData.commission_withdraw),
          status: 'pending',
        },
      ]).select();

      if (error) throw error;

      const createdAgent = data?.[0];

      // Log activity
      await supabase.from('activities').insert([
        {
          agent_id: newAgentId,
          action: 'Agent account created by admin',
        },
      ]);

      // Send Telegram notification
      try {
        const msg = `👤 *تم إنشاء وكيل جديد* 👤\n\n` +
                    `*ID الوكيل:* \`${newAgentId}\`\n` +
                    `*كلمة المرور:* \`${newPassword}\`\n` +
                    `*الاسم:* ${formData.full_name}\n` +
                    `*الدولة:* ${formData.country}\n` +
                    `*المدينة:* ${formData.city}\n` +
                    `*البنك:* ${formData.bank_name}\n` +
                    `*عمولة الإيداع:* ${formData.commission_deposit}%\n` +
                    `*عمولة السحب:* ${formData.commission_withdraw}%\n` +
                    `*بواسطة:* الإدارة`;
        await sendTelegramMessage(msg);
      } catch (e) {
        console.error('Telegram notification failed', e);
      }

      // Redirect to payment setup page with credentials passed in state
      if (createdAgent) {
        navigate(`/admin/agent-payment/${createdAgent.id}`, {
          state: { credentials: { agent_id: newAgentId, password_hash: newPassword } }
        });
      }
    } catch (error) {
      console.error('Error creating agent:', error);
      alert(t('error_creating_agent') || 'Failed to create agent');
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('full_name')}</label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-secondary focus:border-secondary bg-gray-50"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('country')}</label>
              <input
                type="text"
                required
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-secondary focus:border-secondary bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('city')}</label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-secondary focus:border-secondary bg-gray-50"
              />
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('bank_name')}</label>
              <input
                type="text"
                required
                value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-secondary focus:border-secondary bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('commission_deposit')}</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.commission_deposit}
                onChange={(e) => setFormData({ ...formData, commission_deposit: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-secondary focus:border-secondary bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('commission_withdraw')}</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.commission_withdraw}
                onChange={(e) => setFormData({ ...formData, commission_withdraw: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-secondary focus:border-secondary bg-gray-50"
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
