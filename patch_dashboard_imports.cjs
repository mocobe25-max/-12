const fs = require('fs');
let code = fs.readFileSync('src/pages/agent/Dashboard.tsx', 'utf8');

if (!code.includes('const navigate = useNavigate();')) {
  code = code.replace(/const \{ t \} = useTranslation\(\);/, "const { t } = useTranslation();\n  const navigate = useNavigate();");
}

fs.writeFileSync('src/pages/agent/Dashboard.tsx', code);
