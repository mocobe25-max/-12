import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { supabase } from '../../lib/supabase';
import { notifyAgentAction } from '../../lib/telegram';
import { MobCashHeader } from './components/MobCashHeader';
import { LimitBalanceCard } from './components/LimitBalanceCard';
import { QuickActionButtons } from './components/QuickActionButtons';
import { Wallet, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { DepositUSDTModal } from './components/DepositUSDTModal';
import { LiveSupportModal } from './components/LiveSupportModal';
import { RecentTransactionsList, MobCashTransaction } from './components/RecentTransactionsList';
import { DepositModal } from './components/DepositModal';
import { WithdrawModal } from './components/WithdrawModal';
import { ProfileDrawer } from './components/ProfileDrawer';
import { NotificationsModal } from './components/NotificationsModal';
import { TransactionDetailsModal } from './components/TransactionDetailsModal';

export default function AgentDashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  // In-app real-time status alert banner
  const [statusAlert, setStatusAlert] = useState<{ title: string; message: string; type: 'success' | 'warning' | 'error' } | null>(null);

  // Theme state: defaults to authentic light mode matching Page 9 & 46
  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem('mobcash_theme') === 'dark';
  });

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      localStorage.setItem('mobcash_theme', next ? 'dark' : 'light');
      return next;
    });
  };

  // Limit and Balance state (Page 46 default baseline)
  const [limitAmount, setLimitAmount] = useState<number>(() => {
    const saved = localStorage.getItem(`mobcash_limit_${user?.agent_id || 'default'}`);
    return saved ? parseFloat(saved) : 26784.62;
  });

  const [balanceAmount, setBalanceAmount] = useState<number>(user?.balance || 0);
  const [currency, setCurrency] = useState<string>(user?.currency || 'USD');

  // Transactions State
  const [transactions, setTransactions] = useState<MobCashTransaction[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Modals state
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isUSDTDepositOpen, setIsUSDTDepositOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  const [selectedTransaction, setSelectedTransaction] = useState<MobCashTransaction | null>(null);

  // Device status & authentication check
  useEffect(() => {
    if (!user) {
      navigate('/agent/login');
      return;
    }

    checkDeviceStatus();
    supabase.from('agents').update({ current_step: 'Dashboard' }).eq('id', user.id);
    fetchTransactions();
    fetchAgentData();

    // Cross-tab & Realtime balance & status listener
    let channel: BroadcastChannel | null = null;
    let statusChannel: BroadcastChannel | null = null;

    const handleStatusChange = (status: string) => {
      if (!status) return;

      if (status === 'active') {
        setStatusAlert({
          title: t('agent_activated_title', 'تم تفعيل حسابك'),
          message: t('agent_activated_msg', 'تهانينا! تم تفعيل حساب الوكالة الخاص بك بنجاح وهو الآن جاهز لجميع العمليات.'),
          type: 'success',
        });
        useAuthStore.getState().updateUser({ status: 'active' });
      } else if (status === 'suspended') {
        useAuthStore.getState().updateUser({ status: 'suspended' });
        navigate('/agent/suspended', { replace: true });
      } else if (status === 'under_review') {
        useAuthStore.getState().updateUser({ status: 'under_review' });
        navigate('/agent/review', { replace: true });
      } else if (status === 'verified') {
        useAuthStore.getState().updateUser({ status: 'verified' });
        navigate('/agent/activate', { replace: true });
      } else if (status === 'pending') {
        useAuthStore.getState().updateUser({ status: 'pending' });
        navigate('/agent/verify', { replace: true });
      } else if (status === 'deleted') {
        alert(t('agent_deleted_msg', 'تم حذف حساب الوكالة الخاص بك من النظام. تم تسجيل الخروج تلقائياً.'));
        logout();
        navigate('/agent/login', { replace: true });
      }
    };

    try {
      channel = new BroadcastChannel('agent_balance_channel');
      channel.onmessage = (event) => {
        if (event.data?.agent_id === user.agent_id) {
          if (typeof event.data.new_balance === 'number') {
            setBalanceAmount(event.data.new_balance);
          }
          fetchAgentData();
        }
      };
    } catch (e) {}

    try {
      statusChannel = new BroadcastChannel('agent_status_channel');
      statusChannel.onmessage = (event) => {
        if (event.data?.agent_id === user.agent_id) {
          handleStatusChange(event.data.status);
        }
      };
    } catch (e) {}

    const storageHandler = (e: StorageEvent) => {
      if (e.key === 'mobcash_balance_update') {
        try {
          const parsed = JSON.parse(e.newValue || '{}');
          if (parsed.agent_id === user.agent_id) {
            fetchAgentData();
          }
        } catch (err) {}
      }
      if (e.key === 'mobcash_agent_status_broadcast') {
        try {
          const parsed = JSON.parse(e.newValue || '{}');
          if (parsed.agent_id === user.agent_id) {
            handleStatusChange(parsed.status);
          }
        } catch (err) {}
      }
    };

    window.addEventListener('storage', storageHandler);

    // Supabase realtime subscription for balance updates
    const realtimeSub = supabase
      .channel(`agent_balance_sub_${user.agent_id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'agents',
          filter: `agent_id=eq.${user.agent_id}`,
        },
        (payload) => {
          if (payload.new && typeof payload.new.balance === 'number') {
            setBalanceAmount(payload.new.balance);
            if (payload.new.currency) setCurrency(payload.new.currency);
          }
        }
      )
      .subscribe();

    // Supabase realtime subscription for agent status changes
    const statusRealtimeSub = supabase
      .channel(`agent_status_sub_${user.agent_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agents',
          filter: `agent_id=eq.${user.agent_id}`,
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            handleStatusChange('deleted');
          } else if (payload.new && payload.new.status) {
            handleStatusChange(payload.new.status);
          }
        }
      )
      .subscribe();

    return () => {
      if (channel) channel.close();
      if (statusChannel) statusChannel.close();
      window.removeEventListener('storage', storageHandler);
      supabase.removeChannel(realtimeSub);
      supabase.removeChannel(statusRealtimeSub);
    };
  }, [user]);

  // Save limit & balance locally
  useEffect(() => {
    if (user?.agent_id) {
      localStorage.setItem(`mobcash_limit_${user.agent_id}`, limitAmount.toString());
      localStorage.setItem(`mobcash_solde_${user.agent_id}`, balanceAmount.toString());
    }
  }, [limitAmount, balanceAmount, user]);

  const checkDeviceStatus = async () => {
    if (!user) return;
    const deviceId = localStorage.getItem('mobcash_device_id');
    if (!deviceId) {
      navigate('/agent/device-activation');
      return;
    }
    try {
      const { data } = await supabase
        .from('agent_devices')
        .select('status')
        .eq('agent_id', user.agent_id)
        .eq('device_id', deviceId)
        .maybeSingle();

      if (!data || data.status !== 'active') {
        navigate('/agent/device-activation');
      }
    } catch (e) {
      console.warn('Device check note:', e);
    }
  };

  const fetchAgentData = async () => {
    if (!user?.agent_id) return;
    const { data } = await supabase.from('agents').select('balance, currency').eq('agent_id', user.agent_id).single();
    if (data) {
      setBalanceAmount(Number(data.balance) || 0);
      setCurrency(data.currency || 'USD');
      
      const updatedUser = { ...user, balance: Number(data.balance) || 0, currency: data.currency || 'USD' };
      useAuthStore.getState().setUser(updatedUser, 'agent');
    }
  };
  const fetchTransactions = async () => {
    if (!user) return;
    setIsRefreshing(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('agent_id', user.agent_id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data && data.length > 0) {
        setTransactions(data);
      } else {
        // Fallback to local transactions if offline or empty
        const local = localStorage.getItem(`mobcash_txs_${user.agent_id}`);
        if (local) {
          try {
            setTransactions(JSON.parse(local));
          } catch {
            setTransactions(getDefaultDemoTransactions());
          }
        } else {
          setTransactions(getDefaultDemoTransactions());
        }
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      const local = localStorage.getItem(`mobcash_txs_${user.agent_id}`);
      if (local) {
        setTransactions(JSON.parse(local));
      } else {
        setTransactions(getDefaultDemoTransactions());
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // Sample authentic demo transaction matching Page 46 (№...113, ID 481029, +100.00)
  const getDefaultDemoTransactions = (): MobCashTransaction[] => [
    {
      id: 'tx_default_1',
      tx_number: '№...113',
      agent_id: user?.agent_id || '481029',
      type: 'deposit',
      customer_phone: '481029',
      amount: 100.0,
      commission_rate: user?.commission_deposit || 5,
      commission_earned: 5.0,
      note: 'Dépôt joueur 1xBet',
      status: 'completed',
      created_at: '2025-12-04T11:16:16.000Z',
    },
  ];

  const handleCopyAgentId = () => {
    if (user?.agent_id) {
      navigator.clipboard.writeText(user.agent_id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  // Execute Deposit: decreases Limit, increases Balance, logs transaction
  const handleExecuteDeposit = async (playerId: string, amount: number, note?: string) => {
    if (!user) return;
    if (amount > balanceAmount) {
      alert(`عذراً، رصيدك المتاح (${balanceAmount} ${currency}) لا يكفي لإتمام هذه العملية (${amount} ${currency}). يرجى شحن الرصيد أولاً.`);
      setIsDepositOpen(false);
      setIsUSDTDepositOpen(true);
      return;
    }
    const rate = user.commission_deposit || 5;
    const commissionEarned = (amount * rate) / 100;
    const shortRef = Math.floor(100 + Math.random() * 900).toString();
    const newTx = {
      id: 'tx_' + Date.now(),
      tx_number: `№...${shortRef}`,
      agent_id: user.agent_id,
      type: 'deposit',
      customer_phone: playerId,
      amount: amount,
      commission_rate: rate,
      commission_earned: commissionEarned,
      note: note || 'Dépôt joueur 1xBet',
      status: 'completed',
      created_at: new Date().toISOString(),
    };
    
    // Deduct agency balance
    const newBalance = Math.max(0, balanceAmount - amount);
    await supabase.from('agents').update({ balance: newBalance }).eq('agent_id', user.agent_id);
    
    try {
      const localAgents = JSON.parse(localStorage.getItem('local_registered_agents') || '[]');
      const aIdx = localAgents.findIndex((a: any) => a.agent_id === user.agent_id);
      if (aIdx >= 0) {
        localAgents[aIdx].balance = newBalance;
        localStorage.setItem('local_registered_agents', JSON.stringify(localAgents));
      }
    } catch(e) {}

    try {
      const channel = new BroadcastChannel('agent_balance_channel');
      channel.postMessage({ agent_id: user.agent_id, new_balance: newBalance });
      channel.close();
      localStorage.setItem('mobcash_balance_update', JSON.stringify({ agent_id: user.agent_id, balance: newBalance, time: Date.now() }));
    } catch(e) {}

    setBalanceAmount(newBalance);
    setLimitAmount((prev) => Math.max(0, prev - amount));

    const updated = [newTx, ...transactions];
    setTransactions(updated);
    localStorage.setItem(`mobcash_txs_${user.agent_id}`, JSON.stringify(updated));

    // Try saving to Supabase
    try {
      await supabase.from('transactions').insert([
        {
          agent_id: user.agent_id,
          type: 'deposit',
          customer_phone: playerId,
          amount: amount,
          commission_rate: rate,
          commission_earned: commissionEarned,
          note: note || 'Dépôt',
          status: 'completed',
          created_at: newTx.created_at,
        },
      ]);
    } catch (e) {
      console.warn('Supabase insert note:', e);
    }
    
    // Telegram notification
    try {
      await notifyAgentAction({
        actionType: 'deposit_to_player',
        agentId: user.agent_id,
        fullName: user.full_name || 'Agent',
        playerId,
        amount,
        currency,
        commission: commissionEarned,
      });
    } catch(e) {}

    return newTx;
  };

  // Execute Withdraw: increases Limit/Balance, logs transaction
  const handleExecuteWithdraw = async (playerId: string, withdrawCode: string, amount: number, note?: string) => {
    if (!user) return;
    const rate = user.commission_withdraw || 5;
    const commissionEarned = (amount * rate) / 100;
    const shortRef = Math.floor(100 + Math.random() * 900).toString();
    const newTx = {
      id: 'tx_' + Date.now(),
      tx_number: `№...${shortRef}`,
      agent_id: user.agent_id,
      type: 'withdraw',
      customer_phone: playerId,
      withdraw_code: withdrawCode,
      amount: amount,
      commission_rate: rate,
      commission_earned: commissionEarned,
      note: note || 'Retrait joueur 1xBet',
      status: 'completed',
      created_at: new Date().toISOString(),
    };
    
    // Add balance
    const newBalance = balanceAmount + amount;
    await supabase.from('agents').update({ balance: newBalance }).eq('agent_id', user.agent_id);
    
    try {
      const localAgents = JSON.parse(localStorage.getItem('local_registered_agents') || '[]');
      const aIdx = localAgents.findIndex((a: any) => a.agent_id === user.agent_id);
      if (aIdx >= 0) {
        localAgents[aIdx].balance = newBalance;
        localStorage.setItem('local_registered_agents', JSON.stringify(localAgents));
      }
    } catch(e) {}

    try {
      const channel = new BroadcastChannel('agent_balance_channel');
      channel.postMessage({ agent_id: user.agent_id, new_balance: newBalance });
      channel.close();
      localStorage.setItem('mobcash_balance_update', JSON.stringify({ agent_id: user.agent_id, balance: newBalance, time: Date.now() }));
    } catch(e) {}

    setBalanceAmount(newBalance);
    setLimitAmount((prev) => prev + amount);

    const updated = [newTx, ...transactions];
    setTransactions(updated);
    localStorage.setItem(`mobcash_txs_${user.agent_id}`, JSON.stringify(updated));

    // Try saving to Supabase
    try {
      await supabase.from('transactions').insert([
        {
          agent_id: user.agent_id,
          type: 'withdraw',
          customer_phone: playerId,
          amount: amount,
          commission_rate: rate,
          commission_earned: commissionEarned,
          note: `Code: ${withdrawCode}`,
          status: 'completed',
          created_at: newTx.created_at,
        },
      ]);
    } catch (e) {
      console.warn('Supabase insert note:', e);
    }
    
    // Telegram notification
    try {
      await notifyAgentAction({
        actionType: 'withdraw_from_player',
        agentId: user.agent_id,
        fullName: user.full_name || 'Agent',
        playerId,
        withdrawCode,
        amount,
        currency,
        commission: commissionEarned,
      });
    } catch(e) {}

    return newTx;
  };

  // Execute Cancel Deposit: refunds limit, removes/marks transaction
  const handleExecuteCancel = async (txId: string, reason: string) => {
    const target = transactions.find((t) => t.id === txId || t.customer_phone === txId);
    if (target && target.type === 'deposit') {
      setLimitAmount((prev) => prev + target.amount);
      setBalanceAmount((prev) => Math.max(0, prev - target.amount));
    }
    const filtered = transactions.filter((t) => t.id !== txId);
    setTransactions(filtered);
    if (user?.agent_id) {
      localStorage.setItem(`mobcash_txs_${user.agent_id}`, JSON.stringify(filtered));
    }
    return true;
  };

  const isRtl = ['ar', 'ur', 'fa', 'he'].includes(i18n.language?.split('-')[0] || 'en');

  if (!user) return null;

  return (
    <div
      className={`min-h-screen transition-colors duration-300 font-sans ${
        isDark ? 'bg-[#0B111E] text-white' : 'bg-[#ECEFF3] text-slate-900'
      }`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Centered Mobile App Shell matching Page 9 & 46 */}
      <div className="w-full max-w-md mx-auto min-h-screen flex flex-col justify-between p-3 sm:p-4">
        {/* Main Content Area */}
        <div className="space-y-3.5 sm:space-y-4">
          {/* Top Bar: Profile, ID Badge, Notifications Bell */}
          <MobCashHeader
            agentId={user.agent_id}
            fullName={user.first_name || user.full_name || 'Agent'}
            copied={copiedId}
            onCopyId={handleCopyAgentId}
            onOpenProfile={() => setIsProfileOpen(true)}
            onOpenNotifications={() => setIsNotificationsOpen(true)}
            onOpenSupport={() => setIsSupportOpen(true)}
            isDark={isDark}
            onToggleTheme={toggleTheme}
          />

          {/* Realtime Status Alert Banner */}
          {statusAlert && (
            <div className={`p-4 rounded-2xl flex items-start gap-3 border shadow-sm animate-in fade-in slide-in-from-top-2 duration-300 ${
              statusAlert.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}>
              {statusAlert.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-500" />
              ) : (
                <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
              )}
              <div className="flex-1">
                <h5 className="font-extrabold text-sm">{statusAlert.title}</h5>
                <p className="text-xs opacity-90 leading-relaxed mt-0.5">{statusAlert.message}</p>
              </div>
              <button
                onClick={() => setStatusAlert(null)}
                className="text-xs opacity-60 hover:opacity-100 p-1 font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {/* Limit & Balance Card (Page 46: Limite du PDV, bold amount, Solde, blue bar, eye toggle) */}
          <LimitBalanceCard
            limitAmount={limitAmount}
            balanceAmount={balanceAmount}
            currency={currency}
            isDark={isDark}
            onRefresh={fetchTransactions}
            isRefreshing={isRefreshing}
          />

          {/* Quick Action Cards: Dépôt (Green) & Retirer (Red/Orange) (Page 9 & 46) */}
          <QuickActionButtons
            onOpenDeposit={() => setIsDepositOpen(true)}
            onOpenWithdraw={() => setIsWithdrawOpen(true)}
            isDark={isDark}
          />

          {/* Quick Services Bar (Infographic PDF: إلغاء الإيداع، التحقق، الصرافين، الدليل) */}
          <button
            type="button"
            onClick={() => setIsUSDTDepositOpen(true)}
            className={`w-full rounded-3xl p-4 sm:p-5 flex items-center justify-between transition-all cursor-pointer active:scale-95 border ${
              isDark
                ? 'bg-slate-900/95 hover:bg-slate-800/90 border-slate-800 text-white shadow-sm'
                : 'bg-white hover:bg-slate-50 border-slate-200/80 text-slate-800 shadow-sm'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 shadow-xs">
                <Wallet className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div className="text-right flex flex-col items-start">
                <span className="font-bold text-sm sm:text-base tracking-wide">
                  {t('deposit_usdt_btn', 'إضافة الأموال للصرافة (USDT)')}
                </span>
                <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {t('deposit_usdt_desc', 'شحن رصيد الوكالة الخاص بك')}
                </span>
              </div>
            </div>
          </button>

          {/* Recent Transactions List (Page 46: №...113, ID, Time, +100.00) */}
          <RecentTransactionsList
            transactions={transactions}
            isDark={isDark}
            onSelectTransaction={(tx) => setSelectedTransaction(tx)}
            onRefresh={fetchTransactions}
          />
        </div>

        {/* Discreet Mobile Footer Indicator */}
        <footer className="py-4 text-center text-[11px] text-slate-400 font-medium">
          MobCash Mobile Terminal &bull; {user.agent_id}
        </footer>
      </div>

      {/* Interactive Modals */}
      <DepositModal
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
        currentLimit={limitAmount}
        availableBalance={balanceAmount}
        currency={currency}
        depositRate={user.commission_deposit || 5}
        onExecuteDeposit={handleExecuteDeposit}
        onOpenDepositUSDT={() => {
          setIsDepositOpen(false);
          setIsUSDTDepositOpen(true);
        }}
        isDark={isDark}
      />

      <WithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        currency={currency}
        withdrawRate={user.commission_withdraw || 5}
        onExecuteWithdraw={handleExecuteWithdraw}
        isDark={isDark}
      />

      

      

      

      

      <DepositUSDTModal
        isOpen={isUSDTDepositOpen}
        onClose={() => setIsUSDTDepositOpen(false)}
        isDark={isDark}
        user={user}
        onDepositSuccess={fetchAgentData}
      />

      <LiveSupportModal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
        isDark={isDark}
        user={user}
      />

      <ProfileDrawer
        onOpenSupport={() => setIsSupportOpen(true)}
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user}
        depositRate={user.commission_deposit || 5}
        withdrawRate={user.commission_withdraw || 5}
        onLogout={() => {
          logout();
          navigate('/agent/login');
        }}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />

      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        isDark={isDark}
      />

      <TransactionDetailsModal
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        isDark={isDark}
      />

      
    </div>
  );
}
