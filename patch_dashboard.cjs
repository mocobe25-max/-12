const fs = require('fs');
let code = fs.readFileSync('src/pages/agent/Dashboard.tsx', 'utf8');

const replacement = `  useEffect(() => {
    if (user) {
      checkDeviceStatus();
      supabase.from('agents').update({ current_step: 'Dashboard' }).eq('id', user.id);
      fetchTransactions();
    }
  }, [user]);

  const checkDeviceStatus = async () => {
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
        .single();
        
      if (!data || data.status !== 'active') {
        navigate('/agent/device-activation');
      }
    } catch (e) {
      console.error(e);
    }
  };`;

code = code.replace(/  useEffect\(\(\) => \{\n    if \(user\) \{\n      supabase.from\('agents'\).update\(\{ current_step: 'Dashboard' \}\).eq\('id', user.id\);\n      fetchTransactions\(\);\n    \}\n  \}, \[user\]\);/g, replacement);

fs.writeFileSync('src/pages/agent/Dashboard.tsx', code);
