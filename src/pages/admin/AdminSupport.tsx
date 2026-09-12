import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';
import { Search, Send, User } from 'lucide-react';

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
    
    // Subscribe to any new messages
    const sub = supabase.channel('admin_support_channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages' }, () => {
        // If a new message comes in, refresh the agent list (to update unread or last message)
        fetchAgents();
      })
      .subscribe();
      
    return () => { sub.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (selectedAgent) {
      fetchMessages(selectedAgent.agent_id);
      
      const sub = supabase.channel('active_chat')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'support_messages',
          filter: `agent_id=eq.${selectedAgent.agent_id}`
        }, (payload) => {
          setMessages(prev => [...prev, payload.new]);
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        })
        .subscribe();
        
      return () => { sub.unsubscribe(); };
    }
  }, [selectedAgent]);

  const fetchAgents = async () => {
    // Get all agents that have sent messages
    const { data } = await supabase.from('support_messages').select('agent_id').order('created_at', { ascending: false });
    if (data) {
      const uniqueIds = [...new Set(data.map(m => m.agent_id))];
      
      const { data: agentsData } = await supabase.from('agents').select('*').in('agent_id', uniqueIds);
      if (agentsData) setAgents(agentsData);
    }
  };

  const fetchMessages = async (agentId: string) => {
    const { data } = await supabase.from('support_messages').select('*').eq('agent_id', agentId).order('created_at', { ascending: true });
    if (data) {
      setMessages(data);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      
      // Mark as read (simplified)
      await supabase.from('support_messages').update({ is_read: true }).eq('agent_id', agentId).eq('sender', 'agent');
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedAgent) return;
    
    const msg = newMessage.trim();
    setNewMessage('');
    
    await supabase.from('support_messages').insert([
      { agent_id: selectedAgent.agent_id, sender: 'admin', message: msg, is_read: false }
    ]);
  };

  const filteredAgents = agents.filter(a => a.full_name?.toLowerCase().includes(search.toLowerCase()) || a.agent_id?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 max-w-7xl mx-auto h-[calc(100vh-2rem)] flex gap-6">
      {/* Sidebar / Agent List */}
      <div className="w-1/3 bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col">
        <div className="p-4 border-b">
          <h2 className="font-bold text-lg">{t('support_tickets', 'تذاكر الدعم')}</h2>
          <div className="relative mt-2">
            <Search className="w-4 h-4 text-gray-400 absolute start-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder={t('search_agent', 'ابحث عن وكيل...')} 
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border rounded-lg text-sm"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredAgents.map(a => (
            <button 
              key={a.agent_id} 
              onClick={() => setSelectedAgent(a)}
              className={`w-full p-4 flex items-center gap-3 border-b text-left hover:bg-gray-50 transition-colors ${selectedAgent?.agent_id === a.agent_id ? 'bg-blue-50/50' : ''}`}
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">
                {a.full_name?.[0]?.toUpperCase() || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm truncate">{a.full_name}</div>
                <div className="text-xs text-gray-500 font-mono">{a.agent_id}</div>
              </div>
            </button>
          ))}
          {filteredAgents.length === 0 && (
            <div className="p-8 text-center text-gray-400 text-sm">{t('no_messages', 'لا توجد رسائل')}</div>
          )}
        </div>
      </div>
      
      {/* Chat Area */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col">
        {selectedAgent ? (
          <>
            <div className="p-4 border-b flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                {selectedAgent.full_name?.[0]?.toUpperCase() || 'A'}
              </div>
              <div>
                <div className="font-bold">{selectedAgent.full_name}</div>
                <div className="text-xs text-gray-500 font-mono">{selectedAgent.agent_id}</div>
              </div>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50 space-y-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${m.sender === 'admin' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-sm'}`}>
                    {m.message}
                    <div className={`text-[10px] mt-1 text-right ${m.sender === 'admin' ? 'text-blue-200' : 'text-gray-400'}`}>
                      {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            
            <div className="p-4 border-t bg-white">
              <form onSubmit={handleSend} className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={t('type_message', 'اكتب رسالتك...')}
                  className="flex-1 rounded-full px-4 py-2 border focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <button type="submit" disabled={!newMessage.trim()} className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-50">
                  <Send className="w-4 h-4 -ml-0.5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-4">
            <User className="w-16 h-16 opacity-20" />
            <p>{t('select_agent_to_chat', 'اختر وكيلاً لبدء المحادثة')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
