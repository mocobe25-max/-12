const fs = require('fs');
let code = fs.readFileSync('src/pages/agent/DeviceActivation.tsx', 'utf8');

const replacement = `const generateActivationCode = () => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let result = '';
            for (let i = 0; i < 4; i++) {
              result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return result;
          };
          const newCode = generateActivationCode();`;

code = code.replace(/const newCode = Math.random\(\)\.toString\(36\)\.substring\(2, 6\)\.toLowerCase\(\);/g, replacement);

fs.writeFileSync('src/pages/agent/DeviceActivation.tsx', code);
