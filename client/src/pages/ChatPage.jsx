import { useCallback, useEffect, useMemo, useState } from 'react';
import { Menu, MessageSquarePlus, MoreVertical, PanelLeft, Settings2, Sparkles } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { useChatStream } from '../hooks/useChatStream';
import { Sidebar } from '../components/Sidebar';
import { MessageList } from '../components/MessageList';
import { Composer } from '../components/Composer';
import { SystemPromptModal } from '../components/SystemPromptModal';
import { BrandMark } from '../components/BrandMark';

export function ChatPage() {
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [streamingText, setStreamingText] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const current = useMemo(() => conversations.find((item) => String(item.id) === String(conversationId)), [conversations, conversationId]);

  const refreshConversations = useCallback(async () => {
    const result = await api.conversations();
    setConversations(result.conversations);
    return result.conversations;
  }, []);

  useEffect(() => {
    refreshConversations().catch((requestError) => setError(requestError.message)).finally(() => setLoading(false));
  }, [refreshConversations]);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }
    setLoading(true);
    api.messages(conversationId).then(({ messages: nextMessages }) => setMessages(nextMessages)).catch((requestError) => { setMessages([]); setError(requestError.message); }).finally(() => setLoading(false));
  }, [conversationId]);

  const onEvent = useCallback((event, data) => {
    if (event === 'start') setStreamingText('');
    if (event === 'delta') setStreamingText((currentText) => currentText + data.text);
    if (event === 'done') {
      setMessages((currentMessages) => [...currentMessages, data.message]);
      setStreamingText('');
      refreshConversations().catch(() => {});
    }
    if (event === 'error') setError(data.message);
  }, [refreshConversations]);
  const { start, stop, isStreaming } = useChatStream({ onEvent });

  async function createConversation() {
    setError('');
    try {
      const result = await api.createConversation();
      setConversations((currentConversations) => [result.conversation, ...currentConversations]);
      navigate(`/chat/${result.conversation.id}`);
      setSidebarOpen(false);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function renameConversation(conversation) {
    const title = window.prompt('Name this conversation', conversation.title);
    if (!title?.trim() || title.trim() === conversation.title) return;
    try {
      const result = await api.updateConversation(conversation.id, { title: title.trim() });
      setConversations((items) => items.map((item) => item.id === conversation.id ? result.conversation : item));
    } catch (requestError) { setError(requestError.message); }
  }

  async function deleteConversation(conversation) {
    if (!window.confirm(`Delete “${conversation.title}”? This cannot be undone.`)) return;
    try {
      await api.deleteConversation(conversation.id);
      const remaining = conversations.filter((item) => item.id !== conversation.id);
      setConversations(remaining);
      if (String(conversation.id) === String(conversationId)) navigate(remaining[0] ? `/chat/${remaining[0].id}` : '/chat');
    } catch (requestError) { setError(requestError.message); }
  }

  async function savePrompt(systemPrompt) {
    try {
      const result = await api.updateConversation(current.id, { systemPrompt });
      setConversations((items) => items.map((item) => item.id === current.id ? result.conversation : item));
    } catch (requestError) {
      setError(requestError.message);
      throw requestError;
    }
  }

  async function sendMessage(regenerate = false) {
    if (!current || isStreaming || (!regenerate && !draft.trim())) return;
    setError('');
    const content = draft.trim();
    if (!regenerate) {
      setMessages((items) => [...items, { id: `pending-${Date.now()}`, role: 'user', content }]);
      setDraft('');
    } else {
      setMessages((items) => items.slice(0, -1));
    }
    try {
      await start(current.id, regenerate ? { regenerate: true } : { message: content });
      const result = await api.messages(current.id);
      setMessages(result.messages);
    } catch (requestError) {
      if (requestError.name !== 'AbortError') setError(requestError.message);
      const result = await api.messages(current.id).catch(() => ({ messages }));
      setMessages(result.messages);
      setStreamingText('');
    }
  }

  const hasAssistant = messages.at(-1)?.role === 'assistant';

  return <div className="workspace-shell">
    <div className={`sidebar-overlay ${sidebarOpen ? 'is-visible' : ''}`} onClick={() => setSidebarOpen(false)} />
    <div className={`sidebar-drawer ${sidebarOpen ? 'is-open' : ''}`}><Sidebar conversations={conversations} activeId={conversationId} onCreate={createConversation} onRename={renameConversation} onDelete={deleteConversation} onClose={() => setSidebarOpen(false)} /></div>
    <main className="workspace-main">
      <header className="workspace-header"><div className="flex min-w-0 items-center gap-3"><button className="icon-button lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open sidebar"><Menu size={19} /></button><div className="hidden sm:block lg:hidden"><BrandMark compact /></div><div className="min-w-0">{current ? <><p className="eyebrow truncate">Active thread</p><h1 className="truncate text-lg font-semibold tracking-tight">{current.title}</h1></> : <><p className="eyebrow">Signal Room</p><h1 className="text-lg font-semibold tracking-tight">Your conversations</h1></>}</div></div><div className="flex items-center gap-2">{current && <><span className="hidden items-center gap-2 rounded-full border border-black/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500 dark:border-white/10 sm:flex"><span className="status-dot" /> Synced</span><button className="secondary-button" onClick={() => setPromptOpen(true)}><Settings2 size={15} /> <span className="hidden sm:inline">System prompt</span></button></>}{!current && <button className="primary-button" onClick={createConversation}><MessageSquarePlus size={16} /> Start a thread</button>}<button className="icon-button hidden sm:inline-flex" aria-label="More options"><MoreVertical size={18} /></button></div></header>
      {error && <div className="error-banner" role="alert"><span>{error}</span><button type="button" onClick={() => setError('')}>Dismiss</button></div>}
      <div className="workspace-scroll"><div className="chat-canvas">{loading && conversationId ? <div className="chat-loading"><span className="status-dot" /> Loading history…</div> : current ? <MessageList messages={messages} streamingText={streamingText} isStreaming={isStreaming} /> : <div className="welcome-panel"><div className="welcome-kicker"><Sparkles size={15} /> A calm place to think</div><h2>Make your context work harder.</h2><p>Create a thread for every question worth revisiting. Your history stays close, your system prompt stays intentional, and every useful answer has a place to land.</p><button className="primary-button mt-6" onClick={createConversation}>Create your first thread <MessageSquarePlus size={16} /></button></div>}</div></div>
      {current && <Composer value={draft} onChange={setDraft} onSubmit={() => sendMessage(false)} onStop={stop} isStreaming={isStreaming} onRegenerate={() => sendMessage(true)} canRegenerate={hasAssistant} />}
    </main>
    {promptOpen && current && <SystemPromptModal conversation={current} onClose={() => setPromptOpen(false)} onSave={savePrompt} />}
  </div>;
}
