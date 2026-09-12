const fs = require('fs');
let code = fs.readFileSync('src/pages/agent/components/LimitBalanceCard.tsx', 'utf-8');

code = code.replace(
  /const formatNumber = \(val: number\) => \{[\s\S]*?\};/,
  `const formatNumber = (val: number) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val) + ' ' + currency;
  };`
);

fs.writeFileSync('src/pages/agent/components/LimitBalanceCard.tsx', code);
