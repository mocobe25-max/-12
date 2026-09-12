const fs = require('fs');
let code = fs.readFileSync('src/pages/agent/Dashboard.tsx', 'utf-8');

// Import DepositUSDTModal
code = code.replace(
  /import \{ QuickServicesBar \} from '\.\/components\/QuickServicesBar';/,
  `import { Wallet } from 'lucide-react';\nimport { DepositUSDTModal } from './components/DepositUSDTModal';`
);

// Remove QuickServicesBar state
code = code.replace(/const \[isCancelDepositOpen, setIsCancelDepositOpen\] = useState\(false\);/, '');
code = code.replace(/const \[isPartnershipOpen, setIsPartnershipOpen\] = useState\(false\);/, '');
code = code.replace(/const \[isSubagentsOpen, setIsSubagentsOpen\] = useState\(false\);/, '');
code = code.replace(/const \[isPrepaymentOpen, setIsPrepaymentOpen\] = useState\(false\);/, '');
code = code.replace(/const \[isGuideOpen, setIsGuideOpen\] = useState\(false\);/, '');

// Add isUSDTDepositOpen state
code = code.replace(
  /const \[isWithdrawOpen, setIsWithdrawOpen\] = useState\(false\);/,
  `const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);\n  const [isUSDTDepositOpen, setIsUSDTDepositOpen] = useState(false);`
);

// Replace QuickServicesBar component call with USDT Deposit Button
code = code.replace(
  /<QuickServicesBar[\s\S]*?\/>/,
  `<button
            type="button"
            onClick={() => setIsUSDTDepositOpen(true)}
            className={\`w-full rounded-3xl p-4 sm:p-5 flex items-center justify-between transition-all cursor-pointer active:scale-95 border \${
              isDark
                ? 'bg-slate-900/95 hover:bg-slate-800/90 border-slate-800 text-white shadow-sm'
                : 'bg-white hover:bg-slate-50 border-slate-200/80 text-slate-800 shadow-sm'
            }\`}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 shadow-xs">
                <Wallet className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div className="text-right flex flex-col items-start">
                <span className="font-bold text-sm sm:text-base tracking-wide">
                  {t('deposit_usdt_btn', 'إضافة الأموال للصرافة (USDT)')}
                </span>
                <span className={\`text-xs \${isDark ? 'text-slate-400' : 'text-slate-500'}\`}>
                  {t('deposit_usdt_desc', 'شحن رصيد الوكالة الخاص بك')}
                </span>
              </div>
            </div>
          </button>`
);

// Remove the old Modals that were in QuickServicesBar
code = code.replace(/<CancelDepositModal[\s\S]*?\/>/, '');
code = code.replace(/<PartnershipModal[\s\S]*?\/>/, '');
code = code.replace(/<PrepaymentModal[\s\S]*?\/>/, '');
code = code.replace(/<SubagentsModal[\s\S]*?\/>/, '');
code = code.replace(/<AgentGuideModal[\s\S]*?\/>/, '');

// Add DepositUSDTModal
code = code.replace(
  /\{isDepositOpen && \(/,
  `{isUSDTDepositOpen && (
        <DepositUSDTModal
          isOpen={isUSDTDepositOpen}
          onClose={() => setIsUSDTDepositOpen(false)}
          isDark={isDark}
          user={user}
        />
      )}
      {isDepositOpen && (`
);

fs.writeFileSync('src/pages/agent/Dashboard.tsx', code);
