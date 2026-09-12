const fs = require('fs');
let code = fs.readFileSync('src/pages/agent/Dashboard.tsx', 'utf-8');

// Replace local storage balance with real DB fetch
code = code.replace(
  /const \[balanceAmount, setBalanceAmount\] = useState<number>\(\(\) => \{[\s\S]*?\}\);/,
  `const [balanceAmount, setBalanceAmount] = useState<number>(user?.balance || 0);
  const [currency, setCurrency] = useState<string>(user?.currency || 'USD');`
);

// We need a fetch logic
code = code.replace(
  /const fetchTransactions = async \(\) => \{/,
  `const fetchAgentData = async () => {
    if (!user?.agent_id) return;
    const { data } = await supabase.from('agents').select('balance, currency').eq('agent_id', user.agent_id).single();
    if (data) {
      setBalanceAmount(data.balance || 0);
      setCurrency(data.currency || 'USD');
      
      // Update store user object to keep it in sync
      const updatedUser = { ...user, balance: data.balance, currency: data.currency };
      useAuthStore.getState().setUser(updatedUser, 'agent');
    }
  };
  const fetchTransactions = async () => {
`
);

// Call fetchAgentData in useEffect
code = code.replace(
  /fetchTransactions\(\);/,
  `fetchTransactions();
    fetchAgentData();`
);

fs.writeFileSync('src/pages/agent/Dashboard.tsx', code);
