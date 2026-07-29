const fs = require('fs');

const file = 'src/pages/agent/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

const replacements = [
  ['بوابة الوكيل المعتمد (Authorized Agent Portal)', "{t('authorized_agent_portal')}"],
  ['(مفعل رسمياً)', "{t('status_active')}"],
  ['رصيد متاح للسحب الفوري', "{t('available_for_instant_withdrawal')}"],
  ['(عمولة الإيداع المعتمدة)', "({t('approved_deposit_commission')})"],
  ['(عمولة السحب المعتمدة)', "({t('approved_withdraw_commission')})"],
  ['محطة العمليات المالية المعتمدة', "{t('approved_financial_operations')}"],
  ['نظام الإيداع والسحب الفوري للوكلاء', "{t('instant_deposit_withdraw_system')}"],
  ['قم بإتمام عمليات الإيداع والسحب لحسابات العملاء مع الاحتساب التلقائي للعمولات والتوثيق اللحظي في السجلات الرسمية.', "{t('system_description')}"],
  ['إيداع نقدي (Deposit)', "{t('cash_deposit')}"],
  ['سحب نقدي (Withdraw)', "{t('cash_withdraw')}"],
  ['تم تنفيذ العملية بنجاح تام!', "{t('operation_success')}"],
  ['نوع العملية:', "{t('operation_type')}:"],
  ['المبلغ:', "{t('amount_label')}:"],
  ['العمولة المكتسبة:', "{t('earned_commission')}:"],
  ['رقم الهاتف:', "{t('phone_number_label')}:"],
  ['التاريخ:', "{t('date_label')}:"],
  ['إغلاق', "{t('close')}"],
  ['رقم هاتف العميل / معرف الحساب (Customer Phone / Account ID)', "{t('customer_phone_account')}"],
  ['مثال: +966500000000 أو 982341', "{t('phone_example')}"],
  ["المبلغ المراد {txTab === 'deposit' ? 'إيداعه' : 'سحبه'} بالدولار ($)", "{txTab === 'deposit' ? t('amount_to_deposit') : t('amount_to_withdraw')}"],
  ['الحد الأدنى: $10.00', "{t('minimum_amount')}"],
  ['مبالغ سريعة محددة مسبقاً:', "{t('preset_amounts')}"],
  ['ملاحظات أو تفاصيل العملية (Optional Note)', "{t('notes_optional')}"],
  ['أدخل أي ملاحظات خاصة بعملية التحويل النقدي...', "{t('notes_placeholder')}"],
  ["نسبة عمولتك ({txTab === 'deposit' ? 'إيداع' : 'سحب'}):", "{t('your_commission_rate')} ({txTab === 'deposit' ? t('deposit_type') : t('withdraw_type')}):"],
  ['إجمالي العمولة المكتسبة:', "{t('total_earned_commission')}"],
  ['جاري معالجة المعاملة...', "{t('processing_transaction')}"],
  ["تأكيد وتنفيذ {txTab === 'deposit' ? 'إيداع' : 'سحب'} المبالغ فوراً", "{txTab === 'deposit' ? t('confirm_execute_deposit') : t('confirm_execute_withdraw')}"],
  ['أداء الأرباح والمعاملات الأسبوعية', "{t('weekly_performance')}"],
  ['الوضع المالي: ممتاز', "{t('financial_status_excellent')}"],
  ['بيانات الوكالة والاعتماد', "{t('agency_info_accreditation')}"],
  ['الاسم الكامل:', "{t('full_name_label')}"],
  ['الدولة / المدينة:', "{t('country_city_label')}"],
  ['البنك / المحفظة:', "{t('bank_wallet_label')}"],
  ['حساب وكيل معتمد رسمياً', "{t('officially_accredited_agent')}"],
  ['جميع الصلاحيات التشغيلية مفعلة', "{t('all_operational_powers_active')}"],
  ['سجل المعاملات الفورية', "{t('instant_transactions_log')}"],
  ["{tx.type === 'deposit' ? 'إيداع' : 'سحب'}", "{tx.type === 'deposit' ? t('deposit_type') : t('withdraw_type')}"],
  ["'معاملة مالية معتمدة'", "t('approved_financial_transaction')"],
  ["'عملية إيداع نقدي' : 'عملية سحب نقدي'", "t('cash_deposit') : t('cash_withdraw')"]
];

for (const [ar, en] of replacements) {
  content = content.replace(new RegExp(ar.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'), en);
}

fs.writeFileSync(file, content);
console.log('updated');
