const fs = require('fs');

const file = 'src/pages/admin/Login.tsx';
let content = fs.readFileSync(file, 'utf8');

// Remove empty version wrappers
content = content.replace(/<span className="text-gray-400 text-sm font-medium mb-4 tracking-wider">\s*<\/span>/g, '');

fs.writeFileSync(file, content);
