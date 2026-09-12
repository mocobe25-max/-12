import React, { useState, useEffect, useRef } from 'react';
import { X, Send, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../../lib/supabase';
import { sendTelegramMessage } from '../../../lib/telegram';

interface LiveSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  user: any;
}

export const LiveSupportModal: React.FC<LiveSupportModalProps> = ({
  isOpen,
  onClose,
  isDark,
  user
}) => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && user?.agent_id) {
      fetchMessages();
      
      // Subscribe to new messages
      const subscription = supabase
        .channel('support_messages_channel')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'support_messages',
          filter: `agent_id=eq.${user.agent_id}`
        }, (payload) => {
          setMessages(prev => [...prev, payload.new]);
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        })
        .subscribe();
        
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [isOpen, user]);

  const fetchMessages = async () => {
    try {
      const { data } = await supabase
        .from('support_messages')
        .select('*')
        .eq('agent_id', user?.agent_id)
        .order('created_at', { ascending: true });
        
      if (data) {
        setMessages(data);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    setLoading(true);
    const msgText = newMessage.trim();
    setNewMessage('');

    const newMsgObj = {
      id: 'msg_' + Date.now(),
      agent_id: user?.agent_id,
      sender: 'agent',
      message: msgText,
      created_at: new Date().toISOString()
    };
    
    // Immediate optimistic update
    setMessages(prev => [...prev, newMsgObj]);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

    try {
      await supabase.from('support_messages').insert([
        {
          agent_id: user?.agent_id,
          sender: 'agent',
          message: msgText
        }
      ]);
      
      const tgramMsg = `📩 <b>New Support Message</b>\n\n<b>From:</b> ${user?.full_name} (<code>${user?.agent_id}</code>)\n<b>Message:</b>\n${msgText}\n\n<i>Reply from Admin Panel.</i>`;
      await sendTelegramMessage(tgramMsg);
    } catch (err) {
      console.warn('Support msg note:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className={`w-full max-w-md h-full flex flex-col shadow-2xl transition-all ${isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}`}>
        <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base">{t('live_support', 'الدعم المباشر')}</h3>
              <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Online
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className={`flex-1 p-4 overflow-y-auto space-y-4 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
          {messages.length === 0 && (
            <div className="text-center text-slate-400 text-sm mt-10">
              {t('start_chat_desc', 'كيف يمكننا مساعدتك اليوم؟')}
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.sender === 'agent' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                m.sender === 'agent' 
                  ? 'bg-blue-600 text-white rounded-br-sm' 
                  : isDark ? 'bg-slate-800 text-white rounded-bl-sm' : 'bg-white text-slate-800 shadow-sm border border-slate-100 rounded-bl-sm'
              }`}>
                {m.message}
                <div className={`text-[10px] mt-1 text-right ${m.sender === 'agent' ? 'text-blue-200' : 'text-slate-400'}`}>
                  {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        
        <div className={`p-4 border-t ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-white'}`}>
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={t('type_message', 'اكتب رسالتك هنا...')}
              className={`flex-1 rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                isDark ? 'bg-slate-800 text-white placeholder-slate-400' : 'bg-slate-100 text-slate-900 placeholder-slate-500'
              }`}
            />
            <button 
              type="submit" 
              disabled={loading || !newMessage.trim()}
              className="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-50"
            >
              <Send className="w-5 h-5 -ml-1" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
