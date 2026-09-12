const fs = require('fs');
let code = fs.readFileSync('src/layouts/AdminLayout.tsx', 'utf-8');

code = code.replace(
  /import \{ Shield, Users, PlusCircle, LogOut, LayoutDashboard, Menu, X, MonitorSmartphone \} from 'lucide-react';/,
  `import { Shield, Users, PlusCircle, LogOut, LayoutDashboard, Menu, X, MonitorSmartphone, Wallet, MessageSquare } from 'lucide-react';`
);

code = code.replace(
  /\{ path: '\/admin\/device-activation', icon: MonitorSmartphone, label: t\('device_activation', 'تفعيل الأجهزة'\) \},/,
  `{ path: '/admin/device-activation', icon: MonitorSmartphone, label: t('device_activation', 'تفعيل الأجهزة') },
    { path: '/admin/deposits', icon: Wallet, label: t('manage_deposits', 'طلبات الإيداع (USDT)') },
    { path: '/admin/support', icon: MessageSquare, label: t('support_tickets', 'الدعم المباشر') },`
);

fs.writeFileSync('src/layouts/AdminLayout.tsx', code);
