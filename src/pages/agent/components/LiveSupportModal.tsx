import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, User, X, ShieldAlert, Headphones } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { sendTelegramMessage } from '../../../lib/telegram';

interface LiveSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
  user: any;
}

export const LiveSupportModal: React.FC<LiveSupportModalProps> = ({
  isOpen,
  onClose,
  isDark = false,
  user,
}) => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !user?.agent_id) return;

    fetchMessages();

    // 1. Listen via BroadcastChannel for instant cross-tab updates from Admin
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('agent_support_channel');
      channel.onmessage = (event) => {
        if (event.data?.agent_id === user.agent_id) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === event.data.id || (m.created_at === event.data.created_at && m.message === event.data.message))) {
              return prev;
            }
            return [...prev, event.data];
          });
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
      };
    } catch (e) {}

    // 2. Storage event fallback
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'local_support_messages') {
        try {
          const allMsgs = JSON.parse(e.newValue || '[]');
          const myMsgs = allMsgs.filter((m: any) => m.agent_id === user.agent_id);
          setMessages(myMsgs);
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorage);

    // 3. Supabase Realtime channel
    const subscription = supabase
      .channel(`support_${user.agent_id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `agent_id=eq.${user.agent_id}`,
        },
        (payload) => {
          setMessages((prev) => {
            if (prev.some((m) => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
      )
      .subscribe();

    return () => {
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorage);
      supabase.removeChannel(subscription);
    };
  }, [isOpen, user]);

  const fetchMessages = async () => {
    try {
      let dbMsgs: any[] = [];
      try {
        const { data } = await supabase
          .from('support_messages')
          .select('*')
          .eq('agent_id', user?.agent_id)
          .order('created_at', { ascending: true });
        if (data) dbMsgs = data;
      } catch (err) {}

      let localMsgs: any[] = [];
      try {
        const all = JSON.parse(localStorage.getItem('local_support_messages') || '[]');
        localMsgs = all.filter((m: any) => m.agent_id === user?.agent_id);
      } catch (e) {}

      // Combine ensuring uniqueness
      const map = new Map();
      [...localMsgs, ...dbMsgs].forEach((m) => {
        const key = m.id || `${m.created_at}_${m.message}`;
        if (!map.has(key)) map.set(key, m);
      });

      const combined = Array.from(map.values()).sort(
        (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      setMessages(combined);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    setLoading(true);
    const text = newMessage.trim();
    setNewMessage('');

    const newMsgObj = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      agent_id: user.agent_id,
      sender: 'agent',
      message: text,
      created_at: new Date().toISOString(),
      is_read: false,
    };

    // Instant local state update
    setMessages((prev) => [...prev, newMsgObj]);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

    // Save to local storage
    try {
      const all = JSON.parse(localStorage.getItem('local_support_messages') || '[]');
      localStorage.setItem('local_support_messages', JSON.stringify([...all, newMsgObj]));
    } catch (e) {}

    // Broadcast cross-tab to Admin
    try {
      const channel = new BroadcastChannel('agent_support_channel');
      channel.postMessage(newMsgObj);
      channel.close();
    } catch (e) {}

    // Insert into Supabase
    try {
      await supabase.from('support_messages').insert([
        {
          agent_id: user.agent_id,
          sender: 'agent',
          message: text,
        },
      ]);
    } catch (err) {
      console.warn('Supabase message insert note:', err);
    }

    // Send Telegram Notification to Admin Bot
    const tgramMsg =
      `💬 <b>رسالة دعم جديدة من وكيل (Support Message)</b>\n\n` +
      `👤 <b>الوكيل:</b> ${user.full_name || 'Agent'} (<code>${user.agent_id}</code>)\n` +
      `💵 <b>الرصيد:</b> <code>${user.balance || 0} ${user.currency || 'USD'}</code>\n\n` +
      `📝 <b>الرسالة:</b>\n<i>"${text}"</i>\n\n` +
      `رد على الوكيل من خلال شاشة المحادثات في لوحة الإدارة.`;

    await sendTelegramMessage(tgramMsg);
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div
        className={`w-full max-w-md h-full flex flex-col shadow-2xl transition-all ${
          isDark ? 'bg-[#0B111E] text-white' : 'bg-white text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`p-4 border-b flex items-center justify-between ${
            isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50/70'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/10 text-blue-500 flex items-center justify-center font-bold">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">{t('live_support', 'الدعم المباشر والإدارة')}</h3>
              <span className="text-[11px] text-emerald-500 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                {t('support_online', 'متصل الآن &bull; مباشر')}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Thread */}
        <div className={`flex-1 p-4 overflow-y-auto space-y-3.5 ${isDark ? 'bg-[#080D18]' : 'bg-slate-50/50'}`}>
          {/* Welcome Message */}
          <div className="flex justify-start">
            <div
              className={`max-w-[85%] rounded-2xl rounded-tl-sm px-4 py-3 text-xs sm:text-sm border shadow-xs ${
                isDark
                  ? 'bg-slate-900 border-slate-800 text-slate-300'
                  : 'bg-white border-slate-200/80 text-slate-700'
              }`}
            >
              <div className="font-bold text-blue-500 mb-1 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>{t('admin_support_team', 'فريق الدعم الفني')}</span>
              </div>
              <p>
                {t(
                  'support_welcome_msg',
                  'مرحباً بك! يمكنك كتابة استفسارك أو طلبك هنا، وسيصلك الرد الفوري من الإدارة.'
                )}
              </p>
            </div>
          </div>

          {messages.map((m, i) => {
            const isMe = m.sender === 'agent';
            return (
              <div key={m.id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm shadow-xs ${
                    isMe
                      ? 'bg-blue-600 text-white rounded-br-xs'
                      : isDark
                      ? 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-xs'
                      : 'bg-white border border-slate-200/80 text-slate-800 rounded-bl-xs'
                  }`}
                >
                  <p className="leading-relaxed wrap-break-word">{m.message}</p>
                  <div
                    className={`text-[10px] mt-1 text-end ${
                      isMe ? 'text-blue-200' : isDark ? 'text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input Bar */}
        <div className={`p-3.5 border-t ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={t('type_message_here', 'اكتب رسالتك للدعم...')}
              className={`flex-1 rounded-2xl px-4 py-2.5 text-xs sm:text-sm border outline-hidden transition-all ${
                isDark
                  ? 'bg-slate-950 border-slate-800 text-white focus:border-blue-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500'
              }`}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || loading}
              className="w-10 h-10 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-all disabled:opacity-40 cursor-pointer shadow-md shadow-blue-600/20 active:scale-95 shrink-0"
            >
              <Send className="w-4 h-4 rtl:rotate-180" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
