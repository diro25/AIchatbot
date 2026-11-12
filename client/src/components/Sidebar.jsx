import { useState } from 'react';
import { Archive, LogOut, Menu, MoreHorizontal, Pencil, Plus, Search, Settings2, SunMoon, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BrandMark } from './BrandMark';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

function formatDate(value) {
  const date = new Date(value);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function Sidebar({ conversations, activeId, onCreate, onRename, onDelete, onClose }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toggleTheme } = useTheme();
  const [query, setQuery] = useState('');
  const visible = conversations.filter((conversation) => conversation.title.toLowerCase().includes(query.toLowerCase()));

  async function signOut() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <aside className="sidebar-panel">
      <div className="flex items-center justify-between px-5 pb-7 pt-6"><BrandMark compact /><button type="button" className="icon-button lg:hidden" onClick={onClose} aria-label="Close sidebar"><X size={18} /></button></div>
      <div className="px-4">
        <button type="button" className="primary-button mb-5 w-full justify-center" onClick={onCreate}><Plus size={17} /> New conversation</button>
        <label className="search-wrap"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search conversations" /></label>
      </div>
      <div className="sidebar-section-label"><span>Recent threads</span><span className="font-mono text-[10px]">{visible.length}</span></div>
      <nav className="conversation-list" aria-label="Conversations">
        {visible.length === 0 && <div className="px-5 py-8 text-center text-xs leading-5 text-slate-500">No threads match that search.</div>}
        {visible.map((conversation) => (
          <div key={conversation.id} className={`conversation-row ${String(activeId) === String(conversation.id) ? 'is-active' : ''}`}>
            <button type="button" className="min-w-0 flex-1 text-left" onClick={() => { navigate(`/chat/${conversation.id}`); onClose?.(); }}>
              <span className="block truncate text-sm font-medium">{conversation.title}</span>
              <span className="mt-1 flex items-center gap-2 truncate text-[11px] text-slate-500"><span className="status-dot muted" /> {formatDate(conversation.updatedAt)}</span>
            </button>
            <div className="relative"><details className="conversation-menu"><summary aria-label={`Actions for ${conversation.title}`}><MoreHorizontal size={16} /></summary><div className="menu-popover"><button type="button" onClick={() => onRename(conversation)}><Pencil size={14} /> Rename</button><button className="danger" type="button" onClick={() => onDelete(conversation)}><Trash2 size={14} /> Delete</button></div></details></div>
          </div>
        ))}
      </nav>
      <div className="mt-auto border-t border-black/10 p-4 dark:border-white/10">
        <div className="mb-4 flex items-center gap-3 rounded-xl bg-black/[0.04] px-3 py-3 dark:bg-white/[0.05]"><div className="avatar">{user?.email?.[0]?.toUpperCase() || 'S'}</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold">{user?.email}</p><p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-slate-500">Member</p></div></div>
        <div className="grid grid-cols-3 gap-1"><button type="button" className="utility-button" onClick={toggleTheme}><SunMoon size={15} /><span>Theme</span></button><button type="button" className="utility-button" onClick={() => navigate('/chat')}><Settings2 size={15} /><span>Focus</span></button><button type="button" className="utility-button" onClick={signOut}><LogOut size={15} /><span>Log out</span></button></div>
      </div>
    </aside>
  );
}
