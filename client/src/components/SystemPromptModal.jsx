import { useEffect, useState } from 'react';
import { Save, X } from 'lucide-react';

export function SystemPromptModal({ conversation, onClose, onSave }) {
  const [value, setValue] = useState(conversation.systemPrompt || '');
  const [pending, setPending] = useState(false);
  useEffect(() => setValue(conversation.systemPrompt || ''), [conversation.systemPrompt]);
  async function submit(event) {
    event.preventDefault();
    setPending(true);
    try { await onSave(value); onClose(); } finally { setPending(false); }
  }
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><form className="modal-card" onSubmit={submit}><div className="flex items-start justify-between gap-4"><div><p className="eyebrow text-emerald-700 dark:text-mint">Conversation control</p><h2 className="mt-2 text-xl font-semibold tracking-tight">System prompt</h2><p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Set the role, tone, or constraints for this thread. It stays private to this conversation.</p></div><button className="icon-button" type="button" onClick={onClose} aria-label="Close"><X size={18} /></button></div><textarea className="prompt-textarea" value={value} onChange={(event) => setValue(event.target.value)} placeholder="You are a thoughtful assistant…" maxLength={4000} /><div className="mt-3 flex items-center justify-between"><span className="font-mono text-[10px] text-slate-400">{value.length}/4,000</span><button className="primary-button" type="submit" disabled={pending}><Save size={15} /> {pending ? 'Saving…' : 'Save prompt'}</button></div></form></div>;
}
