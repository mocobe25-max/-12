const fs = require('fs');
let code = fs.readFileSync('src/pages/agent/Dashboard.tsx', 'utf-8');

code = code.replace(
  /import \{ DepositUSDTModal \} from '\.\/components\/DepositUSDTModal';/,
  `import { DepositUSDTModal } from './components/DepositUSDTModal';\nimport { LiveSupportModal } from './components/LiveSupportModal';`
);

code = code.replace(
  /const \[isProfileOpen, setIsProfileOpen\] = useState\(false\);/,
  `const [isProfileOpen, setIsProfileOpen] = useState(false);\n  const [isSupportOpen, setIsSupportOpen] = useState(false);`
);

code = code.replace(
  /<ProfileDrawer/,
  `<ProfileDrawer\n          onOpenSupport={() => setIsSupportOpen(true)}`
);

code = code.replace(
  /\{isProfileOpen && \(/,
  `{isSupportOpen && (
        <LiveSupportModal
          isOpen={isSupportOpen}
          onClose={() => setIsSupportOpen(false)}
          isDark={isDark}
          user={user}
        />
      )}
      {isProfileOpen && (`
);

fs.writeFileSync('src/pages/agent/Dashboard.tsx', code);
