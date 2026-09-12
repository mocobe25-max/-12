const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  /import DeviceActivation from '\.\/pages\/admin\/DeviceActivation';/,
  `import DeviceActivation from './pages/admin/DeviceActivation';
import AdminDeposits from './pages/admin/AdminDeposits';
import AdminSupport from './pages/admin/AdminSupport';`
);

code = code.replace(
  /<Route path="device-activation" element=\{<DeviceActivation \/>} \/>/,
  `<Route path="device-activation" element={<DeviceActivation />} />
          <Route path="deposits" element={<AdminDeposits />} />
          <Route path="support" element={<AdminSupport />} />`
);

fs.writeFileSync('src/App.tsx', code);
