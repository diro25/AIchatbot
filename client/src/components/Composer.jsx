import { ArrowUp, RotateCcw, Square } from 'lucide-react';

export function Composer({ value, onChange, onSubmit, onStop, isStreaming, onRegenerate, canRegenerate }) {
  function keyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      onSubmit();
    }
  }
  return <div className="composer-dock"><div className="composer-meta"><span className="flex items-center gap-2"><span className="status-dot" /> Claude streaming enabled</span><span className="hidden sm:inline">Enter to send · Shift + Enter for a new line</span></div><div className="composer-box"><textarea value={value} onChange={(event) => onChange(event.target.value)} onKeyDown={keyDown} placeholder="Ask something worth thinking about…" rows={1} disabled={isStreaming} /><div className="flex items-center justify-between gap-3"><span className="font-mono text-[10px] text-slate-400">{value.length}/12,000</span><div className="flex items-center gap-2">{canRegenerate && <button className="secondary-button" type="button" onClick={onRegenerate} disabled={isStreaming}><RotateCcw size={14} /> <span className="hidden sm:inline">Regenerate</span></button>}{isStreaming ? <button className="stop-button" type="button" onClick={onStop}><Square size={13} fill="currentColor" /> Stop generating</button> : <button className="send-button" type="button" onClick={onSubmit} disabled={!value.trim()} aria-label="Send message"><ArrowUp size={17} /></button>}</div></div></div></div>;
}
