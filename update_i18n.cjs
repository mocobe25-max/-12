const fs = require('fs');

const file = 'src/locales/allLanguages.ts';
let content = fs.readFileSync(file, 'utf8');

const newKeys = {
  authorized_agent_portal: "Authorized Agent Portal",
  status_active: "Active (Officially Verified)",
  available_for_instant_withdrawal: "Available for instant withdrawal",
  approved_deposit_commission: "Approved Deposit Commission",
  approved_withdraw_commission: "Approved Withdraw Commission",
  approved_financial_operations: "Approved Financial Operations Terminal",
  instant_deposit_withdraw_system: "Instant Deposit & Withdrawal System for Agents",
  system_description: "Process deposit and withdrawal operations for customer accounts with automatic commission calculation and instant documentation in official records.",
  cash_deposit: "Cash Deposit (Deposit)",
  cash_withdraw: "Cash Withdraw (Withdraw)",
  operation_success: "Operation executed successfully!",
  operation_type: "Operation Type",
  amount_label: "Amount",
  earned_commission: "Earned Commission",
  phone_number_label: "Phone Number",
  date_label: "Date",
  close: "Close",
  customer_phone_account: "Customer Phone / Account ID",
  phone_example: "Example: +966500000000 or 982341",
  amount_to_deposit: "Amount to deposit in USD ($)",
  amount_to_withdraw: "Amount to withdraw in USD ($)",
  minimum_amount: "Minimum: $10.00",
  preset_amounts: "Pre-defined Quick Amounts:",
  notes_optional: "Notes or Operation Details (Optional)",
  notes_placeholder: "Enter any special notes for the money transfer...",
  your_commission_rate: "Your Commission Rate",
  total_earned_commission: "Total Earned Commission:",
  processing_transaction: "Processing transaction...",
  confirm_execute_deposit: "Confirm and Execute Deposit Immediately",
  confirm_execute_withdraw: "Confirm and Execute Withdraw Immediately",
  weekly_performance: "Weekly Earnings and Transactions Performance",
  financial_status_excellent: "Financial Status: Excellent",
  agency_info_accreditation: "Agency Information & Accreditation",
  full_name_label: "Full Name:",
  country_city_label: "Country / City:",
  bank_wallet_label: "Bank / Wallet:",
  officially_accredited_agent: "Officially Accredited Agent Account",
  all_operational_powers_active: "All operational powers are active",
  instant_transactions_log: "Instant Transactions Log",
  deposit_type: "Deposit",
  withdraw_type: "Withdraw",
  approved_financial_transaction: "Approved Financial Transaction",
  scan_to_pay: "Scan to pay",
  deposit_address_usdt: "Deposit Address (USDT TRC20)",
  copied_success: "Copied successfully",
  trc20_warning: "Please make sure to transfer the amount via TRC20 network only to avoid losing funds.",
  wait_for_review: "Wait for review",
  activation_amount_usdt: "Activation Amount (USDT)",
  qr_code_image: "QR Code Image URL"
};

const entries = Object.entries(newKeys).map(([k, v]) => `  ${k}: "${v}",`).join('\n');

content = content.replace(/export const baseEn = \{/, `export const baseEn = {\n${entries}`);

const arKeys = {
  authorized_agent_portal: "بوابة الوكيل المعتمد (Authorized Agent Portal)",
  status_active: "Active (مفعل رسمياً)",
  available_for_instant_withdrawal: "رصيد متاح للسحب الفوري",
  approved_deposit_commission: "عمولة الإيداع المعتمدة",
  approved_withdraw_commission: "عمولة السحب المعتمدة",
  approved_financial_operations: "محطة العمليات المالية المعتمدة",
  instant_deposit_withdraw_system: "نظام الإيداع والسحب الفوري للوكلاء",
  system_description: "قم بإتمام عمليات الإيداع والسحب لحسابات العملاء مع الاحتساب التلقائي للعمولات والتوثيق اللحظي في السجلات الرسمية.",
  cash_deposit: "إيداع نقدي (Deposit)",
  cash_withdraw: "سحب نقدي (Withdraw)",
  operation_success: "تم تنفيذ العملية بنجاح تام!",
  operation_type: "نوع العملية",
  amount_label: "المبلغ",
  earned_commission: "العمولة المكتسبة",
  phone_number_label: "رقم الهاتف",
  date_label: "التاريخ",
  close: "إغلاق",
  customer_phone_account: "رقم هاتف العميل / معرف الحساب (Customer Phone / Account ID)",
  phone_example: "مثال: +966500000000 أو 982341",
  amount_to_deposit: "المبلغ المراد إيداعه بالدولار ($)",
  amount_to_withdraw: "المبلغ المراد سحبه بالدولار ($)",
  minimum_amount: "الحد الأدنى: $10.00",
  preset_amounts: "مبالغ سريعة محددة مسبقاً:",
  notes_optional: "ملاحظات أو تفاصيل العملية (Optional Note)",
  notes_placeholder: "أدخل أي ملاحظات خاصة بعملية التحويل النقدي...",
  your_commission_rate: "نسبة عمولتك",
  total_earned_commission: "إجمالي العمولة المكتسبة:",
  processing_transaction: "جاري معالجة المعاملة...",
  confirm_execute_deposit: "تأكيد وتنفيذ إيداع المبالغ فوراً",
  confirm_execute_withdraw: "تأكيد وتنفيذ سحب المبالغ فوراً",
  weekly_performance: "أداء الأرباح والمعاملات الأسبوعية",
  financial_status_excellent: "الوضع المالي: ممتاز",
  agency_info_accreditation: "بيانات الوكالة والاعتماد",
  full_name_label: "الاسم الكامل:",
  country_city_label: "الدولة / المدينة:",
  bank_wallet_label: "البنك / المحفظة:",
  officially_accredited_agent: "حساب وكيل معتمد رسمياً",
  all_operational_powers_active: "جميع الصلاحيات التشغيلية مفعلة",
  instant_transactions_log: "سجل المعاملات الفورية",
  deposit_type: "إيداع",
  withdraw_type: "سحب",
  approved_financial_transaction: "معاملة مالية معتمدة",
  scan_to_pay: "امسح الرمز للدفع (Scan to pay)",
  deposit_address_usdt: "عنوان الدفع (USDT TRC20)",
  copied_success: "تم النسخ",
  trc20_warning: "يرجى التأكد من تحويل المبلغ عبر شبكة TRC20 فقط لتجنب فقدان الأموال.",
  wait_for_review: "في انتظار المراجعة",
  activation_amount_usdt: "مبلغ التفعيل (USDT)",
  qr_code_image: "صورة الباركود (QR Code URL)"
};

const arEntries = Object.entries(arKeys).map(([k, v]) => `    ${k}: "${v}",`).join('\n');
content = content.replace(/ar: \{[\s\S]*?(?=\},)/, match => {
  return match.replace(/ar: \{/, `ar: {\n${arEntries}`);
});

fs.writeFileSync(file, content);
console.log('updated');
