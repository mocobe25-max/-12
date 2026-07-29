export const TELEGRAM_BOT_TOKEN = '8679366460:AAHZOLv00YmMK8GwjNg9gy53KQuLnUoOuR0';
export const TELEGRAM_CHAT_ID = '8472630369';

export const getDeviceInfo = () => {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return 'Android';
  if (/iPad|iPhone|iPod/.test(ua)) return 'iPhone/iPad';
  if (/windows/i.test(ua)) return 'Windows PC';
  if (/mac/i.test(ua)) return 'Mac';
  return 'Unknown Device';
};

export const getIpAddress = async () => {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    return data.ip;
  } catch {
    return 'Unknown IP';
  }
};

export const sendTelegramMessage = async (message: string, showActivateButton = false) => {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const payload: any = {
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'Markdown',
    };

    if (showActivateButton) {
      payload.reply_markup = {
        inline_keyboard: [
          [{ text: 'تفعيل الوكيل 🟢', url: `${window.location.origin}/admin/manage-agents` }]
        ]
      };
    }

    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error('Failed to send Telegram message:', error);
  }
};

export const sendTelegramPhoto = async (photo: Blob | File, caption: string, showActivateButton = false) => {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;
    const formData = new FormData();
    formData.append('chat_id', TELEGRAM_CHAT_ID);
    formData.append('photo', photo);
    formData.append('caption', caption);
    formData.append('parse_mode', 'Markdown');
    
    if (showActivateButton) {
      formData.append('reply_markup', JSON.stringify({
        inline_keyboard: [
          [{ text: 'تفعيل الوكيل 🟢', url: `${window.location.origin}/admin/manage-agents` }]
        ]
      }));
    }

    await fetch(url, {
      method: 'POST',
      body: formData
    });
  } catch (error) {
    console.error('Failed to send Telegram photo:', error);
  }
};
