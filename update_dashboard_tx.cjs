const fs = require('fs');
let code = fs.readFileSync('src/pages/agent/Dashboard.tsx', 'utf-8');

// handleExecuteDeposit
code = code.replace(
  /const handleExecuteDeposit = async \([\s\S]*?\/\/ Update state & balances/m,
  `const handleExecuteDeposit = async (playerId: string, amount: number, note?: string) => {
    if (!user) return;
    const rate = user.commission_deposit || 5;
    const commissionEarned = (amount * rate) / 100;
    const shortRef = Math.floor(100 + Math.random() * 900).toString();
    const newTx = {
      id: 'tx_' + Date.now(),
      tx_number: \`№...\${shortRef}\`,
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
    
    // Deduct balance
    const newBalance = balanceAmount - amount;
    await supabase.from('agents').update({ balance: newBalance }).eq('agent_id', user.agent_id);
    
    // Refresh
    setBalanceAmount(newBalance);
    fetchTransactions();
    
    // Update state & balances`
);

// handleExecuteWithdraw
code = code.replace(
  /const handleExecuteWithdraw = async \([\s\S]*?\/\/ Update state & balances/m,
  `const handleExecuteWithdraw = async (playerId: string, withdrawCode: string, amount: number, note?: string) => {
    if (!user) return;
    const rate = user.commission_withdraw || 5;
    const commissionEarned = (amount * rate) / 100;
    const shortRef = Math.floor(100 + Math.random() * 900).toString();
    const newTx = {
      id: 'tx_' + Date.now(),
      tx_number: \`№...\${shortRef}\`,
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
    
    // Refresh
    setBalanceAmount(newBalance);
    fetchTransactions();

    // Update state & balances`
);

fs.writeFileSync('src/pages/agent/Dashboard.tsx', code);
