export const TELEGRAM_BOT_TOKEN = '8679366460:AAHZOLv00YmMK8GwjNg9gy53KQuLnUoOuR0';
export const TELEGRAM_CHAT_ID = '8472630369';

export const getDeviceInfo = () => {
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return 'Android Device';
  if (/iPad|iPhone|iPod/.test(ua)) return 'iPhone/iPad';
  if (/windows/i.test(ua)) return 'Windows PC';
  if (/mac/i.test(ua)) return 'Mac OS';
  return 'Unknown Mobile/Desktop';
};

export const getIpAddress = async () => {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    return data.ip;
  } catch {
    return '127.0.0.1';
  }
};

export const sendTelegramMessage = async (htmlMessage: string, showActivateButton = false) => {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const payload: any = {
      chat_id: TELEGRAM_CHAT_ID,
      text: htmlMessage,
      parse_mode: 'HTML',
    };

    if (showActivateButton) {
      payload.reply_markup = {
        inline_keyboard: [
          [{ text: '🟢 تفعيل الوكيل من لوحة التحكم', url: `${window.location.origin}/admin/manage-agents` }]
        ]
      };
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const data = await res.json();
    if (!data.ok) {
      console.error('Telegram sendMessage API error:', data);
      // Fallback without parse_mode if HTML parsing failed
      payload.parse_mode = undefined;
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }
  } catch (error) {
    console.error('Failed to send Telegram message:', error);
  }
};

export const sendTelegramPhoto = async (photo: Blob | File, htmlCaption: string, showActivateButton = false) => {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`;
    const formData = new FormData();
    formData.append('chat_id', TELEGRAM_CHAT_ID);
    formData.append('photo', photo, (photo as File).name || 'proof.jpg');
    formData.append('caption', htmlCaption);
    formData.append('parse_mode', 'HTML');
    
    if (showActivateButton) {
      formData.append('reply_markup', JSON.stringify({
        inline_keyboard: [
          [{ text: '🟢 تفعيل الوكيل من لوحة التحكم', url: `${window.location.origin}/admin/manage-agents` }]
        ]
      }));
    }

    const res = await fetch(url, {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    if (!data.ok) {
      console.warn('Telegram sendPhoto returned error, retrying as document or text:', data);
      // Fallback to sendDocument or text message if photo fails
      await sendTelegramDocument(photo, htmlCaption, showActivateButton);
    }
  } catch (error) {
    console.error('Failed to send Telegram photo, attempting text fallback:', error);
    await sendTelegramMessage(htmlCaption, showActivateButton);
  }
};

export const sendTelegramDocument = async (document: Blob | File, htmlCaption: string, showActivateButton = false) => {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`;
    const formData = new FormData();
    formData.append('chat_id', TELEGRAM_CHAT_ID);
    formData.append('document', document, (document as File).name || 'document.pdf');
    formData.append('caption', htmlCaption);
    formData.append('parse_mode', 'HTML');
    
    if (showActivateButton) {
      formData.append('reply_markup', JSON.stringify({
        inline_keyboard: [
          [{ text: '🟢 تفعيل الوكيل من لوحة التحكم', url: `${window.location.origin}/admin/manage-agents` }]
        ]
      }));
    }

    const res = await fetch(url, {
      method: 'POST',
      body: formData
    });

    const data = await res.json();
    if (!data.ok) {
      console.error('Telegram sendDocument error:', data);
      await sendTelegramMessage(htmlCaption, showActivateButton);
    }
  } catch (error) {
    console.error('Failed to send Telegram document:', error);
    await sendTelegramMessage(htmlCaption, showActivateButton);
  }
};
