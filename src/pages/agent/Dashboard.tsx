import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth';
import { supabase } from '../../lib/supabase';
import { MobCashHeader } from './components/MobCashHeader';
import { LimitBalanceCard } from './components/LimitBalanceCard';
import { QuickActionButtons } from './components/QuickActionButtons';
import { QuickServicesBar } from './components/QuickServicesBar';
import { RecentTransactionsList, MobCashTransaction } from './components/RecentTransactionsList';
import { DepositModal } from './components/DepositModal';
import { WithdrawModal } from './components/WithdrawModal';
import { CancelDepositModal } from './components/CancelDepositModal';
import { PartnershipModal } from './components/PartnershipModal';
import { SubagentsModal } from './components/SubagentsModal';
import { AgentGuideModal } from './components/AgentGuideModal';
import { ProfileDrawer } from './components/ProfileDrawer';
import { NotificationsModal } from './components/NotificationsModal';
import { TransactionDetailsModal } from './components/TransactionDetailsModal';
import { PrepaymentModal } from './components/PrepaymentModal';

export default function AgentDashboard() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

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

  const [balanceAmount, setBalanceAmount] = useState<number>(() => {
    const saved = localStorage.getItem(`mobcash_solde_${user?.agent_id || 'default'}`);
    return saved ? parseFloat(saved) : 1634208.81;
  });

  // Transactions State
  const [transactions, setTransactions] = useState<MobCashTransaction[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Modals state
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isCancelDepositOpen, setIsCancelDepositOpen] = useState(false);
  const [isPartnershipOpen, setIsPartnershipOpen] = useState(false);
  const [isSubagentsOpen, setIsSubagentsOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isPrepaymentOpen, setIsPrepaymentOpen] = useState(false);
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
    const rate = user.commission_deposit || 5;
    const commissionEarned = (amount * rate) / 100;
    const shortRef = Math.floor(100 + Math.random() * 900).toString();

    const newTx: MobCashTransaction = {
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

    // Update state & balances
    setLimitAmount((prev) => Math.max(0, prev - amount));
    setBalanceAmount((prev) => prev + amount);

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

    return newTx;
  };

  // Execute Withdraw: increases Limit/Balance, logs transaction
  const handleExecuteWithdraw = async (
    playerId: string,
    confirmCode: string,
    amount: number,
    note?: string
  ) => {
    if (!user) return;
    const rate = user.commission_withdraw || 5;
    const commissionEarned = (amount * rate) / 100;
    const shortRef = Math.floor(100 + Math.random() * 900).toString();

    const newTx: MobCashTransaction = {
      id: 'tx_' + Date.now(),
      tx_number: `№...${shortRef}`,
      agent_id: user.agent_id,
      type: 'withdraw',
      customer_phone: playerId,
      amount: amount,
      commission_rate: rate,
      commission_earned: commissionEarned,
      note: note || `Retrait validé (Code: ${confirmCode})`,
      status: 'completed',
      created_at: new Date().toISOString(),
    };

    // Update state & balances
    setBalanceAmount((prev) => prev + amount);

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
          note: `Code: ${confirmCode}`,
          status: 'completed',
          created_at: newTx.created_at,
        },
      ]);
    } catch (e) {
      console.warn('Supabase insert note:', e);
    }

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

  const isRtl = ['ar', 'ur', 'fa'].includes(i18n.language?.split('-')[0] || 'en');

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
            isDark={isDark}
            onToggleTheme={toggleTheme}
          />

          {/* Limit & Balance Card (Page 46: Limite du PDV, bold amount, Solde, blue bar, eye toggle) */}
          <LimitBalanceCard
            limitAmount={limitAmount}
            balanceAmount={balanceAmount}
            currency="USD"
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
          <QuickServicesBar
            onOpenCancelDeposit={() => setIsCancelDepositOpen(true)}
            onOpenPartnership={() => setIsPartnershipOpen(true)}
            onOpenPrepayment={() => setIsPrepaymentOpen(true)}
            onOpenSubagents={() => setIsSubagentsOpen(true)}
            onOpenGuide={() => setIsGuideOpen(true)}
            isDark={isDark}
          />

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
        depositRate={user.commission_deposit || 5}
        onExecuteDeposit={handleExecuteDeposit}
        isDark={isDark}
      />

      <WithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        withdrawRate={user.commission_withdraw || 5}
        onExecuteWithdraw={handleExecuteWithdraw}
        isDark={isDark}
      />

      <CancelDepositModal
        isOpen={isCancelDepositOpen}
        onClose={() => setIsCancelDepositOpen(false)}
        recentDeposits={transactions.filter((t) => t.type === 'deposit')}
        onExecuteCancel={handleExecuteCancel}
        isDark={isDark}
      />

      <PartnershipModal
        isOpen={isPartnershipOpen}
        onClose={() => setIsPartnershipOpen(false)}
        agentId={user.agent_id}
        fullName={user.first_name || user.full_name || 'Authorized Agent'}
        country={user.country || 'المملكة العربية السعودية'}
        city={user.city || 'الرياض'}
        isDark={isDark}
      />

      <SubagentsModal
        isOpen={isSubagentsOpen}
        onClose={() => setIsSubagentsOpen(false)}
        agentId={user.agent_id}
        depositRate={user.commission_deposit || 5}
        withdrawRate={user.commission_withdraw || 5}
        isDark={isDark}
      />

      <AgentGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        isDark={isDark}
      />

      <ProfileDrawer
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

      <PrepaymentModal
        isOpen={isPrepaymentOpen}
        onClose={() => setIsPrepaymentOpen(false)}
        limitAmount={limitAmount}
        balanceAmount={balanceAmount}
        agentId={user.agent_id}
        isDark={isDark}
      />
    </div>
  );
}
