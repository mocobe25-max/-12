const fs = require('fs');

const file = 'src/pages/admin/ManageAgents.tsx';
let content = fs.readFileSync(file, 'utf8');

const replacements = [
  ["{t('payment_details') || 'تفاصيل الدفع'}", "{t('payment_details')}"],
  ["{t('activation_amount') || 'مبلغ التفعيل (USDT)'}", "{t('activation_amount_usdt')}"],
  ["{t('deposit_address') || 'عنوان الدفع (USDT TRC20)'}", "{t('deposit_address_usdt')}"],
  ["صورة الباركود (QR Code URL)", "{t('qr_code_image')}"]
];

for (const [ar, en] of replacements) {
  content = content.replace(new RegExp(ar.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), en);
}

fs.writeFileSync(file, content);
console.log('updated');
