const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/CreateAgent.tsx', 'utf8');

code = code.replace(/full_name: '',/g, `full_name: '',\n    agency_name: '',`);

code = code.replace(/full_name: formData.full_name,/g, `full_name: formData.agency_name ? \`\${formData.full_name} (\${formData.agency_name})\` : formData.full_name,`);

code = code.replace(/<label className="block text-sm font-medium text-gray-700 mb-2">\{t\('full_name'\)\}<\/label>/g, `<label className="block text-sm font-medium text-gray-700 mb-2">{t('full_name')}</label>`);

// Add agency_name field right after full_name
const agencyField = `            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('agency_name', 'اسم الوكالة')}</label>
              <input
                type="text"
                value={formData.agency_name}
                onChange={(e) => setFormData({ ...formData, agency_name: e.target.value })}
                placeholder={t('agency_name_placeholder', 'اختياري')}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-secondary focus:border-secondary bg-white text-gray-950 font-semibold"
              />
            </div>
`;

code = code.replace(/<div className="col-span-1 md:col-span-2">\s*<label className="block text-sm font-medium text-gray-700 mb-2">\{t\('full_name'\)\}<\/label>\s*<input\s*type="text"\s*required\s*value=\{formData\.full_name\}\s*onChange=\{\(e\) => setFormData\(\{ \.\.\.formData, full_name: e\.target\.value \}\)\}\s*className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-secondary focus:border-secondary bg-white text-gray-950 font-semibold"\s*\/>\s*<\/div>/, match => match + '\n' + agencyField);

fs.writeFileSync('src/pages/admin/CreateAgent.tsx', code);
