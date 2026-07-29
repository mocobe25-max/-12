const fs = require('fs');

const file = 'src/pages/agent/Activate.tsx';
let content = fs.readFileSync(file, 'utf8');

const replacements = [
  ['امسح الرمز للدفع (Scan to pay)', "{t('scan_to_pay')}"],
  ["{t('deposit_address')} (USDT TRC20)", "{t('deposit_address_usdt')}"],
  ['تم النسخ', "{t('copied_success')}"],
  ['<span>نسخ</span>', "<span>{t('copy')}</span>"],
  ['يرجى التأكد من تحويل المبلغ عبر شبكة TRC20 فقط لتجنب فقدان الأموال.', "{t('trc20_warning')}"],
  ["`*الخطوة الحالية:* في انتظار المراجعة`", "`*Status:* ${t('wait_for_review', 'في انتظار المراجعة')}`"]
];

for (const [ar, en] of replacements) {
  content = content.replace(new RegExp(ar.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), en);
}

fs.writeFileSync(file, content);
console.log('updated');
