import React, { useState, useEffect } from 'react';
import { X, Copy, Check, UploadCloud } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../../lib/supabase';
import { sendTelegramMessage } from '../../../lib/telegram';

interface DepositUSDTModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  user: any;
}

export const DepositUSDTModal: React.FC<DepositUSDTModalProps> = ({
  isOpen,
  onClose,
  isDark,
  user
}) => {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('');
  const [txHash, setTxHash] = useState('');
  const [adminAddress, setAdminAddress] = useState('');
  const [network, setNetwork] = useState('TRC20');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAddress();
    }
  }, [isOpen]);

  const fetchAddress = async () => {
    try {
      // Get a random active address from admin
      const { data, error } = await supabase
        .from('admin_usdt_addresses')
        .select('*')
        .eq('is_active', true);
        
      if (data && data.length > 0) {
        // Pick random
        const randomAddr = data[Math.floor(Math.random() * data.length)];
        setAdminAddress(randomAddr.address);
        setNetwork(randomAddr.network || 'TRC20');
      } else {
        setAdminAddress('TQj3x8YvR9z2P4kL7mW1nQ8vB6xZ9mK3pL');
        setNetwork('TRC20');
      }
    } catch (err) {
      setAdminAddress('TQj3x8YvR9z2P4kL7mW1nQ8vB6xZ9mK3pL');
      setNetwork('TRC20');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(adminAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !txHash) return;
    
    setLoading(true);
    setError('');
    
    try {
      const { error: insertError } = await supabase
        .from('agent_deposits')
        .insert([
          {
            agent_id: user?.agent_id,
            amount_usdt: parseFloat(amount),
            tx_hash: txHash,
            status: 'pending'
          }
        ]);
        
      if (insertError) throw insertError;
      
      const msg = `💰 <b>New USDT Deposit (Agency)</b>\n\n<b>Agent:</b> ${user?.full_name} (<code>${user?.agent_id}</code>)\n<b>Amount:</b> ${amount} USDT\n<b>TX Hash:</b> <code>${txHash}</code>\n\nPlease approve this from the Admin Panel to update the agent's balance in ${user?.currency || 'local currency'}.`;
      await sendTelegramMessage(msg);
      
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setAmount('');
        setTxHash('');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Error submitting deposit');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`w-full max-w-md rounded-3xl shadow-xl overflow-hidden ${isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}>
        <div className={`p-4 flex items-center justify-between border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
          <h3 className="font-bold text-lg">{t('deposit_usdt_btn', 'إضافة الأموال للصرافة (USDT)')}</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-xl mb-2">{t('request_submitted', 'تم إرسال الطلب')}</h4>
              <p className="text-sm text-slate-500">{t('usdt_deposit_review_msg', 'سيتم مراجعة الإيداع وإضافة الرصيد إلى حسابك قريباً')}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2 text-center">
                <p className="text-sm font-semibold">{t('transfer_usdt_to', 'قم بتحويل USDT إلى العنوان التالي:')}</p>
                <div className={`p-4 rounded-xl border flex flex-col items-center gap-3 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <span className="text-xs font-bold px-2 py-1 bg-indigo-100 text-indigo-700 rounded-lg">{network}</span>
                  <p className="font-mono text-sm break-all font-bold tracking-wider">{adminAddress}</p>
                  <button type="button" onClick={handleCopy} className="flex items-center gap-2 text-sm text-blue-500 font-bold hover:text-blue-600">
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? t('copied', 'تم النسخ') : t('copy_address', 'نسخ العنوان')}
                  </button>
                </div>
              </div>
              
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {t('amount_usdt', 'المبلغ (USDT)')}
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
                  placeholder="100"
                  required
                  min="1"
                  step="0.01"
                />
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {t('tx_hash', 'رقم العملية (TX Hash / Transaction ID)')}
                </label>
                <input
                  type="text"
                  value={txHash}
                  onChange={(e) => setTxHash(e.target.value)}
                  className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
                  placeholder="e.g. 0x123...abc"
                  required
                />
              </div>
              
              {error && <p className="text-rose-500 text-xs font-bold text-center">{error}</p>}

              <button
                type="submit"
                disabled={loading || !amount || !txHash}
                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <UploadCloud className="w-5 h-5" />}
                {t('submit_deposit', 'تأكيد الإيداع')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
