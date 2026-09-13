import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';
import { Search, Send, User, MessageSquare, Headphones, ShieldCheck, CheckCheck } from 'lucide-react';

export default function AdminSupport() {
  const { t } = useTranslation();
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [search, setSearch] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAgents();

    // 1. BroadcastChannel listener for real-time messages from agents
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('agent_support_channel');
      channel.onmessage = (event) => {
        if (event.data) {
          fetchAgents();
          if (selectedAgent && event.data.agent_id === selectedAgent.agent_id) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === event.data.id || (m.created_at === event.data.created_at && m.message === event.data.message))) {
                return prev;
              }
              return [...prev, event.data];
            });
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
          }
        }
      };
    } catch (e) {}

    // 2. Storage event listener
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'local_support_messages') {
        fetchAgents();
        if (selectedAgent) {
          fetchMessages(selectedAgent.agent_id);
        }
      }
    };
    window.addEventListener('storage', handleStorage);

    // 3. Supabase Realtime
    const sub = supabase
      .channel('admin_support_channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages' }, (payload) => {
        fetchAgents();
        if (selectedAgent && payload.new?.agent_id === selectedAgent.agent_id) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
      })
      .subscribe();

    return () => {
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorage);
      supabase.removeChannel(sub);
    };
  }, [selectedAgent]);

  useEffect(() => {
    if (selectedAgent) {
      fetchMessages(selectedAgent.agent_id);
    }
  }, [selectedAgent]);

  const fetchAgents = async () => {
    try {
      let dbAgents: any[] = [];
      try {
        const { data } = await supabase.from('agents').select('*').order('created_at', { ascending: false });
        if (data) dbAgents = data;
      } catch (e) {}

      let localAgents: any[] = [];
      try {
        localAgents = JSON.parse(localStorage.getItem('local_registered_agents') || '[]');
      } catch (e) {}

      const allAgentsMap = new Map();
      [...dbAgents, ...localAgents].forEach((a) => {
        if (!allAgentsMap.has(a.agent_id)) allAgentsMap.set(a.agent_id, a);
      });
      const allAgents = Array.from(allAgentsMap.values());
      setAgents(allAgents);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMessages = async (agentId: string) => {
    try {
      let dbMsgs: any[] = [];
      try {
        const { data } = await supabase
          .from('support_messages')
          .select('*')
          .eq('agent_id', agentId)
          .order('created_at', { ascending: true });
        if (data) dbMsgs = data;
      } catch (e) {}

      let localMsgs: any[] = [];
      try {
        const all = JSON.parse(localStorage.getItem('local_support_messages') || '[]');
        localMsgs = all.filter((m: any) => m.agent_id === agentId);
      } catch (e) {}

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

      // Mark as read in Supabase
      try {
        await supabase
          .from('support_messages')
          .update({ is_read: true })
          .eq('agent_id', agentId)
          .eq('sender', 'agent');
      } catch (e) {}
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedAgent) return;

    const msg = newMessage.trim();
    setNewMessage('');

    const newMsgObj = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      agent_id: selectedAgent.agent_id,
      sender: 'admin',
      message: msg,
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

    // Broadcast to Agent tab via BroadcastChannel
    try {
      const channel = new BroadcastChannel('agent_support_channel');
      channel.postMessage(newMsgObj);
      channel.close();
    } catch (e) {}

    // Save to Supabase
    try {
      await supabase.from('support_messages').insert([
        {
          agent_id: selectedAgent.agent_id,
          sender: 'admin',
          message: msg,
          is_read: false,
        },
      ]);
    } catch (e) {
      console.warn('Supabase message insert fallback:', e);
    }
  };

  const filteredAgents = agents.filter(
    (a) =>
      a.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.agent_id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto h-[calc(100vh-5rem)] flex flex-col sm:flex-row gap-6 font-sans">
      {/* Sidebar / Agent List */}
      <div className="w-full sm:w-80 md:w-96 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col shrink-0">
        <div className="p-4 border-b border-gray-100 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base text-gray-900 flex items-center gap-2">
              <Headphones className="w-5 h-5 text-blue-600" />
              <span>{t('support_tickets', 'محادثات الدعم والوكلاء')}</span>
            </h2>
            <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">
              {agents.length}
            </span>
          </div>

          <div className="relative mt-3">
            <Search className="w-4 h-4 text-gray-400 absolute start-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t('search_agent', 'ابحث عن وكيل بالاسم أو الـ ID...')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm outline-hidden focus:border-blue-500"
              dir="auto"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredAgents.map((a) => (
            <button
              key={a.agent_id}
              onClick={() => setSelectedAgent(a)}
              className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all text-start border ${
                selectedAgent?.agent_id === a.agent_id
                  ? 'bg-blue-50 border-blue-200 text-blue-900 shadow-xs'
                  : 'hover:bg-gray-50 border-transparent text-gray-700'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                {a.full_name?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-xs sm:text-sm text-gray-900 truncate">{a.full_name}</div>
                <div className="text-[11px] text-gray-400 font-mono flex items-center gap-2">
                  <span>ID: {a.agent_id}</span>
                  <span>&bull;</span>
                  <span>{a.currency || 'USD'}</span>
                </div>
              </div>
            </button>
          ))}

          {filteredAgents.length === 0 && (
            <div className="p-8 text-center text-gray-400 text-xs">
              {t('no_agents_found', 'لا يوجد وكلاء متطابقون')}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        {selectedAgent ? (
          <>
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                  {selectedAgent.full_name?.[0]?.toUpperCase() || 'A'}
                </div>
                <div>
                  <div className="font-bold text-sm sm:text-base text-gray-900">{selectedAgent.full_name}</div>
                  <div className="text-xs text-gray-500 font-mono flex items-center gap-2">
                    <span>ID: {selectedAgent.agent_id}</span>
                    <span>&bull;</span>
                    <span className="text-emerald-600 font-semibold">
                      الرصيد: {selectedAgent.balance || 0} {selectedAgent.currency || 'USD'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>متصل للدردشة</span>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto bg-slate-50/60 space-y-3">
              {messages.map((m, i) => {
                const isAdmin = m.sender === 'admin';
                return (
                  <div key={m.id || i} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm shadow-xs ${
                        isAdmin
                          ? 'bg-blue-600 text-white rounded-br-xs'
                          : 'bg-white text-gray-800 border border-gray-200/80 rounded-bl-xs'
                      }`}
                    >
                      <p className="leading-relaxed wrap-break-word">{m.message}</p>
                      <div
                        className={`text-[10px] mt-1 text-end ${
                          isAdmin ? 'text-blue-200' : 'text-gray-400'
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

            <div className="p-3 sm:p-4 border-t border-gray-100 bg-white">
              <form onSubmit={handleSend} className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={t('type_message_to_agent', 'اكتب رسالتك للوكيل مباشرة...')}
                  className="flex-1 rounded-2xl px-4 py-2.5 border border-gray-200 focus:outline-hidden focus:border-blue-500 text-xs sm:text-sm"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-40 transition-all cursor-pointer shadow-md shadow-blue-600/20 active:scale-95 shrink-0"
                >
                  <Send className="w-4 h-4 rtl:rotate-180" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3 p-6">
            <MessageSquare className="w-14 h-14 text-gray-200" strokeWidth={1.5} />
            <p className="text-sm font-medium">{t('select_agent_to_chat', 'اختر وكيلاً من القائمة لبدء المحادثة الفورية معه.')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
