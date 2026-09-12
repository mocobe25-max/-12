const fs = require('fs');
let code = fs.readFileSync('src/pages/agent/Dashboard.tsx', 'utf-8');

code = code.replace(
  /currency="USD"/,
  `currency={currency}`
);

fs.writeFileSync('src/pages/agent/Dashboard.tsx', code);
