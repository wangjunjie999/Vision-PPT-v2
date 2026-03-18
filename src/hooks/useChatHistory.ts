import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type Message = { role: 'user' | 'assistant'; content: string; provider?: string };

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export function useChatHistory() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const savingRef = useRef(false);

  // Load conversation list
  const loadConversations = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('chat_conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(50);
    if (data) setConversations(data as Conversation[]);
  }, [user]);

  // Load messages for a conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    if (!user) return;
    setLoadingHistory(true);
    const { data } = await supabase
      .from('chat_messages')
      .select('role, content, provider')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (data) {
      setMessages(data.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content, provider: m.provider || undefined })));
    }
    setActiveConversationId(conversationId);
    setLoadingHistory(false);
  }, [user]);

  // Resume last conversation on mount
  useEffect(() => {
    if (!user) return;
    (async () => {
      await loadConversations();
      // Try to resume the last active conversation
      const lastId = localStorage.getItem('ai-active-conversation');
      if (lastId) {
        await loadMessages(lastId);
      }
    })();
  }, [user, loadConversations, loadMessages]);

  // Persist active conversation id
  useEffect(() => {
    if (activeConversationId) {
      localStorage.setItem('ai-active-conversation', activeConversationId);
    }
  }, [activeConversationId]);

  // Create a new conversation
  const createConversation = useCallback(async (firstMessage: string): Promise<string | null> => {
    if (!user) return null;
    const title = firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '');
    const { data, error } = await supabase
      .from('chat_conversations')
      .insert({ user_id: user.id, title })
      .select('id')
      .single();
    if (error || !data) return null;
    const id = data.id;
    setActiveConversationId(id);
    setConversations(prev => [{ id, title, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }, ...prev]);
    return id;
  }, [user]);

  // Save a message to DB (fire-and-forget)
  const saveMessage = useCallback(async (conversationId: string, msg: Message) => {
    if (!user || savingRef.current) return;
    await supabase.from('chat_messages').insert({
      conversation_id: conversationId,
      user_id: user.id,
      role: msg.role,
      content: msg.content,
      provider: msg.provider || null,
    });
    // Update conversation timestamp
    await supabase.from('chat_conversations').update({ updated_at: new Date().toISOString() }).eq('id', conversationId);
  }, [user]);

  // Start new chat
  const startNewChat = useCallback(() => {
    setActiveConversationId(null);
    setMessages([]);
    localStorage.removeItem('ai-active-conversation');
  }, []);

  // Delete a conversation
  const deleteConversation = useCallback(async (id: string) => {
    await supabase.from('chat_conversations').delete().eq('id', id);
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConversationId === id) {
      startNewChat();
    }
  }, [activeConversationId, startNewChat]);

  return {
    conversations,
    activeConversationId,
    messages,
    setMessages,
    loadingHistory,
    loadConversations,
    loadMessages,
    createConversation,
    saveMessage,
    startNewChat,
    deleteConversation,
  };
}
