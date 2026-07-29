const fs = require('fs');
const file = 'src/pages/agent/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/{txSuccess\.type === 'deposit' \? 'إيداع' : 'سحب'}/g, "{txSuccess.type === 'deposit' ? t('deposit_type') : t('withdraw_type')}");

fs.writeFileSync(file, content);
