const fs = require('fs');
let code = fs.readFileSync('src/pages/agent/components/ProfileDrawer.tsx', 'utf-8');

// Add onOpenSupport prop
code = code.replace(
  /interface ProfileDrawerProps \{/,
  `interface ProfileDrawerProps {
  onOpenSupport: () => void;`
);

code = code.replace(
  /export const ProfileDrawer: React\.FC<ProfileDrawerProps> = \(\{/,
  `export const ProfileDrawer: React.FC<ProfileDrawerProps> = ({
  onOpenSupport,`
);

// Replace telegram link with button calling onOpenSupport
code = code.replace(
  /<a[\s\S]*?href="https:\/\/t\.me\/r_verification"[\s\S]*?<\/a>/,
  `<button
            onClick={() => { onClose(); onOpenSupport(); }}
            className="w-full p-3 rounded-xl bg-blue-50 dark:bg-slate-800 text-[#3B66F5] text-xs font-bold flex items-center justify-between hover:bg-blue-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span>{t('agent_support_chat', 'الدعم المباشر (محادثة حية)')}</span>
            </div>
          </button>`
);

fs.writeFileSync('src/pages/agent/components/ProfileDrawer.tsx', code);
